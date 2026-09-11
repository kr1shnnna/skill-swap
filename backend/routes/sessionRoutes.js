const express = require("express");

const {
  createSession,
  getMySessions,
  updateSessionStatus,
} = require("../controllers/sessionController");

const protect=require("../middlewares/authMiddleware");

const router = express.Router();

/*
 * Create a new session
 */
router.post("/", protect, createSession);

/*
 * Get sessions involving the logged-in user
 */
router.get("/", protect, getMySessions);

/*
 * Update session status
 */
router.patch("/:sessionId/status", protect, updateSessionStatus);

module.exports = router;
