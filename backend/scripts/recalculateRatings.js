const mongoose = require("mongoose");
require("dotenv").config();

const Rating = require("../models/Rating");
const User = require("../models/User");
const connectDB = require("../config/db");

const recalculateRatings = async () => {
  try {
    console.log("Connecting to database...");
    await connectDB();

    console.log("Reading existing ratings...");

    const ratings = await Rating.find({});

    console.log(`Found ${ratings.length} rating(s).`);

    if (ratings.length === 0) {
      console.log("No ratings found. Nothing to update.");
      return;
    }

    // Group ratings by reviewee
    const ratingsByUser = {};

    for (const rating of ratings) {
      const userId = rating.reviewee.toString();

      if (!ratingsByUser[userId]) {
        ratingsByUser[userId] = [];
      }

      ratingsByUser[userId].push(rating.rating);
    }

    // Recalculate each user's rating
    for (const [userId, userRatings] of Object.entries(ratingsByUser)) {
      const count = userRatings.length;

      const total = userRatings.reduce(
        (sum, rating) => sum + rating,
        0
      );

      const average = total / count;

      const roundedAverage = Number(average.toFixed(1));

     const updatedUser = await User.findByIdAndUpdate(
  userId,
  {
    $set: {
      rating: {
        average: roundedAverage,
        count,
      },
    },
  },
  {
    new: true,
    runValidators: true,
  }
);

console.log(
  "Updated user:",
  updatedUser?.name,
  updatedUser?.rating
);

      const user = await User.findById(userId).select("name");

      console.log(
        `${user?.name || userId}: ${roundedAverage} ⭐ (${count})`
      );
    }

    console.log("Rating recalculation completed successfully.");
  } catch (error) {
    console.error("Rating recalculation failed:", error);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed.");
  }
};

recalculateRatings();
