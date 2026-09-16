const Connection = require("../models/Connection");
const Session = require("../models/Session");

// ------------------------------------------
// GET MY CONNECTION STATS
// ------------------------------------------

const getMyConnectionStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Count unique connections
    const connectionCount = await Connection.countDocuments({
      $or: [
        { user1: userId },
        { user2: userId },
      ],
    });

    // Count completed SkillSwap sessions
    const skillSwapCount = await Session.countDocuments({
      status: "completed",
      $or: [
        { requester: userId },
        { partner: userId },
      ],
    });

    res.status(200).json({
      connectionCount,
      skillSwapCount,
    });
  } catch (error) {
    console.error(
      "Get connection stats error:",
      error.message
    );

    res.status(500).json({
      message: "Server error.",
    });
  }
};

module.exports = {
  getMyConnectionStats,
};
