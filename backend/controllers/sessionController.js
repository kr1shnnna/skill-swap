const Session = require("../models/Session");
const Swap = require("../models/Swap");

/*
 * ------------------------------------------
 * CREATE SESSION
 * ------------------------------------------
 */

const createSession = async (req, res) => {
  try {
    const { partnerId, date, time, topic, note } = req.body;

    if (!partnerId || !date || !time || !topic) {
      return res.status(400).json({
        message: "Partner, date, time, and topic are required.",
      });
    }

    const requesterId = req.user.userId;

    /*
     * Make sure an accepted skill swap exists
     * between the two users.
     */

    const acceptedSwap = await Swap.findOne({
      status: "accepted",
      $or: [
        {
          sender: requesterId,
          receiver: partnerId,
        },
        {
          sender: partnerId,
          receiver: requesterId,
        },
      ],
    });

    if (!acceptedSwap) {
      return res.status(403).json({
        message:
          "You can schedule a session only with a connected skill partner.",
      });
    }

    /*
     * Create session.
     */

    const session = await Session.create({
      requester: requesterId,
      partner: partnerId,
      date,
      time,
      topic,
      note: note || "",
      status: "pending",
    });

    const populatedSession = await Session.findById(session._id)
      .populate("requester", "name email")
      .populate("partner", "name email");

    res.status(201).json({
      message: "Session scheduled successfully.",
      session: populatedSession,
    });
  } catch (error) {
    console.error("Create session error:", error.message);

    res.status(500).json({
      message: "Server error.",
    });
  }
};

/*
 * ------------------------------------------
 * GET MY SESSIONS
 * ------------------------------------------
 */

const getMySessions = async (req, res) => {
  try {
    const userId = req.user.userId;

    const sessions = await Session.find({
      $or: [{ requester: userId }, { partner: userId }],
    })
      .populate("requester", "name email")
      .populate("partner", "name email")
      .sort({
        date: 1,
        time: 1,
      });

    res.status(200).json({
      sessions,
    });
  } catch (error) {
    console.error("Get sessions error:", error.message);

    res.status(500).json({
      message: "Server error.",
    });
  }
};

/*
 * ------------------------------------------
 * UPDATE SESSION STATUS
 * ------------------------------------------
 */

const updateSessionStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["accepted", "rejected", "cancelled", "completed"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid session status.",
      });
    }

    const userId = req.user.userId;

    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        message: "Session not found.",
      });
    }

    const isRequester = session.requester.toString() === userId.toString();

    const isPartner = session.partner.toString() === userId.toString();

    if (!isRequester && !isPartner) {
      return res.status(403).json({
        message: "You are not authorized to update this session.",
      });
    }

    // Completed sessions cannot be changed
    if (session.status === "completed") {
      return res.status(400).json({
        message: "Completed sessions cannot be changed.",
      });
    }

    // Partner can accept or reject a pending request
    if (
      (status === "accepted" || status === "rejected") &&
      (!isPartner || session.status !== "pending")
    ) {
      return res.status(403).json({
        message:
          "Only the session partner can accept or reject a pending request.",
      });
    }

    // Requester can cancel their own pending/accepted session
    if (status === "cancelled" && !isRequester) {
      return res.status(403).json({
        message: "Only the session requester can cancel this session.",
      });
    }

    // A session can only be completed after it has been accepted
    if (status === "completed" && session.status !== "accepted") {
      return res.status(400).json({
        message: "Only accepted sessions can be marked as completed.",
      });
    }

    session.status = status;

    await session.save();

    const io = req.app.get("io");

    if (io) {
      io.emit("sessionUpdated", {
        sessionId: session._id.toString(),
        status: session.status,
        statusUpdatedBy: userId.toString()
      });
    }

    const updatedSession = await Session.findById(session._id)
      .populate("requester", "name email")
      .populate("partner", "name email");

    res.status(200).json({
      message: "Session status updated.",
      session: updatedSession,
    });
  } catch (error) {
    console.error("Update session status error:", error.message);

    res.status(500).json({
      message: "Server error.",
    });
  }
};

module.exports = {
  createSession,
  getMySessions,
  updateSessionStatus,
};
