const Swap = require("../models/Swap");
const User = require("../models/User");

const sendSwapRequest = async (req, res) => {
  try {
    const { receiverId } = req.body;

    // Check receiver ID
    if (!receiverId) {
      return res.status(400).json({
        message: "Receiver ID is required",
      });
    }

    // Check if receiver exists
    const receiver = await User.findById(receiverId);

    if (!receiver) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Prevent sending request to yourself
    if (req.user.userId.toString() === receiverId.toString()) {
      return res.status(400).json({
        message: "You cannot send a swap request to yourself",
      });
    }

    // Check duplicate pending request
    const existingRequest = await Swap.findOne({
      sender: req.user.userId,
      receiver: receiverId,
      status: "pending",
    });

    if (existingRequest) {
      return res.status(400).json({
        message: "Swap request already sent",
      });
    }

    // Create swap request
    const swapRequest = await Swap.create({
      sender: req.user.userId,
      receiver: receiverId,
    });

    res.status(201).json({
      message: "Swap request sent successfully",
      swapRequest,
    });
  } catch (error) {
    console.error("Send swap request error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  sendSwapRequest,
};

