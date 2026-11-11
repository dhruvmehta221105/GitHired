const config = require("../../config/env");
const ServiceError = require("../serviceError");

const getScribecrateConfig = () => {
  if (!config.scribecrateWsUrl) {
    throw new ServiceError("ScribeCrate WebSocket URL is not configured", 503);
  }
  if (!config.scribecrateApiKey) {
    throw new ServiceError("ScribeCrate API key is not configured", 503);
  }

  return {
    wsUrl: config.scribecrateWsUrl,
    apiKey: config.scribecrateApiKey,
    model: config.scribecrateModel,
    language: config.scribecrateLanguage,
    timeoutMs: config.transcriptionSocketTimeoutMs
  };
};

module.exports = { getScribecrateConfig };
