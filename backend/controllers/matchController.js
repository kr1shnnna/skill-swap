const User = require("../models/User");
const Swap = require("../models/Swap");

const getMatches = async (req, res) => {
  try {
    // Get the logged-in user
    const currentUser = await User.findById(req.user.userId);

    if (!currentUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Skills the current user wants to learn
    const skillsToLearn = currentUser.skillsToLearn.map((skill) =>
      skill.toLowerCase().trim()
    );

    if (skillsToLearn.length === 0) {
      return res.status(200).json({
        message: "Add some skills you want to learn to find matches.",
        matches: [],
      });
    }

    // Get all other users
    const users = await User.find({
      _id: { $ne: currentUser._id },
    }).select("-password");

   


    // Get all swap relationships involving the current user
    const swaps = await Swap.find({
      $or: [
        { sender: currentUser._id },
        { receiver: currentUser._id },
      ],
    });

    const matches = users
      .map((user) => {
        const skillsToTeach = user.skillsToTeach.map((skill) =>
          skill.toLowerCase().trim()
        );

        // Find common skills
        const matchedSkills = skillsToLearn.filter((skill) =>
          skillsToTeach.includes(skill)
        );

        const matchScore =
          (matchedSkills.length / skillsToLearn.length) * 100;

        // Find relationship with this user
        const relationship = swaps.find(
          (swap) =>
            swap.sender.toString() === user._id.toString() ||
            swap.receiver.toString() === user._id.toString()
        );

        let relationshipStatus = "available";

        if (relationship) {
          // Current user sent the request
          if (
            relationship.sender.toString() === currentUser._id.toString()
          ) {
            if (relationship.status === "pending") {
              relationshipStatus = "request_sent";
            } else if (relationship.status === "accepted") {
              relationshipStatus = "connected";
            } else if (relationship.status === "rejected") {
              relationshipStatus = "available";
            }
          }

          // Current user received the request
          else if (
            relationship.receiver.toString() === currentUser._id.toString()
          ) {
            if (relationship.status === "pending") {
              relationshipStatus = "request_received";
            } else if (relationship.status === "accepted") {
              relationshipStatus = "connected";
            } else if (relationship.status === "rejected") {
              relationshipStatus = "available";
            }
          }
        }

        return {
          user: {
            id: user._id,
            name: user.name,
            bio: user.bio,
            gender: user.gender,
            rating: user.rating
          },
          matchScore: Number(matchScore.toFixed(2)),
          matchedSkills,
          relationshipStatus,
        };
      })
      .filter((match) => match.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore);

    res.status(200).json({
      matches,
    });
  } catch (error) {
    console.error("Matching error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  getMatches,
};
