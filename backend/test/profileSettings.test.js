const test = require("node:test");
const assert = require("node:assert/strict");
const profileController = require("../controller/profileController");

const createResponse = () => ({
  statusCode: 200,
  body: undefined,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(value) {
    this.body = value;
    return this;
  }
});

test("profile updates reject invalid names before database access", async () => {
  const response = createResponse();
  await profileController.updateProfile({ body: { name: " " } }, response);
  assert.equal(response.statusCode, 400);
});

test("profile updates reject non-HTTP avatar URLs", async () => {
  const response = createResponse();
  await profileController.updateProfile({ body: { avatarUrl: "javascript:alert(1)" } }, response);
  assert.equal(response.statusCode, 400);
});

test("account deletion requires the explicit typed confirmation", async () => {
  const response = createResponse();
  await profileController.deleteAccount(
    { body: { currentPassword: "password123", confirmation: "delete" } },
    response
  );
  assert.equal(response.statusCode, 400);
});
