const express = require("express");

const {
  sendSwapRequest,
  getSwapRequests,
  acceptSwapRequest,
rejectSwapRequest,
getReceivedSwapRequests,
getSentSwapRequests,
getAcceptedSwaps
} = require("../controllers/swapController");

const protect = require("../middlewares/authMiddleware");

const router = express.Router();

// Send swap request
router.post("/", protect, sendSwapRequest);

// Get all sent and received swap requests
router.get("/", protect, getSwapRequests);

// Get all received swap requests
router.get("/received", protect, getReceivedSwapRequests);

// Get all sent swap requests
router.get("/sent", protect, getSentSwapRequests);

// Get all accepted swaps
router.get("/accepted", protect, getAcceptedSwaps);

//accept swap request
router.patch("/:id/accept", protect, acceptSwapRequest);

//reject swap request
router.patch("/:id/reject", protect, rejectSwapRequest);




module.exports = router;