const Message = require("../models/Message");
const Swap = require("../models/Swap");
const { getUserSocket } = require("../socket/socketManager");


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

    const io=req.app.get("io"); // Get the io instance from the app

  
    const receiverSocketId = getUserSocket(receiverId);
    

    if(receiverSocketId){
        io.to(receiverSocketId).emit("receiveMessage",newMessage); // Emit the message to the receiver
    }

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


const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const loggedInUserId = req.user.userId;

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
    }).sort({ createdAt: 1 });

    /*
     * Count unread messages sent by the
     * other user to the logged-in user.
     */
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



module.exports = {
  sendMessage,
  getMessages

};