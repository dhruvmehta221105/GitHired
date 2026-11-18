const test = require("node:test");
const assert = require("node:assert/strict");
const Interview = require("../models/Interview");
const controller = require("../controller/interviewController");
const interviewAiService = require("../services/interviewAiService");

const user = { id: "user-1", role: "user" };

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

const createInterview = () => ({
  _id: "interview-1",
  userId: "user-1",
  role: "Frontend Developer",
  status: "scheduled",
  currentQuestionIndex: 0,
  questions: [],
  save: async function save() {
    return this;
  }
});

test("interview lifecycle preserves progress and rejects invalid answers", async () => {
  const interview = createInterview();
  const originalFindById = Interview.findById;
  const originalFindOneAndUpdate = Interview.findOneAndUpdate;
  const originalFindByIdAndUpdate = Interview.findByIdAndUpdate;
  const originalUpdateOne = Interview.updateOne;
  const originalEvaluateAnswer = interviewAiService.evaluateAnswer;
  const originalEvaluateInterview = interviewAiService.evaluateInterview;

  try {
    interviewAiService.evaluateAnswer = async () => ({
      score: 80,
      strengths: ["Clear explanation"],
      weaknesses: [],
      feedback: "Good answer.",
      recommendedTopics: []
    });
    interviewAiService.evaluateInterview = async () => ({
      overallScore: 80,
      categoryScores: { technical: 4, communication: 4, problemSolving: 4 },
      strengths: ["Clear explanation"],
      weaknesses: [],
      summary: "Good interview.",
      recommendedTopics: []
    });
    Interview.findById = async () => interview;
    Interview.findOneAndUpdate = async (filter, update) => {
      if (filter.status !== interview.status || filter.currentQuestionIndex !== interview.currentQuestionIndex) {
        return null;
      }

      const expectedQuestion = filter["questions.questionId"]?.$ne;
      if (expectedQuestion !== undefined && interview.questions.some((question) => question.questionId === expectedQuestion)) {
        return null;
      }

      if (!update.$push) {
        interview.status = update.$set.status;
        return interview;
      }

      interview.questions.push(update.$push.questions);
      interview.currentQuestionIndex += update.$inc.currentQuestionIndex;
      interview.status = update.$set.status;

      if (update.$set.status === "processing") return interview;
      if (update.$set.status === "in-progress") return interview;
      return null;
    };
    Interview.findByIdAndUpdate = async (id, update) => {
      interview.status = update.status;
      interview.endTime = update.endTime;
      interview.duration = update.duration;
      return interview;
    };
    Interview.updateOne = async () => {
      interview.status = "in-progress";
      return { acknowledged: true };
    };

    let response = createResponse();
    await controller.prepareInterview({ params: { interviewId: interview._id }, user }, response);
    assert.equal(response.statusCode, 200);
    assert.equal(interview.status, "ready");

    response = createResponse();
    await controller.startInterview({ params: { interviewId: interview._id }, user }, response);
    assert.equal(response.statusCode, 200);
    assert.equal(interview.status, "in-progress");
    assert.equal(interview.currentQuestionIndex, 0);
    assert.ok(interview.startTime);

    response = createResponse();
    await controller.submitAnswer(
      { params: { interviewId: interview._id }, user, body: { questionId: 0, transcript: "A valid answer" } },
      response
    );
    assert.equal(response.statusCode, 200);
    assert.equal(interview.currentQuestionIndex, 1);
    assert.equal(interview.status, "in-progress");

    response = createResponse();
    await controller.submitAnswer(
      { params: { interviewId: interview._id }, user, body: { questionId: 0, transcript: "Duplicate answer" } },
      response
    );
    assert.equal(response.statusCode, 409);

    response = createResponse();
    await controller.pauseInterview({ params: { interviewId: interview._id }, user }, response);
    assert.equal(response.statusCode, 200);
    assert.equal(interview.status, "paused");

    response = createResponse();
    await controller.resumeInterview({ params: { interviewId: interview._id }, user }, response);
    assert.equal(response.statusCode, 200);
    assert.equal(interview.status, "in-progress");
    assert.equal(interview.currentQuestionIndex, 1);

    response = createResponse();
    await controller.submitAnswer(
      { params: { interviewId: interview._id }, user, body: { questionId: 3, transcript: "Wrong question" } },
      response
    );
    assert.equal(response.statusCode, 409);

    response = createResponse();
    await controller.endInterview({ params: { interviewId: interview._id }, user }, response);
    assert.equal(response.statusCode, 200);
    assert.equal(interview.status, "completed");
    assert.ok(interview.endTime);

    response = createResponse();
    await controller.submitAnswer(
      { params: { interviewId: interview._id }, user, body: { questionId: 1, transcript: "Late answer" } },
      response
    );
    assert.equal(response.statusCode, 409);
  } finally {
    interviewAiService.evaluateAnswer = originalEvaluateAnswer;
    interviewAiService.evaluateInterview = originalEvaluateInterview;
    Interview.findById = originalFindById;
    Interview.findOneAndUpdate = originalFindOneAndUpdate;
    Interview.findByIdAndUpdate = originalFindByIdAndUpdate;
    Interview.updateOne = originalUpdateOne;
  }
});