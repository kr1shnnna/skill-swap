const express = require("express");

const {
  sendMessage,
} = require("../controllers/messageController");

const protect = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/", protect, sendMessage);

module.exports = router;
