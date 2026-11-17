const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");
const config = require("../config/env");

const avatarDirectory = path.join(__dirname, "..", "uploads", "avatars");
fs.mkdirSync(avatarDirectory, { recursive: true });

const allowedAvatarTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"]
]);

const allowedAudioTypes = new Set([
  "audio/webm",
  "audio/ogg",
  "audio/wav",
  "audio/x-wav",
  "audio/mpeg",
  "audio/mp4"
]);

const audioUpload = multer({
  storage: multer.diskStorage({
    destination: config.tempUploadDir,
    filename: (req, file, callback) => callback(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`)
  }),
  limits: { fileSize: config.maxAudioFileSize },
  fileFilter(req, file, callback) {
    if (!allowedAudioTypes.has(file.mimetype)) {
      return callback(new Error("Unsupported audio file type"));
    }
    return callback(null, true);
  }
});

const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: avatarDirectory,
    filename: (req, file, callback) =>
      callback(null, `${crypto.randomUUID()}${allowedAvatarTypes.get(file.mimetype)}`)
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, callback) {
    if (!allowedAvatarTypes.has(file.mimetype)) {
      return callback(new Error("Upload a PNG, JPEG, or WEBP image"));
    }
    return callback(null, true);
  }
});

const handleUploadError = (error, req, res, next) => {
  if (!error) return next();
  if (error.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ message: "Audio file is too large" });
  }
  return res.status(400).json({ message: error.message || "Invalid audio upload" });
};

const handleAvatarUploadError = (error, req, res, next) => {
  if (!error) return next();
  if (error.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ message: "Avatar image must be 5 MB or smaller" });
  }
  return res.status(400).json({ message: error.message || "Invalid avatar upload" });
};

module.exports = {
  audioUpload,
  avatarUpload,
  avatarDirectory,
  handleUploadError,
  handleAvatarUploadError,
  allowedAudioTypes
};
