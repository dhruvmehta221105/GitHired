const { WebSocketServer } = require("ws");
const Interview = require("../models/Interview");
const { authenticateWebSocket } = require("../middleware/websocketAuth");
const transcriptionService = require("../services/transcriptionService");
const config = require("../config/env");

const canAccess = (interview, user) =>
  user.role === "admin" || interview.userId?.toString() === user.id;

const getInterviewId = (request) => {
  const url = new URL(request.url, "http://localhost");
  return url.searchParams.get("interviewId");
};

const sendJson = (socket, message) => {
  if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(message));
};

const attachTranscriptionSocket = (server, options = {}) => {
  const wss = new WebSocketServer({ noServer: true });
  const createSession = options.createSession || transcriptionService.createLiveSession;
  const findInterview = options.findInterview || ((id) => Interview.findById(id));
  const authenticate = options.authenticate || authenticateWebSocket;

  server.on("upgrade", async (request, socket, head) => {
    const requestUrl = new URL(request.url, "http://localhost");
    if (requestUrl.pathname !== config.transcriptionSocketPath) return;

    try {
      const user = await authenticate(request);
      const interviewId = getInterviewId(request);
      if (!interviewId) throw new Error("Interview ID is required");

      const interview = await findInterview(interviewId);
      if (!interview || !canAccess(interview, user)) throw new Error("Interview access denied");
      if (interview.status !== "in-progress") throw new Error("Interview is not in progress");

      wss.handleUpgrade(request, socket, head, (client) => {
        wss.emit("connection", client, { user, interviewId });
      });
    } catch (error) {
      socket.write("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n");
      socket.destroy();
    }
  });

  wss.on("connection", (client, context) => {
    const session = createSession({
      uid: `githired-${context.interviewId}-${Date.now()}`
    });
    let closed = false;

    const cleanup = () => {
      if (closed) return;
      closed = true;
      session.close();
    };

    session.on("ready", () => sendJson(client, { type: "ready" }));
    session.on("transcript", (message) => sendJson(client, {
      type: "transcript",
      segments: message.segments
    }));
    session.on("error", (error) => {
      sendJson(client, { type: "error", message: error.message });
      if (!session.ready) client.close(1011, "Transcription provider unavailable");
    });
    session.on("close", () => {
      if (!closed) {
        sendJson(client, { type: "provider_closed" });
        client.close(1011, "Transcription provider disconnected");
      }
    });

    client.on("message", (payload, isBinary) => {
      if (!isBinary) {
        sendJson(client, { type: "error", message: "Only binary PCM audio frames are accepted" });
        return;
      }
      try {
        session.sendAudio(payload);
      } catch (error) {
        sendJson(client, { type: "error", message: error.message });
      }
    });

    client.on("close", cleanup);
    client.on("error", cleanup);

    session.connect().catch((error) => {
      sendJson(client, { type: "error", message: error.message });
      client.close(1011, "Unable to connect to transcription provider");
      cleanup();
    });
  });

  return wss;
};

module.exports = { attachTranscriptionSocket, canAccess };
