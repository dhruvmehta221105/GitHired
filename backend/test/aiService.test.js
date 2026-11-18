const test = require("node:test");
const assert = require("node:assert/strict");

process.env.GROQ_API_KEY = "test-groq-key";
process.env.GROQ_URL = "https://groq.example.test/chat/completions";
process.env.GROQ_MODEL = "test-groq-model";

const { generateResponse } = require("../services/aiService");

test("sends KiKi chat requests to Groq with bearer authentication", async (t) => {
  const originalFetch = global.fetch;
  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async (url, options) => {
    assert.equal(url, process.env.GROQ_URL);
    assert.equal(options.headers.Authorization, "Bearer test-groq-key");
    const body = JSON.parse(options.body);
    assert.equal(body.model, "test-groq-model");
    assert.equal(body.response_format.type, "json_schema");
    assert.equal(body.response_format.json_schema.strict, true);
    assert.deepEqual(body.response_format.json_schema.schema.required, ["response"]);
    return {
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify({ response: "Hello!" }) } }]
      })
    };
  };

  assert.equal(await generateResponse("Hi"), "Hello!");
});
