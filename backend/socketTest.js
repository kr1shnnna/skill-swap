const { io } = require("socket.io-client");

const socket = io("http://localhost:5000");

// Replace with Krishna's actual MongoDB user ID
const userId = "6a87172d97f2d736da29722c"; // Replace with the actual user ID

socket.on("connect", () => {
  console.log("Connected to server!");
  console.log("Socket ID:", socket.id);

  // Tell server who we are
  socket.emit("registerUser", userId);
});

socket.on("disconnect", () => {
  console.log("Disconnected from server");
});