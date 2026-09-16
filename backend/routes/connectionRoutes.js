const express = require("express");

const {
  getMyConnectionStats,
  getUserConnectionStats,
} = require("../controllers/connectionController");

const protect = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/stats", protect, getMyConnectionStats);

router.get(
  "/stats/:userId",
  protect,
  getUserConnectionStats
);

module.exports = router;
