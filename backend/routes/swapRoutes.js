const express = require("express");

const {
  sendSwapRequest,
  getSwapRequests,
} = require("../controllers/swapController");

const protect = require("../middlewares/authMiddleware");

const router = express.Router();

// Send swap request
router.post("/", protect, sendSwapRequest);

// Get all sent and received swap requests
router.get("/", protect, getSwapRequests);

module.exports = router;