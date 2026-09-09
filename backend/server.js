const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const matchRoutes = require("./routes/matchRoutes");
const swapRoutes = require("./routes/swapRoutes");
const messageRoutes = require("./routes/messageRoutes");

require("dotenv").config();

const connectDB = require("./config/db");

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/swaps", swapRoutes);
app.use("/api/messages", messageRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "SkillSwap API is running",
  });
});

const connectedUsers={};


io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Register logged-in user
  socket.on("registerUser", (userId) => {
    connectedUsers[userId] = socket.id;

    console.log(`User ${userId} connected with socket ${socket.id}`);
  });

  socket.on("sendMessage", ({ senderId, receiverId, message }) => {
  console.log(
    `Message from ${senderId} to ${receiverId}: ${message}`
  );

  const receiverSocketId = connectedUsers[receiverId];

  if (receiverSocketId) {
    io.to(receiverSocketId).emit("receiveMessage", {
      senderId,
      message,
      createdAt: new Date(),
    });

    console.log(`Message delivered to ${receiverId}`);
  } else {
    console.log(`User ${receiverId} is offline`);
  }
});

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);

    // Remove disconnected user from connectedUsers
    for (const userId in connectedUsers) {
      if (connectedUsers[userId] === socket.id) {
        delete connectedUsers[userId];
        console.log(`User ${userId} removed from connected users`);
      }
    }
  });
});


const PORT = process.env.PORT || 5000;

connectDB();

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});