const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const matchRoutes = require("./routes/matchRoutes");
const swapRoutes = require("./routes/swapRoutes");
const messageRoutes = require("./routes/messageRoutes");

const {
  addUser,
  removeUser,
  getUserSocket,
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
      socket.userId=userId;
      try {
        // Register the user's socket
        addUser(userId, socket.id);

        console.log(
          `User ${userId} connected with socket ${socket.id}`
        );

        // ------------------------------------
        // OFFLINE DELIVERY SYNC
        // ------------------------------------

        /*
         * Find messages that were sent to this
         * user while they were offline.
         *
         * These messages are already stored in
         * MongoDB but still have:
         *
         * delivered: false
         */

        const undeliveredMessages =
          await Message.find({
            receiver: userId,
            delivered: false,
          });

        /*
         * Mark each pending message as
         * delivered.
         */

        for (const message of undeliveredMessages) {
          message.delivered = true;

          await message.save();

          /*
           * Notify the original sender that
           * their message has now been
           * delivered.
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
  



  // ----------------------------------------
  // HANDLE DISCONNECT
  // ----------------------------------------

  socket.on("disconnect", () => {
    console.log(
      "A user disconnected:",
      socket.id
    );

    removeUser(socket.id);
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

