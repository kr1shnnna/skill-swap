const express = require("express");

const {
  getMyConnectionStats,
} = require("../controllers/connectionController");

const protect = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/stats", protect, getMyConnectionStats);

module.exports = router;
