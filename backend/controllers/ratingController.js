const Rating = require("../models/Rating");
const Session = require("../models/Session");
const User = require("../models/User");

// ------------------------------------------
// CREATE RATING
// ------------------------------------------
const createRating = async (req, res) => {
  try {
    const { sessionId, rating, review } = req.body;

    const reviewerId = req.user.userId;

    // ------------------------------------------
    // VALIDATE INPUT
    // ------------------------------------------

    if (!sessionId || rating === undefined) {
      return res.status(400).json({
        message: "Session and rating are required.",
      });
    }

    const numericRating = Number(rating);

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        message: "Rating must be an integer between 1 and 5.",
      });
    }

    if (review && review.length > 500) {
      return res.status(400).json({
        message: "Review cannot exceed 500 characters.",
      });
    }

    // ------------------------------------------
    // FIND SESSION
    // ------------------------------------------

    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        message: "Session not found.",
      });
    }

    // ------------------------------------------
    // SESSION MUST BE COMPLETED
    // ------------------------------------------

    if (session.status !== "completed") {
      return res.status(400).json({
        message: "You can only rate a completed session.",
      });
    }

    // ------------------------------------------
    // CHECK PARTICIPATION
    // ------------------------------------------

    const isRequester =
      session.requester.toString() === reviewerId.toString();

    const isPartner =
      session.partner.toString() === reviewerId.toString();

    if (!isRequester && !isPartner) {
      return res.status(403).json({
        message: "You were not a participant in this session.",
      });
    }

    // ------------------------------------------
    // DETERMINE REVIEWEE
    // ------------------------------------------

    const revieweeId = isRequester
      ? session.partner
      : session.requester;

    // ------------------------------------------
    // PREVENT DUPLICATE RATING
    // ------------------------------------------

    const existingRating = await Rating.findOne({
      reviewer: reviewerId,
      session: sessionId,
    });

    if (existingRating) {
      return res.status(409).json({
        message: "You have already rated this session.",
      });
    }

    // ------------------------------------------
    // CREATE RATING
    // ------------------------------------------

    const newRating = await Rating.create({
      reviewer: reviewerId,
      reviewee: revieweeId,
      session: sessionId,
      rating: numericRating,
      review: review || "",
    });

    // ------------------------------------------
    // UPDATE REVIEWEE RATING SUMMARY
    // ------------------------------------------

    const reviewee = await User.findById(revieweeId);

    if (!reviewee) {
      return res.status(404).json({
        message: "Reviewee not found.",
      });
    }

    const oldCount = reviewee.rating?.count || 0;
    const oldAverage = reviewee.rating?.average || 0;

    const newCount = oldCount + 1;

    const newAverage =
      (oldAverage * oldCount + numericRating) / newCount;

    reviewee.rating = {
      average: Number(newAverage.toFixed(1)),
      count: newCount,
    };

    await reviewee.save();

    // ------------------------------------------
    // RETURN POPULATED RATING
    // ------------------------------------------

    const populatedRating = await Rating.findById(newRating._id)
      .populate("reviewer", "name")
      .populate("reviewee", "name")
      .populate("session");

    res.status(201).json({
      message: "Rating submitted successfully.",
      rating: populatedRating,
    });
  } catch (error) {
    console.error("Create rating error:", error.message);

    // MongoDB duplicate-key protection
    if (error.code === 11000) {
      return res.status(409).json({
        message: "You have already rated this session.",
      });
    }

    res.status(500).json({
      message: "Server error.",
    });
  }
};

// ------------------------------------------
// GET RATINGS FOR A USER
// ------------------------------------------
const getUserRatings = async (req, res) => {
  try {
    const { userId } = req.params;

    const ratings = await Rating.find({
      reviewee: userId,
    })
      .populate("reviewer", "name")
      .populate("session", "topic date time")
      .sort({ createdAt: -1 });

    res.status(200).json({
      ratings,
    });
  } catch (error) {
    console.error("Get user ratings error:", error.message);

    res.status(500).json({
      message: "Server error.",
    });
  }
};


// ------------------------------------------
// CHECK MY RATING FOR A SESSION
// ------------------------------------------
const getMySessionRating = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const reviewerId = req.user.userId;

    const rating = await Rating.findOne({
      reviewer: reviewerId,
      session: sessionId,
    });

    res.status(200).json({
      hasRated: !!rating,
      rating: rating || null,
    });
  } catch (error) {
    console.error("Get session rating error:", error.message);

    res.status(500).json({
      message: "Server error.",
    });
  }
};

module.exports = {
  createRating,
  getUserRatings,
  getMySessionRating,
};
