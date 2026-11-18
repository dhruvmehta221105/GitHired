const express = require("express");
const auth = require("../middleware/auth");
const {
  getDsaPractice,
  updateDsaProgress
} = require("../controller/dsaPracticeController");

const router = express.Router();

router.get("/", auth, getDsaPractice);
router.patch("/progress", auth, updateDsaProgress);

module.exports = router;
