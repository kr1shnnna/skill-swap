const express = require("express");

const {
  sendMessage,
  getMessages
} = require("../controllers/messageController");

const protect = require("../middlewares/authMiddleware");

const router = express.Router();

// Send a message
router.post("/", protect, sendMessage);

// Get messages for a specific user

router.get("/:userId", protect, getMessages);

module.exports = router;
