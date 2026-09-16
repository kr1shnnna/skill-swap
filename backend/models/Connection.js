const mongoose = require("mongoose");

const connectionSchema = new mongoose.Schema(
  {
    user1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    user2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

connectionSchema.index(
  { user1: 1, user2: 1 },
  { unique: true }
);

const Connection = mongoose.model("Connection", connectionSchema);

module.exports = Connection;
