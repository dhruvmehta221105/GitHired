const config = require("../config/env");
const ServiceError = require("./serviceError");

const responseSchemas = {
  "chat response": {
    name: "chat_response",
    schema: {
      type: "object",
      properties: { response: { type: "string" } },
      required: ["response"],
      additionalProperties: false
    }
  },
  question: {
    name: "interview_question",
    schema: {
      type: "object",
      properties: {
        questionText: { type: "string" },
        focus: { type: "string" },
        difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
        expectedSignals: { type: "array", items: { type: "string" } }
      },
      required: ["questionText", "focus", "difficulty", "expectedSignals"],
      additionalProperties: false
    }
  },
  "answer evaluation": {
    name: "answer_evaluation",
    schema: {
      type: "object",
      properties: {
        score: { type: "number" },
        strengths: { type: "array", items: { type: "string" } },
        weaknesses: { type: "array", items: { type: "string" } },
        feedback: { type: "string" },
        recommendedTopics: { type: "array", items: { type: "string" } }
      },
      required: ["score", "strengths", "weaknesses", "feedback", "recommendedTopics"],
      additionalProperties: false
    }
  },
  "interview feedback": {
    name: "interview_feedback",
    schema: {
      type: "object",
      properties: {
        overallScore: { type: "number" },
        categoryScores: {
          type: "object",
          properties: {
            technical: { type: "number" },
            communication: { type: "number" },
            problemSolving: { type: "number" }
          },
          required: ["technical", "communication", "problemSolving"],
          additionalProperties: false
        },
        strengths: { type: "array", items: { type: "string" } },
        weaknesses: { type: "array", items: { type: "string" } },
        summary: { type: "string" },
        recommendedTopics: { type: "array", items: { type: "string" } }
      },
      required: ["overallScore", "categoryScores", "strengths", "weaknesses", "summary", "recommendedTopics"],
      additionalProperties: false
    }
  }
};

const request = async (messages, schemaName) => {
  if (!config.aiApiKey) {
    throw new ServiceError("AI service is not configured", 503);
  }

  const responseSchema = responseSchemas[schemaName];
  if (!responseSchema) {
    throw new ServiceError(`Unsupported AI response schema: ${schemaName}`, 500);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.aiTimeoutMs);

  try {
    const response = await fetch(config.aiUrl, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${config.aiApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: config.aiModel,
        messages,
        temperature: 0.2,
        max_tokens: 1800,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: responseSchema.name,
            strict: true,
            schema: responseSchema.schema
          }
        }
      })
    });

    const data = await response.json();
    if (!response.ok) {
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
