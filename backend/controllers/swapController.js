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


const getSwapRequests = async (req, res) => {
  try {
    const swaps = await Swap.find({
      $or: [
        { sender: req.user.userId },
        { receiver: req.user.userId },
      ],
    })
      .populate("sender", "name email")
      .populate("receiver", "name email");

    res.status(200).json({
      count: swaps.length,
      swaps,
    });
  } catch (error) {
    console.error("Get swap requests error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};


const acceptSwapRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const swap = await Swap.findById(id);

    if (!swap) {
      return res.status(404).json({
        message: "Swap request not found",
      });
    }

    // Only receiver can accept
    if (swap.receiver.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        message: "You are not authorized to accept this request",
      });
    }

    // Check if already processed
    if (swap.status !== "pending") {
      return res.status(400).json({
        message: "This swap request has already been processed",
      });
    }

    swap.status = "accepted";

    await swap.save();

    res.status(200).json({
      message: "Swap request accepted successfully",
      swap,
    });
  } catch (error) {
    console.error("Accept swap request error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};


const rejectSwapRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const swap = await Swap.findById(id);

    // Check if swap request exists
    if (!swap) {
      return res.status(404).json({
        message: "Swap request not found",
      });
    }

    // Only receiver can reject
    if (swap.receiver.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        message: "You are not authorized to reject this request",
      });
    }

    // Check if already processed
    if (swap.status !== "pending") {
      return res.status(400).json({
        message: "This swap request has already been processed",
      });
    }

    // Reject request
    swap.status = "rejected";

    await swap.save();

    res.status(200).json({
      message: "Swap request rejected successfully",
      swap,
    });
  } catch (error) {
    console.error("Reject swap request error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};


const getReceivedSwapRequests = async (req, res) => {
  try {
    const swaps = await Swap.find({
      receiver: req.user.userId,
    })
      .populate("sender", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: swaps.length,
      swaps,
    });
  } catch (error) {
    console.error("Get received swap requests error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};


module.exports = {
  sendSwapRequest,
  getSwapRequests,
    acceptSwapRequest,
    rejectSwapRequest,
    getReceivedSwapRequests
};

