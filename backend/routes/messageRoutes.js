const express = require("express");

const {
  sendMessage,
  getMessages,
  getUnreadMessageCount,
  markMessagesAsRead,
  markMessageAsDelivered,
} = require("../controllers/messageController");

const protect = require("../middlewares/authMiddleware");

const router = express.Router();

// ------------------------------------------
// SEND A MESSAGE
// ------------------------------------------

router.post(
  "/",
  protect,
  sendMessage
);

// ------------------------------------------
// GET TOTAL UNREAD MESSAGE COUNT
// ------------------------------------------

router.get(
  "/unread/count",
  protect,
  getUnreadMessageCount
);

// ------------------------------------------
// GET MESSAGES FOR A SPECIFIC USER
// ------------------------------------------

router.get(
  "/:userId",
  protect,
  getMessages
);

// ------------------------------------------
// MARK MESSAGES FROM A SPECIFIC USER AS READ
// ------------------------------------------

router.patch(
  "/:userId/read",
  protect,
  markMessagesAsRead
);

// ------------------------------------------
// MARK A SPECIFIC MESSAGE AS DELIVERED
// ------------------------------------------

router.patch(
  "/delivered",
  protect,
  markMessageAsDelivered
);

module.exports = router;
