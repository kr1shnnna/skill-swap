const { io } = require("socket.io-client");

const socket = io("http://localhost:5000");

const rohitId = "6a87d35c3c91d5208ccb1b8f"; // Replace with Rohit's actual MongoDB user ID
const krishnaId = "6a87172d97f2d736da29722c"; // Replace with Krishna's actual MongoDB user ID

socket.on("connect", () => {
  console.log("Rohit connected!");
  console.log("Socket ID:", socket.id);

  // Register Rohit
  socket.emit("registerUser", rohitId);

  // Send message to Krishna after 2 seconds
  setTimeout(() => {
    socket.emit("sendMessage", {
      senderId: rohitId,
      receiverId: krishnaId,
      message: "Hey Krishna! This is a real-time Socket.IO message! 🔥",
    });

    console.log("Message sent to Krishna!");
  }, 2000);
});

socket.on("receiveMessage", (data) => {
  console.log("\n📩 New message received:");
  console.log(data);
});

socket.on("disconnect", () => {
  console.log("Rohit disconnected");
});