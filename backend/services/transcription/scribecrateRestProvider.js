const fs = require("fs");
const config = require("../../config/env");
const ServiceError = require("../serviceError");

const transcribe = async (filePath) => {
  const form = new FormData();
  form.append("file", new Blob([await fs.promises.readFile(filePath)]), "recording");
  form.append("model", config.scribecrateModel);

  let response;
  try {
    response = await fetch(`${config.scribecrateRestUrl}/v1/audio/transcriptions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.scribecrateApiKey}` },
      body: form
    });
  } catch (error) {
    throw new ServiceError("ScribeCrate REST service is unavailable", 502);
  }

  if (!response.ok) {
    throw new ServiceError(`ScribeCrate REST transcription failed (${response.status})`, 502);
  }

  const result = await response.json();
  const text = typeof result.text === "string" ? result.text.trim() : "";
  if (!text) throw new ServiceError("ScribeCrate returned no transcription", 502);
  return text;
};

module.exports = { transcribe };
