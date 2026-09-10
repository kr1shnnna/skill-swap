const Message = require("../models/Message");
const Swap = require("../models/Swap");

const {
  getUserSocket,
} = require("../socket/socketManager");

// ------------------------------------------
// SEND MESSAGE
// ------------------------------------------

const sendMessage = async (req, res) => {
  try {
    const { receiverId, message } = req.body;
    const senderId = req.user.userId;

    // Check required fields
    if (!receiverId || !message) {
      return res.status(400).json({
        message:
          "Receiver ID and message are required",
      });
    }

    // Check if users have an accepted swap
    const acceptedSwap = await Swap.findOne({
      status: "accepted",

      $or: [
        {
          sender: senderId,
          receiver: receiverId,
        },
        {
          sender: receiverId,
          receiver: senderId,
        },
      ],
    });

    if (!acceptedSwap) {
      return res.status(403).json({
        message:
          "You can only message users with an accepted swap connection",
      });
    }

    // Create message
    const newMessage = await Message.create({
      sender: senderId,
      receiver: receiverId,
      message,
      delivered: false,
      read: false,
    });

    // Get Socket.IO instance
    const io = req.app.get("io");

    const receiverSocketId =
      getUserSocket(receiverId);

    // Send message to receiver if online
    if (receiverSocketId) {
      io.to(receiverSocketId).emit(
        "receiveMessage",
        newMessage
      );
    }

    res.status(201).json({
      message: "Message sent successfully",
      newMessage,
    });
  } catch (error) {
    console.error(
      "Send message error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ------------------------------------------
// MARK MESSAGE AS DELIVERED
// ------------------------------------------

const markMessageAsDelivered = async (
  req,
  res
) => {
  try {
    const { messageId } = req.body;

    const loggedInUserId =
      req.user.userId;

    // Check message ID
    if (!messageId) {
      return res.status(400).json({
        message: "Message ID is required",
      });
    }

    // Find message
    const message =
      await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        message: "Message not found",
      });
    }

    // Only the receiver can mark
    // the message as delivered.
    if (
      message.receiver.toString() !==
      loggedInUserId.toString()
    ) {
      return res.status(403).json({
        message:
          "You cannot mark this message as delivered",
      });
    }

    // Mark as delivered
    if (!message.delivered) {
      message.delivered = true;
      await message.save();
    }

    // Notify original sender
    const io = req.app.get("io");

    const senderSocketId =
      getUserSocket(
        message.sender.toString()
      );

    if (senderSocketId) {
      io.to(senderSocketId).emit(
        "messageDelivered",
        {
          messageId:
            message._id.toString(),
        }
      );
    }

    res.status(200).json({
      message:
        "Message marked as delivered",
    });
  } catch (error) {
    console.error(
      "Mark message as delivered error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ------------------------------------------
// GET MESSAGES
// ------------------------------------------

const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;

    const loggedInUserId =
      req.user.userId;

    const messages = await Message.find({
      $or: [
        {
          sender: loggedInUserId,
          receiver: userId,
        },
        {
          sender: userId,
          receiver: loggedInUserId,
        },
      ],
    }).sort({
      createdAt: 1,
    });

    // Count unread messages sent by
    // the other user.
    const unreadCount =
      await Message.countDocuments({
        sender: userId,
        receiver: loggedInUserId,
        read: false,
      });

    res.status(200).json({
      count: messages.length,
      unreadCount,
      messages,
    });
  } catch (error) {
    console.error(
      "Get messages error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ------------------------------------------
// GET TOTAL UNREAD MESSAGE COUNT
// ------------------------------------------

const getUnreadMessageCount = async (
  req,
  res
) => {
  try {
    const loggedInUserId =
      req.user.userId;

    const unreadCount =
      await Message.countDocuments({
        receiver: loggedInUserId,
        read: false,
      });

    res.status(200).json({
      unreadCount,
    });
  } catch (error) {
    console.error(
      "Get unread message count error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};


// ------------------------------------------
// MARK MESSAGES AS READ
// ------------------------------------------

const markMessagesAsRead = async (
  req,
  res
) => {
  try {
    const { userId } = req.params;

    const loggedInUserId =
      req.user.userId;

    // Find unread messages from the
    // other user before marking them read.
    const unreadMessages =
      await Message.find({
        sender: userId,
        receiver: loggedInUserId,
        read: false,
      }).select("_id");

    // If there are no unread messages,
    // nothing needs to be marked as seen.
    if (unreadMessages.length === 0) {
      return res.status(200).json({
        message: "No unread messages",
        updatedCount: 0,
      });
    }

    const messageIds =
      unreadMessages.map(
        (message) =>
          message._id
      );

    // Mark messages as read.
    await Message.updateMany(
      {
        _id: {
          $in: messageIds,
        },
      },
      {
        $set: {
          read: true,
        },
      }
    );

    // Get Socket.IO instance.
    const io = req.app.get("io");

    // Find the original sender's socket.
    const senderSocketId =
      getUserSocket(
        userId.toString()
      );

    // Tell the sender that these
    // messages have been seen.
    if (senderSocketId) {
      io.to(senderSocketId).emit(
        "messagesSeen",
        {
          messageIds:
            messageIds.map(
              (id) =>
                id.toString()
            ),
        }
      );
    }

    res.status(200).json({
      message:
        "Messages marked as read",
      updatedCount:
        messageIds.length,
    });
  } catch (error) {
    console.error(
      "Mark messages as read error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ------------------------------------------
// EXPORTS
// ------------------------------------------

module.exports = {
  sendMessage,
  getMessages,
  getUnreadMessageCount,
  markMessagesAsRead,
  markMessageAsDelivered,
};
