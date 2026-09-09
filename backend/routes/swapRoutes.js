const express = require("express");

const {
  sendSwapRequest,
} = require("../controllers/swapController");

const protect = require("../middlewares/authMiddleware");

const router = express.Router();

// Send swap request
router.post("/", protect, sendSwapRequest);

module.exports = router;

