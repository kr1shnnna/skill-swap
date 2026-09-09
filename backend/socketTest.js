const { io } = require("socket.io-client");

const socket = io("http://localhost:5000");

socket.on("connect", () => {
  console.log("Connected to server!");
  console.log("Socket ID:", socket.id);
});

socket.on("disconnect", () => {
  console.log("Disconnected from server");
});