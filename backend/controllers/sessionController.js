const Session = require("../models/Session");
const Swap = require("../models/Swap");

const Connection=require("../models/Connection");


/*
 * ------------------------------------------
 * CREATE SESSION
 * ------------------------------------------
 */

const createSession = async (req, res) => {
  try {
    const {
      partnerId,
      date,
      time,
      topic,
      note,
    } = req.body;

    if (!partnerId || !date || !time || !topic) {
      return res.status(400).json({
        message:
          "Partner, date, time, and topic are required.",
      });
    }

    /*
     * ------------------------------------------
     * VALIDATE SESSION DATE & TIME
     * ------------------------------------------
     */

    const scheduledDateTime = new Date(
      `${date}T${time}`
    );

    if (
      Number.isNaN(
        scheduledDateTime.getTime()
      )
    ) {
      return res.status(400).json({
        message:
          "Please provide a valid session date and time.",
      });
    }

    /*
     * Sessions must always be scheduled
     * in the future.
     */

    if (scheduledDateTime <= new Date()) {
      return res.status(400).json({
        message:
          "Session date and time must be in the future.",
      });
    }

    const requesterId = req.user.userId;

    /*
     * ------------------------------------------
     * VALIDATE ACCEPTED SKILL SWAP
     * ------------------------------------------
     *
     * Make sure an accepted SkillSwap exists
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
     * ------------------------------------------
     * PREVENT DUPLICATE ACTIVE SESSIONS
     * ------------------------------------------
     *
     * The same two students cannot have two
     * pending/accepted sessions at the exact
     * same date and time.
     *
     * We check both directions:
     *
     * A → B
     * B → A
     *
     * because they represent the same pair.
     */

    const existingSession = await Session.findOne({
      date: scheduledDateTime,
      time,
      status: {
        $in: ["pending", "accepted"],
      },
      $or: [
        {
          requester: requesterId,
          partner: partnerId,
        },
        {
          requester: partnerId,
          partner: requesterId,
        },
      ],
    });

    if (existingSession) {
      return res.status(409).json({
        message:
          "A session is already scheduled with this student at this date and time.",
      });
    }

    /*
     * ------------------------------------------
     * CREATE SESSION
     * ------------------------------------------
     */

    const session = await Session.create({
      requester: requesterId,
      partner: partnerId,
      date: scheduledDateTime,
      time,
      topic,
      note: note || "",
      status: "pending",
    });

    /*
     * ------------------------------------------
     * POPULATE SESSION
     * ------------------------------------------
     */

    const populatedSession =
      await Session.findById(session._id)
        .populate(
          "requester",
          "name email"
        )
        .populate(
          "partner",
          "name email"
        );

    /*
     * ------------------------------------------
     * SOCKET.IO EVENT
     * ------------------------------------------
     */

    const io = req.app.get("io");

    if (io) {
      io.emit("sessionCreated", {
        session: populatedSession,
      });
    }

    /*
     * ------------------------------------------
     * RESPONSE
     * ------------------------------------------
     */

    res.status(201).json({
      message:
        "Session scheduled successfully.",
      session: populatedSession,
    });
  } catch (error) {
    console.error(
      "Create session error:",
      error.message
    );

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


// Create a connection automatically when a SkillSwap is completed
if (status === "completed") {
  const requesterId = session.requester.toString();
  const partnerId = session.partner.toString();

  // Store the two user IDs in a consistent order
  const [user1, user2] = [requesterId, partnerId].sort();

  // Only create the connection if one does not already exist
  await Connection.updateOne(
    {
      user1,
      user2,
    },
    {
      $setOnInsert: {
        user1,
        user2,
      },
    },
    {
      upsert: true,
    }
  );
}

    const io = req.app.get("io");

    if (io) {
      io.emit("sessionUpdated", {
        sessionId: session._id.toString(),
        status: session.status,
        statusUpdatedBy: userId.toString(),
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
