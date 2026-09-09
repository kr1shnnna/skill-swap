const express = require("express");

const {
  sendSwapRequest,
  getSwapRequests,
  acceptSwapRequest
} = require("../controllers/swapController");

const protect = require("../middlewares/authMiddleware");

const router = express.Router();

// Send swap request
router.post("/", protect, sendSwapRequest);

// Get all sent and received swap requests
router.get("/", protect, getSwapRequests);


router.patch("/:id/accept", protect, acceptSwapRequest);

module.exports = router;