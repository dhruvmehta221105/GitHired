const ServiceError = require("./serviceError");
const storageService = require("./storageService");
const provider = require("./transcription/scribecrateRestProvider");

const transcribeAudio = async (file) => {
  let storedAudio;
  try {
    storedAudio = await storageService.storeAudio(file);
    const text = await provider.transcribe(storageService.getObjectPath(storedAudio.storageKey));
    return { text, audio: storedAudio };
  } catch (error) {
    if (storedAudio) await storageService.removeAudio(storedAudio.storageKey);
    if (error instanceof ServiceError) throw error;
    throw new ServiceError("Transcription failed", 502);
  }
};

const createLiveSession = (options = {}) => {
  const { createScribecrateSession } = require("./transcription/scribecrateProvider");
  return createScribecrateSession(options);
};

module.exports = { transcribeAudio, createLiveSession };
