const jwt = require("jsonwebtoken");
const User = require("../models/User");

const generateJaasToken = async (req, res) => {
  try {
    const { roomName } = req.body;

    if (!roomName) {
      return res.status(400).json({
        message: "Room name is required.",
      });
    }

    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        message: "Unauthorized.",
      });
    }

    const user = await User.findById(req.user.userId).select(
      "name email"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const privateKey = process.env.JAAS_PRIVATE_KEY?.replace(
      /\\n/g,
      "\n"
    );

    if (
      !process.env.JAAS_APP_ID ||
      !process.env.JAAS_KEY_ID ||
      !privateKey
    ) {
      console.error("JaaS environment variables are missing.");

      return res.status(500).json({
        message: "JaaS configuration is missing.",
      });
    }

    const now = Math.floor(Date.now() / 1000);

    const payload = {
      aud: "jitsi",

      iss: "chat",

      sub: process.env.JAAS_APP_ID,

      room: roomName,

      iat: now,

      nbf: now - 10,

      exp: now + 60 * 60,

      context: {
        user: {
          id: user._id.toString(),
          name: user.name || "SkillSwap Student",
          email: user.email || "",
          moderator: "true",
        },

        features: {
          livestreaming: false,
          recording: false,
          transcription: false,
          "outbound-call": false,
          "inbound-call": false,
          "file-upload": true,
        },

        room: {
          regex: false,
        },
      },
    };

    const token = jwt.sign(payload, privateKey, {
      algorithm: "RS256",

      header: {
        alg: "RS256",
        kid: process.env.JAAS_KEY_ID,
        typ: "JWT",
      },
    });

    return res.status(200).json({
      token,
    });
  } catch (error) {
    console.error("JaaS JWT generation error:", error);

    return res.status(500).json({
      message: "Failed to generate JaaS token.",
    });
  }
};

module.exports = {
  generateJaasToken,
};

