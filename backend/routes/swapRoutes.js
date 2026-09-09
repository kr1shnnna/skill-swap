const express = require("express");

const {
  sendSwapRequest,
  getSwapRequests,
  acceptSwapRequest,
rejectSwapRequest,
getReceivedSwapRequests
} = require("../controllers/swapController");

const protect = require("../middlewares/authMiddleware");

const router = express.Router();

// Send swap request
router.post("/", protect, sendSwapRequest);

// Get all sent and received swap requests
router.get("/", protect, getSwapRequests);

// Get all received swap requests
router.get("/received", protect, getReceivedSwapRequests);

//accept swap request
router.patch("/:id/accept", protect, acceptSwapRequest);

//reject swap request
router.patch("/:id/reject", protect, rejectSwapRequest);




module.exports = router;