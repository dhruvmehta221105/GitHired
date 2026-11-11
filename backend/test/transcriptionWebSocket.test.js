const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("http");
const { WebSocket, WebSocketServer } = require("ws");
const { createScribecrateSession } = require("../services/transcription/scribecrateProvider");
const { attachTranscriptionSocket } = require("../websocket/transcriptionSocket");

const waitForMessage = (socket) => new Promise((resolve, reject) => {
  const onMessage = (payload) => {
    cleanup();
    resolve(JSON.parse(payload.toString()));
  };
  const onError = (error) => {
    cleanup();
    reject(error);
  };
  const cleanup = () => {
    socket.off("message", onMessage);
    socket.off("error", onError);
  };
  socket.on("message", onMessage);
  socket.on("error", onError);
});

test("ScribeCrate provider sends the documented handshake and binary audio", async () => {
  const upstream = new WebSocketServer({ port: 0 });
  const received = [];
  let upstreamClient;

  upstream.on("connection", (client) => {
    upstreamClient = client;
    client.once("message", (payload) => {
      received.push(JSON.parse(payload.toString()));
      client.send(JSON.stringify({ message: "SERVER_READY" }));
    });
  });

  await new Promise((resolve) => upstream.once("listening", resolve));
  const port = upstream.address().port;
  const session = createScribecrateSession({
    uid: "test-session",
    WebSocket,
    config: {
      wsUrl: `ws://127.0.0.1:${port}`,
      apiKey: "test-key",
      model: "base",
      language: "en",
      timeoutMs: 1000
    }
  });

  try {
    await session.connect();
    assert.deepEqual(received[0], {
      uid: "test-session",
      language: "en",
      model: "base",
      task: "transcribe",
      audio_format: "float32",
      use_vad: true
    });

    const audio = Buffer.from(new Float32Array([0.1, -0.1]).buffer);
    const audioPromise = new Promise((resolve) => upstreamClient.once("message", resolve));
    session.sendAudio(audio);
    assert.deepEqual(Buffer.from(await audioPromise), audio);
  } finally {
    session.close();
    await new Promise((resolve) => upstream.close(resolve));
  }
});

test("transcription proxy authenticates, validates interview access, and forwards events", async () => {
  const upstream = new WebSocketServer({ port: 0 });
  let upstreamClient;
  let receivedAudio;

  upstream.on("connection", (client) => {
    upstreamClient = client;
    client.once("message", () => client.send(JSON.stringify({ message: "SERVER_READY" })));
    client.on("message", (payload, isBinary) => {
      if (isBinary) {
        receivedAudio = Buffer.from(payload);
        client.send(JSON.stringify({ segments: [{ text: "hello world" }] }));
      }
    });
  });
  await new Promise((resolve) => upstream.once("listening", resolve));

  const httpServer = http.createServer();
  attachTranscriptionSocket(httpServer, {
    authenticate: async () => ({ id: "user-1", role: "user" }),
    findInterview: async () => ({ userId: "user-1", status: "in-progress" }),
    createSession: (options) => createScribecrateSession({
      ...options,
      WebSocket,
      config: {
        wsUrl: `ws://127.0.0.1:${upstream.address().port}`,
        apiKey: "test-key",
        model: "base",
        language: "en",
        timeoutMs: 1000
      }
    })
  });
  await new Promise((resolve) => httpServer.listen(0, "127.0.0.1", resolve));

  const client = new WebSocket(
    `ws://127.0.0.1:${httpServer.address().port}/ws/transcription?interviewId=interview-1&token=test`
  );
  try {
    const ready = await waitForMessage(client);
    assert.deepEqual(ready, { type: "ready" });

    const audio = Buffer.from(new Float32Array([0.25, -0.25]).buffer);
    client.send(audio);
    const transcript = await waitForMessage(client);
    assert.deepEqual(transcript, {
      type: "transcript",
      segments: [{ text: "hello world" }]
    });
    assert.deepEqual(receivedAudio, audio);
  } finally {
    client.close();
    await new Promise((resolve) => client.once("close", resolve));
    await new Promise((resolve) => httpServer.close(resolve));
    await new Promise((resolve) => upstream.close(resolve));
    assert.ok([WebSocket.CLOSING, WebSocket.CLOSED].includes(upstreamClient.readyState));
  }
});
