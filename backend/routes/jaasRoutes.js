const express = require("express");

const protect = require("../middlewares/authMiddleware");
const {
  generateJaasToken,
} = require("../controllers/jaasController");

const router = express.Router();

router.post("/token", protect, generateJaasToken);

module.exports = router;

