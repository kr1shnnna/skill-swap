require("dotenv").config();

const mongoose = require("mongoose");

const Session = require("../models/Session");
const Connection = require("../models/Connection");

const MONGO_URI = process.env.MONGO_URI;

const createConnectionsFromSessions = async () => {
  try {
    await mongoose.connect(MONGO_URI);

    console.log("Connected to MongoDB.");

    // Get all completed SkillSwap sessions
    const completedSessions = await Session.find({
      status: "completed",
    }).select("requester partner");

    console.log(
      `Found ${completedSessions.length} completed sessions.`
    );

    let createdCount = 0;
    let existingCount = 0;

    for (const session of completedSessions) {
      const requesterId = session.requester.toString();
      const partnerId = session.partner.toString();

      // Store IDs in a consistent order
      const [user1, user2] = [
        requesterId,
        partnerId,
      ].sort();

      // Check whether connection already exists
      const existingConnection =
        await Connection.findOne({
          user1,
          user2,
        });

      if (existingConnection) {
        existingCount++;
        continue;
      }

      // Create connection
      await Connection.create({
        user1,
        user2,
      });

      createdCount++;

      console.log(
        `Created connection: ${user1} ↔ ${user2}`
      );
    }

    console.log("\nMigration completed.");
    console.log(
      `Connections created: ${createdCount}`
    );
    console.log(
      `Connections already existed: ${existingCount}`
    );
    console.log(
      `Total connection records: ${
        createdCount + existingCount
      }`
    );
  } catch (error) {
    console.error(
      "Connection migration error:",
      error.message
    );
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
};

createConnectionsFromSessions();
