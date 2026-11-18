const config = require("../config/env");
const ServiceError = require("./serviceError");

const request = async (messages, schemaName) => {
  const isOpenRouter = Boolean(config.openRouterApiKey);
  const apiKey = isOpenRouter ? config.openRouterApiKey : config.openAiApiKey;
  const url = isOpenRouter ? config.openRouterUrl : config.openAiUrl;
  const model = isOpenRouter ? config.openRouterModel : config.openAiModel;

  if (!apiKey) {
    throw new ServiceError("AI service is not configured", 503);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.aiTimeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2,
        max_tokens: 1800,
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      if (response.status === 401) {
        throw new ServiceError(
          "The configured AI API key was rejected. Replace OPENAI_API_KEY in backend/.env and restart the backend.",
          503
        );
      }
      throw new ServiceError(data?.error?.message || "AI service request failed", 502);
    }

    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new ServiceError("AI service returned an empty response", 502);

    try {
      return JSON.parse(content);
    } catch {
      throw new ServiceError(`AI returned invalid ${schemaName} JSON`, 502);
    }
  } catch (error) {
    if (error.name === "AbortError") throw new ServiceError("AI request timed out", 504);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

const generateResponse = async (message) => {
  const result = await generateStructured(
    "Return JSON only in the shape {\"response\": string}.",
    message,
    "chat response"
  );
  if (!result || typeof result.response !== "string") {
    throw new ServiceError("AI returned an invalid chat response", 502);
  }
  return result.response;
};

const generateStructured = (systemPrompt, userPrompt, schemaName) =>
  request([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ], schemaName);

module.exports = { generateResponse, generateStructured };
