const express = require("express");

const {
  createRating,
  getUserRatings,
} = require("../controllers/ratingController");

const protect = require("../middlewares/authMiddleware");

const router = express.Router();

// ------------------------------------------
// Create a rating for a completed session
// ------------------------------------------
router.post("/", protect, createRating);

// ------------------------------------------
// Get ratings received by a user
// ------------------------------------------
router.get("/user/:userId", protect, getUserRatings);




router.get("/session/:sessionId", protect, getMySessionRating);

module.exports = router;

