const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    totalInterviews: { type: Number, default: 0 },
avgScore: { type: Number, default: 0 },
selected: { type: Number, default: 0 },

activities: [
  {
    role: String,
    score: Number,
    status: String,
    date: Date
  }
],
dsaProgress: [
  {
    _id: false,
    companySlug: { type: String, required: true },
    questionId: { type: Number, required: true },
    solved: { type: Boolean, default: false },
    updatedAt: { type: Date, default: Date.now }
  }
]
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);