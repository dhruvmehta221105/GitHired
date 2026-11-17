const fs = require("node:fs/promises");
const path = require("node:path");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Interview = require("../models/Interview");
const Feedback = require("../models/Feedback");
const Chat = require("../models/Chat");
const Subscriber = require("../models/Subscriber");
const { avatarDirectory } = require("../middleware/upload");
const { isNonEmptyString } = require("../validators/commonValidator");
const storageService = require("../services/storageService");

const toPublicUser = (user) => {
  const result = user.toObject();
  delete result.password;
  return result;
};

const isValidAvatarUrl = (value) => {
  if (typeof value !== "string" || value.length > 2048) return false;
  if (!value) return true;

  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password;
  } catch {
    return false;
  }
};

const removeStoredAvatar = async (avatar) => {
  if (typeof avatar !== "string" || !avatar.startsWith("/uploads/avatars/")) return;
  const filename = path.basename(avatar);
  try {
    await fs.unlink(path.join(avatarDirectory, filename));
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("Could not remove old avatar:", error.message);
    }
  }
};

const getProfile = async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });
  return res.json(user);
};

const updateProfile = async (req, res) => {
  const body = req.body || {};
  const hasName = Object.prototype.hasOwnProperty.call(body, "name");
  const hasAvatar = Object.prototype.hasOwnProperty.call(body, "avatarUrl");
  if (!hasName && !hasAvatar) {
    return res.status(400).json({ message: "Provide a name or avatar URL to update" });
  }
  if (hasName && !isNonEmptyString(body.name, 100)) {
    return res.status(400).json({ message: "Name must be between 1 and 100 characters" });
  }
  if (hasAvatar && !isValidAvatarUrl(body.avatarUrl)) {
    return res.status(400).json({ message: "Avatar URL must be a valid HTTP or HTTPS URL" });
  }

  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  const oldAvatar = user.avatar;
  if (hasName) user.name = body.name.trim();
  if (hasAvatar) user.avatar = body.avatarUrl.trim();
  await user.save();

  if (hasAvatar && oldAvatar !== user.avatar) await removeStoredAvatar(oldAvatar);
  return res.json(toPublicUser(user));
};

const updateAvatar = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Choose an image to upload" });

  const user = await User.findById(req.user.id);
  if (!user) {
    await fs.unlink(req.file.path);
    return res.status(404).json({ message: "User not found" });
  }

  const oldAvatar = user.avatar;
  user.avatar = `/uploads/avatars/${req.file.filename}`;
  try {
    await user.save();
  } catch (error) {
    await fs.unlink(req.file.path);
    throw error;
  }

  await removeStoredAvatar(oldAvatar);
  return res.json(toPublicUser(user));
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (typeof currentPassword !== "string" || typeof newPassword !== "string" || newPassword.length < 8) {
    return res.status(400).json({ message: "Enter your current password and a new password of at least 8 characters" });
  }

  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  if (!(await bcrypt.compare(currentPassword, user.password))) {
    return res.status(400).json({ message: "Current password is incorrect" });
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  return res.json({ message: "Password updated successfully" });
};

const deleteAccount = async (req, res) => {
  const { currentPassword, confirmation } = req.body || {};
  if (typeof currentPassword !== "string" || confirmation !== "DELETE") {
    return res.status(400).json({ message: 'Enter your password and type "DELETE" to confirm' });
  }

  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  if (!(await bcrypt.compare(currentPassword, user.password))) {
    return res.status(400).json({ message: "Current password is incorrect" });
  }

  const interviews = await Interview.find({ userId: user._id }).select("_id questions.audio.storageKey");
  const interviewIds = interviews.map((interview) => interview._id);
  for (const interview of interviews) {
    for (const question of interview.questions || []) {
      if (question.audio?.storageKey) await storageService.removeAudio(question.audio.storageKey);
    }
  }

  await Feedback.deleteMany({
    $or: [
      { interviewId: { $in: interviewIds } },
      { interviewerId: user._id }
    ]
  });
  await Interview.deleteMany({ userId: user._id });
  await Chat.deleteMany({ userId: user._id });
  await Subscriber.deleteOne({ email: user.email });
  await user.deleteOne();
  await removeStoredAvatar(user.avatar);

  return res.json({ message: "Account and associated data deleted" });
};

module.exports = {
  getProfile,
  updateProfile,
  updateAvatar,
  changePassword,
  deleteAccount
};
