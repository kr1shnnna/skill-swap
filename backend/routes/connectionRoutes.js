const express = require("express");

const {
  getMyConnectionStats,
  getUserConnectionStats,
  getMyConnections,
} = require("../controllers/connectionController");

const protect = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/stats", protect, getMyConnectionStats);

router.get(
  "/stats/:userId",
  protect,
  getUserConnectionStats
);


router.get(
  "/",
  protect,
  getMyConnections
);


module.exports = router;
