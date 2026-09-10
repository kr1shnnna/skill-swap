const express = require("express");

const {
  sendMessage,
  getMessages,
  markMessagesAsRead,
  markMessageAsDelivered
} = require("../controllers/messageController");

const protect = require("../middlewares/authMiddleware");

const router = express.Router();

// Send a message
router.post(
  "/",
  protect,
  sendMessage
);

// Get messages for a specific user
router.get(
  "/:userId",
  protect,
  getMessages
);

// Mark messages from a specific user as read
router.patch(
  "/:userId/read",
  protect,
  markMessagesAsRead
);

// Mark a specific message as delivered
router.patch(
  "/delivered",
  protect,
  markMessageAsDelivered
);

module.exports = router;
