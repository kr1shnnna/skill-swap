const { io } = require("socket.io-client");

const socket = io("http://localhost:5000");

const krishnaId = "6a87172d97f2d736da29722c"; // Replace with Krishna's actual MongoDB user ID


socket.on("connect", () => {
  console.log("Krishna connected!");
  console.log("Socket ID:", socket.id);

  socket.emit("registerUser", krishnaId);
});

// Listen for incoming messages
socket.on("receiveMessage", (data) => {
  console.log("\n📩 New message received:");
  console.log(data);
});

socket.on("disconnect", () => {
  console.log("Krishna disconnected");
});