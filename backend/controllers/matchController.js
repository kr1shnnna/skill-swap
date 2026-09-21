const User = require("../models/User");
const Swap = require("../models/Swap");

const AI_MATCHING_URL = "http://127.0.0.1:8000/match";

/**
 * Call the local Python AI matching service.
 *
 * If the AI service is unavailable, return null so that
 * the existing exact matching system can continue working.
 */
const getAIMatchScore = async ({
  currentSkillsToLearn,
  currentSkillsToTeach,
  otherSkillsToLearn,
  otherSkillsToTeach,
}) => {
  try {
    const controller = new AbortController();

    // Prevent the request from waiting forever
    // if the Python service is unavailable.
    const timeout = setTimeout(() => {
      controller.abort();
    }, 5000);

    const response = await fetch(AI_MATCHING_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        current_skills_to_learn: currentSkillsToLearn,
        current_skills_to_teach: currentSkillsToTeach,
        other_skills_to_learn: otherSkillsToLearn,
        other_skills_to_teach: otherSkillsToTeach,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.error(
        "AI matching service returned:",
        response.status
      );

      return null;
    }

    const data = await response.json();

    return data;
  } catch (error) {
    if (error.name === "AbortError") {
      console.error("AI matching service timed out.");
    } else {
      console.error(
        "AI matching service unavailable:",
        error.message
      );
    }

    return null;
  }
};


const getMatches = async (req, res) => {
  try {
    // ---------------------------------------------
    // Get the logged-in user
    // ---------------------------------------------

    const currentUser = await User.findById(req.user.userId);

    if (!currentUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // ---------------------------------------------
    // Current user's learning skills
    // ---------------------------------------------

    const skillsToLearn = currentUser.skillsToLearn.map((skill) =>
      skill.toLowerCase().trim()
    );

    if (skillsToLearn.length === 0) {
      return res.status(200).json({
        message: "Add some skills you want to learn to find matches.",
        matches: [],
      });
    }

    // ---------------------------------------------
    // Current user's teaching skills
    // ---------------------------------------------

    const currentSkillsToTeach = currentUser.skillsToTeach.map(
      (skill) => skill.toLowerCase().trim()
    );

    // ---------------------------------------------
    // Get all other users
    // ---------------------------------------------

    const users = await User.find({
      _id: { $ne: currentUser._id },
    }).select("-password");

    // ---------------------------------------------
    // Get all swap relationships involving
    // the current user
    // ---------------------------------------------

    const swaps = await Swap.find({
      $or: [
        { sender: currentUser._id },
        { receiver: currentUser._id },
      ],
    });

    // ---------------------------------------------
    // Calculate matches
    // ---------------------------------------------

    const matches = await Promise.all(
      users.map(async (user) => {
        const skillsToTeach = user.skillsToTeach.map((skill) =>
          skill.toLowerCase().trim()
        );

        const otherSkillsToLearn = user.skillsToLearn.map(
          (skill) => skill.toLowerCase().trim()
        );

        // -----------------------------------------
        // Existing exact matching algorithm
        // -----------------------------------------

        const matchedSkills = skillsToLearn.filter((skill) =>
          skillsToTeach.includes(skill)
        );

        const matchScore =
          (matchedSkills.length / skillsToLearn.length) * 100;

        // -----------------------------------------
        // AI semantic + reciprocal matching
        // -----------------------------------------

        const aiResult = await getAIMatchScore({
          currentSkillsToLearn: skillsToLearn,
          currentSkillsToTeach,
          otherSkillsToLearn,
          otherSkillsToTeach: skillsToTeach,
        });

        const aiMatchScore = aiResult
          ? aiResult.reciprocal_score
          : 0;

        // -----------------------------------------
        // Find relationship with this user
        // -----------------------------------------

        const relationship = swaps.find(
          (swap) =>
            swap.sender.toString() === user._id.toString() ||
            swap.receiver.toString() === user._id.toString()
        );

        let relationshipStatus = "available";

        if (relationship) {
          // Current user sent the request
          if (
            relationship.sender.toString() ===
            currentUser._id.toString()
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
            relationship.receiver.toString() ===
            currentUser._id.toString()
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

        // -----------------------------------------
        // Return match
        // -----------------------------------------

        return {
          user: {
            id: user._id,
            name: user.name,
            bio: user.bio,
            gender: user.gender,
            rating: user.rating,
          },

          // Existing exact-match score
          matchScore: Number(matchScore.toFixed(2)),

          // New AI reciprocal score
          aiMatchScore: Number(aiMatchScore.toFixed(2)),

          // Existing exact matched skills
          matchedSkills,

          // Detailed AI matching information
          aiMatches: aiResult
            ? {
                forwardScore: aiResult.forward_score,
                reverseScore: aiResult.reverse_score,
                forwardMatches: aiResult.forward_matches,
                reverseMatches: aiResult.reverse_matches,
              }
            : null,

          relationshipStatus,
        };
      })
    );

    // ---------------------------------------------
    // Keep users with either exact or AI match
    // ---------------------------------------------

    const filteredMatches = matches
      .filter(
        (match) =>
          match.matchScore > 0 ||
          match.aiMatchScore > 0
      )
      .sort((a, b) => {
        // For now, keep the existing exact-match
        // score as the primary ranking.
        //
        // AI score is the secondary ranking.
        if (b.matchScore !== a.matchScore) {
          return b.matchScore - a.matchScore;
        }

        return b.aiMatchScore - a.aiMatchScore;
      });

    // ---------------------------------------------
    // Send response
    // ---------------------------------------------

    res.status(200).json({
      matches: filteredMatches,
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