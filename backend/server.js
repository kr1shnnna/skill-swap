const express = require("express");

const cors = require("cors");

const http = require("http");

const { Server } = require("socket.io");

const authRoutes = require("./routes/authRoutes");

const userRoutes = require("./routes/userRoutes");

const matchRoutes = require("./routes/matchRoutes");

const swapRoutes = require("./routes/swapRoutes");

const messageRoutes = require("./routes/messageRoutes");

const sessionRoutes = require("./routes/sessionRoutes");


const {
  addUser,
  removeUser,
  getUserSocket,
  getConnectedUsers,
} = require("./socket/socketManager");

const Message = require("./models/Message");

require("dotenv").config();

const connectDB = require("./config/db");

const app = express();

const server = http.createServer(app);

// ------------------------------------------
// SOCKET.IO SETUP
// ------------------------------------------

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Make Socket.IO accessible in controllers
app.set("io", io);

// ------------------------------------------
// MIDDLEWARE
// ------------------------------------------

app.use(cors());

app.use(express.json());

// ------------------------------------------
// ROUTES
// ------------------------------------------

app.use("/api/auth", authRoutes);

app.use("/api/users", userRoutes);

app.use("/api/matches", matchRoutes);

app.use("/api/swaps", swapRoutes);

app.use("/api/messages", messageRoutes);

app.use("/api/sessions", sessionRoutes);


// ------------------------------------------
// TEST ROUTE
// ------------------------------------------

app.get("/", (req, res) => {
  res.json({
    message: "SkillSwap API is running",
  });
});

// ------------------------------------------
// SOCKET.IO CONNECTION
// ------------------------------------------

io.on("connection", (socket) => {
  console.log(
    "A user connected:",
    socket.id
  );

  // ----------------------------------------
  // REGISTER LOGGED-IN USER
  // ----------------------------------------

  socket.on(
    "registerUser",
    async (userId) => {
      socket.userId = userId;

      try {
        // ------------------------------------
        // REGISTER USER SOCKET
        // ------------------------------------

        addUser(
          userId,
          socket.id
        );

        // Send current online users to the newly connected user
socket.emit(
  "onlineUsers",
  getConnectedUsers()
);

// Notify everyone that this user is online
io.emit("userOnline", {
  userId: userId.toString(),
});


        console.log(
          `User ${userId} connected with socket ${socket.id}`
        );

        // ------------------------------------
        // ONLINE STATUS
        // ------------------------------------

        /*
         * Tell every connected client that
         * this user is now online.
         */

        io.emit("userOnline", {
          userId: userId.toString(),
        });

        // ------------------------------------
        // OFFLINE DELIVERY SYNC
        // ------------------------------------

        /*
         * Find messages that were sent to
         * this user while they were offline.
         */

        const undeliveredMessages =
          await Message.find({
            receiver: userId,
            delivered: false,
          });

        /*
         * Mark each pending message
         * as delivered.
         */

        for (const message of undeliveredMessages) {
          message.delivered = true;

          await message.save();

          /*
           * Notify the original sender that
           * their message has now been delivered.
           */

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
        }
      } catch (error) {
        console.error(
          "Offline delivery sync error:",
          error
        );
      }
    }
  );

  // ------------------------------------------
  // TYPING INDICATOR
  // ------------------------------------------

  socket.on(
    "typing",
    ({ receiverId }) => {
      if (!receiverId) {
        return;
      }

      const receiverSocketId =
        getUserSocket(receiverId);

      if (receiverSocketId) {
        io.to(receiverSocketId).emit(
          "userTyping",
          {
            senderId:
              socket.userId,
          }
        );
      }
    }
  );

  // ------------------------------------------
  // STOP TYPING
  // ------------------------------------------

  socket.on(
    "stopTyping",
    ({ receiverId }) => {
      if (!receiverId) {
        return;
      }

      const receiverSocketId =
        getUserSocket(receiverId);

      if (receiverSocketId) {
        io.to(receiverSocketId).emit(
          "userStoppedTyping",
          {
            senderId:
              socket.userId,
          }
        );
      }
    }
  );


  // ------------------------------------------
// CALL SIGNALING
// ------------------------------------------

socket.on(
  "callUser",
  ({ receiverId, callType, roomName }) => {
    if (!receiverId || !callType || !roomName) {
      return;
    }

    const receiverSocketId =
      getUserSocket(receiverId);

    if (!receiverSocketId) {
      socket.emit("callFailed", {
        message: "User is currently offline.",
      });

      return;
    }

    io.to(receiverSocketId).emit(
      "incomingCall",
      {
        callerId: socket.userId.toString(),
        callType,
        roomName,
      }
    );
  }
);


  // ------------------------------------------
  // HANDLE DISCONNECT
  // ------------------------------------------

  socket.on("disconnect", () => {
    console.log(
      "A user disconnected:",
      socket.id
    );

    /*
     * Save the user ID before removing
     * the socket from the manager.
     */

    const disconnectedUserId =
      socket.userId;

    removeUser(socket.id);

    // ----------------------------------------
    // OFFLINE STATUS
    // ----------------------------------------

    if (disconnectedUserId) {
      io.emit("userOffline", {
        userId:
          disconnectedUserId.toString(),
      });
    }
  });
});

// ------------------------------------------
// SERVER
// ------------------------------------------

const PORT =
  process.env.PORT || 5000;

connectDB();

server.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});
