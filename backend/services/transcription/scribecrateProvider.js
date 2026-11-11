const { EventEmitter } = require("events");
const WebSocket = require("ws");
const { getScribecrateConfig } = require("./transcriptionConfig");
const ServiceError = require("../serviceError");

const appendToken = (url, token) => {
  const parsed = new URL(url);
  parsed.searchParams.set("token", token);
  return parsed.toString();
};

class ScribecrateSession extends EventEmitter {
  constructor(options = {}) {
    super();
    this.WebSocket = options.WebSocket || WebSocket;
    this.config = { ...getScribecrateConfig(), ...(options.config || {}) };
    this.config.uid = options.uid || this.config.uid || `scribecrate-${Date.now()}`;
    this.socket = null;
    this.ready = false;
    this.closed = false;
    this.connectTimer = null;
  }

  connect() {
    if (this.socket) throw new ServiceError("ScribeCrate session is already connected", 409);

    return new Promise((resolve, reject) => {
      let settled = false;
      const finishConnect = (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(this.connectTimer);
        if (error) reject(error);
        else resolve();
      };

      let socket;
      try {
        socket = new this.WebSocket(appendToken(this.config.wsUrl, this.config.apiKey));
      } catch (error) {
        finishConnect(new ServiceError("Unable to connect to ScribeCrate", 502));
        return;
      }

      this.socket = socket;
      this.connectTimer = setTimeout(() => {
        socket.close();
        finishConnect(new ServiceError("ScribeCrate connection timed out", 504));
      }, this.config.timeoutMs);

      socket.on("open", () => {
        socket.send(JSON.stringify({
          uid: this.config.uid,
          language: this.config.language,
          model: this.config.model,
          task: "transcribe",
          audio_format: "float32",
          use_vad: true
        }));
      });

      socket.on("message", (payload, isBinary) => {
        if (isBinary) return;

        let message;
        try {
          message = JSON.parse(payload.toString());
        } catch (error) {
          const protocolError = new ServiceError("Invalid message from ScribeCrate", 502);
          this.emit("error", protocolError);
          return;
        }

        if (message.message === "SERVER_READY") {
          this.ready = true;
          finishConnect();
          this.emit("ready");
        }

        if (Array.isArray(message.segments)) {
          this.emit("transcript", message);
        }

        if (message.error) {
          this.emit("error", new ServiceError(`ScribeCrate error: ${message.error}`, 502));
        }
      });

      socket.on("error", (error) => {
        const serviceError = new ServiceError(`ScribeCrate connection failed: ${error.message}`, 502);
        this.emit("error", serviceError);
        finishConnect(serviceError);
      });

      socket.on("close", (code, reason) => {
        clearTimeout(this.connectTimer);
        this.ready = false;
        this.emit("close", { code, reason: reason.toString() });
        finishConnect(new ServiceError("ScribeCrate connection closed before ready", 502));
      });
    });
  }

  sendAudio(payload) {
    if (!this.socket || this.socket.readyState !== this.WebSocket.OPEN) {
      throw new ServiceError("ScribeCrate session is not open", 503);
    }
    if (!this.ready) {
      throw new ServiceError("ScribeCrate session is not ready", 503);
    }
    if (!Buffer.isBuffer(payload) && !(payload instanceof ArrayBuffer) && !ArrayBuffer.isView(payload)) {
      throw new ServiceError("Audio payload must be binary PCM data", 400);
    }
    this.socket.send(payload);
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    clearTimeout(this.connectTimer);
    if (this.socket && this.socket.readyState === this.WebSocket.OPEN) {
      this.socket.close(1000, "Session complete");
    } else if (this.socket) {
      this.socket.terminate();
    }
    this.socket = null;
    this.ready = false;
  }
}

const createScribecrateSession = (options) => new ScribecrateSession(options);

module.exports = { ScribecrateSession, createScribecrateSession, appendToken };
