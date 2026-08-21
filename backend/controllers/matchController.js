const User = require("../models/User");

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

        return {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            bio: user.bio,
          },
          matchScore: Number(matchScore.toFixed(2)),
          matchedSkills,
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