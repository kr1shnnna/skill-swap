const { io } = require("socket.io-client");

const socket = io("http://localhost:5000");

const rohitId = "6a87d35c3c91d5208ccb1b8f";

socket.on("connect", () => {
  console.log("Rohit connected!");
  console.log("Socket ID:", socket.id);

  socket.emit("registerUser", rohitId);
});

socket.on("receiveMessage", (data) => {
  console.log("\n📩 New real-time message received:");
  console.log(data);
});

socket.on("disconnect", () => {
  console.log("Rohit disconnected");
});