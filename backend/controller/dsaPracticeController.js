const User = require("../models/User");
const catalog = require("../data/companyWiseDsa.json");

const questionExists = (companySlug, questionId) => {
  const company = catalog.companies.find((item) => item.slug === companySlug);
  return Boolean(company && company.questions.some((question) => question.id === questionId));
};

const getDsaPractice = async (req, res) => {
  const user = await User.findById(req.user.id).select("dsaProgress");
  if (!user) return res.status(404).json({ message: "User not found" });

  const solvedQuestions = new Set(
    (user.dsaProgress || [])
      .filter((progress) => progress.solved)
      .map((progress) => `${progress.companySlug}:${progress.questionId}`)
  );

  const companies = catalog.companies.map((company) => ({
    ...company,
    questions: company.questions.map((question) => ({
      ...question,
      solved: solvedQuestions.has(`${company.slug}:${question.id}`)
    }))
  }));

  return res.json({
    source: catalog.source,
    snapshot: catalog.snapshot,
    companies
  });
};

const updateDsaProgress = async (req, res) => {
  const { companySlug, questionId, solved } = req.body || {};
  const parsedQuestionId = Number(questionId);

  if (
    typeof companySlug !== "string" ||
    !companySlug ||
    !Number.isInteger(parsedQuestionId) ||
    typeof solved !== "boolean"
  ) {
    return res.status(400).json({ message: "Company, question, and solved status are required" });
  }

  if (!questionExists(companySlug, parsedQuestionId)) {
    return res.status(404).json({ message: "DSA question not found" });
  }

  const user = await User.findById(req.user.id).select("dsaProgress");
  if (!user) return res.status(404).json({ message: "User not found" });

  const progress = (user.dsaProgress || []).find(
    (entry) => entry.companySlug === companySlug && entry.questionId === parsedQuestionId
  );

  if (progress) {
    progress.solved = solved;
    progress.updatedAt = new Date();
  } else {
    user.dsaProgress.push({
      companySlug,
      questionId: parsedQuestionId,
      solved,
      updatedAt: new Date()
    });
  }

  await user.save();
  return res.json({ companySlug, questionId: parsedQuestionId, solved });
};

module.exports = { getDsaPractice, updateDsaProgress };
