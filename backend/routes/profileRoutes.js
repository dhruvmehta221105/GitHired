const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  avatarUpload,
  handleAvatarUploadError
} = require("../middleware/upload");
const {
  getProfile,
  updateProfile,
  updateAvatar,
  changePassword,
  deleteAccount
} = require("../controller/profileController");

router.get("/", auth, getProfile);
router.patch("/", auth, updateProfile);
router.patch(
  "/avatar",
  auth,
  avatarUpload.single("avatar"),
  handleAvatarUploadError,
  updateAvatar
);
router.patch("/password", auth, changePassword);
router.delete("/", auth, deleteAccount);

module.exports = router;