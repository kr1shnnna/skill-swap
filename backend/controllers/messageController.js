const Message = require("../models/Message");
const Swap = require("../models/Swap");

const sendMessage = async (req, res) => {
  try {
    const { receiverId, message } = req.body;

    const senderId = req.user.userId;

    // Check required fields
    if (!receiverId || !message) {
      return res.status(400).json({
        message: "Receiver ID and message are required",
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
        message: "You can only message users with an accepted swap connection",
      });
    }

    // Create message
    const newMessage = await Message.create({
      sender: senderId,
      receiver: receiverId,
      message,
    });

    res.status(201).json({
      message: "Message sent successfully",
      newMessage,
    });
  } catch (error) {
    console.error("Send message error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  sendMessage,
};