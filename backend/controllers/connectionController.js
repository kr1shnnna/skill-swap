const Connection = require("../models/Connection");
const Session = require("../models/Session");

// ------------------------------------------
// GET MY CONNECTION STATS
// ------------------------------------------

const getMyConnectionStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Find all completed SkillSwap sessions involving this user
    const completedSessions = await Session.find({
      status: "completed",
      $or: [
        { requester: userId },
        { partner: userId },
      ],
    }).select("requester partner");

    // Find unique people this user has completed a SkillSwap with
    const uniqueConnectionIds = new Set();

    completedSessions.forEach((session) => {
      const requesterId = session.requester.toString();
      const partnerId = session.partner.toString();

      const otherUserId =
        requesterId === userId.toString()
          ? partnerId
          : requesterId;

      uniqueConnectionIds.add(otherUserId);
    });

    const connectionCount = uniqueConnectionIds.size;

    // Total completed SkillSwap sessions
    const skillSwapCount = completedSessions.length;

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


const getUserConnectionStats = async (req, res) => {
  try {
    const { userId } = req.params;

    const completedSessions = await Session.find({
      status: "completed",
      $or: [
        { requester: userId },
        { partner: userId },
      ],
    }).select("requester partner");

    const uniqueConnectionIds = new Set();

    completedSessions.forEach((session) => {
      const requesterId = session.requester.toString();
      const partnerId = session.partner.toString();

      const otherUserId =
        requesterId === userId
          ? partnerId
          : requesterId;

      uniqueConnectionIds.add(otherUserId);
    });

    res.status(200).json({
      connectionCount: uniqueConnectionIds.size,
      skillSwapCount: completedSessions.length,
    });
  } catch (error) {
    console.error(
      "Get user connection stats error:",
      error.message
    );

    res.status(500).json({
      message: "Server error.",
    });
  }
};

const getMyConnections = async (req, res) => {
  try {
    const userId = req.user.userId;

    const connections = await Connection.find({
      $or: [
        { user1: userId },
        { user2: userId },
      ],
    })
      .populate(
        "user1",
        "name bio gender skillsToTeach skillsToLearn rating"
      )
      .populate(
        "user2",
        "name bio gender skillsToTeach skillsToLearn rating"
      )
      .sort({ createdAt: -1 });

    const formattedConnections = connections.map(
      (connection) => {
        const currentUserId = userId.toString();

        const otherUser =
          connection.user1._id.toString() === currentUserId
            ? connection.user2
            : connection.user1;

        return {
          connectionId: connection._id,
          connectedSince: connection.createdAt,
          user: otherUser,
        };
      }
    );

    res.status(200).json({
      connections: formattedConnections,
    });
  } catch (error) {
    console.error(
      "Get my connections error:",
      error.message
    );

    res.status(500).json({
      message: "Server error.",
    });
  }
};


module.exports = {
  getMyConnectionStats,
  getUserConnectionStats,
  getMyConnections,
};