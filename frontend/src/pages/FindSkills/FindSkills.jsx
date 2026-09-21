import { useEffect, useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import {
  FaSearch,
  FaUserCircle,
  FaArrowRight,
  FaPaperPlane,
  FaCheck,
  FaComments,
  FaUserClock,
} from "react-icons/fa";

import { MdAutoAwesome } from "react-icons/md";

import api from "../../services/api";

import "./FindSkills.css";

const FindSkills = () => {
  const navigate = useNavigate();

  const [matches, setMatches] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sendingRequest, setSendingRequest] = useState(null);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await api.get("/matches");

        setMatches(response.data.matches || []);
        setMessage(response.data.message || "");
      } catch (error) {
        console.error("Fetch matches error:", error);

        setError(
          error.response?.data?.message || "Unable to load skill matches.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  const handleSendRequest = async (receiverId) => {
    try {
      setSendingRequest(receiverId);
      setError("");

      await api.post("/swaps", {
        receiverId,
      });

      setMatches((previousMatches) =>
        previousMatches.map((match) =>
          match.user.id.toString() === receiverId.toString()
            ? {
                ...match,
                relationshipStatus: "request_sent",
              }
            : match,
        ),
      );
    } catch (error) {
      console.error("Send swap request error:", error);

      setError(error.response?.data?.message || "Unable to send swap request.");
    } finally {
      setSendingRequest(null);
    }
  };

  const handleOpenChat = (userId) => {
    navigate("/chat", {
      state: {
        userId: userId.toString(),
      },
    });
  };

  const getAIMatchReason = (match) => {
    const forwardMatches = (match.aiMatches?.forwardMatches || []).filter(
      (item) => item.match_type !== "below_threshold",
    );

    const reverseMatches = (match.aiMatches?.reverseMatches || []).filter(
      (item) => item.match_type !== "below_threshold",
    );

    const learningSkills = [
      ...new Set(forwardMatches.map((item) => item.learning_skill)),
    ];

    const teachingSkills = [
      ...new Set(reverseMatches.map((item) => item.learning_skill)),
    ];

    const partnerName = match.user.name;

    if (learningSkills.length > 0 && teachingSkills.length > 0) {
      return (
        <>
          You can learn <strong>{learningSkills.join(", ")}</strong> from{" "}
          {partnerName}, and {partnerName} can learn{" "}
          <strong>{teachingSkills.join(", ")}</strong> from you.
        </>
      );
    }

    if (learningSkills.length > 0) {
      return (
        <>
          You can learn <strong>{learningSkills.join(", ")}</strong> from{" "}
          {partnerName}.
        </>
      );
    }

    if (teachingSkills.length > 0) {
      return (
        <>
          {partnerName} can learn <strong>{teachingSkills.join(", ")}</strong>{" "}
          from you.
        </>
      );
    }

    return "AI found compatible skills between you.";
  };

  const renderRelationshipAction = (match) => {
    const status = match.relationshipStatus || "available";
    const userId = match.user.id;

    if (status === "request_sent") {
      return (
        <div className="relationship-action request-sent">
          <FaPaperPlane />
          <span>Request Sent</span>
        </div>
      );
    }

    if (status === "request_received") {
      return (
        <div className="relationship-action request-received">
          <FaUserClock />
          <span>Request Received</span>
        </div>
      );
    }

    if (status === "connected") {
      return (
        <button
          type="button"
          className="relationship-action connected"
          onClick={() => handleOpenChat(userId)}
        >
          <FaComments />
          <span>Connected · Chat</span>
        </button>
      );
    }

    return (
      <button
        type="button"
        className="relationship-action available"
        onClick={() => handleSendRequest(userId)}
        disabled={sendingRequest === userId}
      >
        {sendingRequest === userId ? (
          <>
            <span className="button-spinner"></span>
            <span>Sending...</span>
          </>
        ) : (
          <>
            <FaPaperPlane />
            <span>Send Swap Request</span>
          </>
        )}
      </button>
    );
  };

  if (loading) {
    return (
      <main className="find-skills-page">
        <div className="find-skills-loading">
          <div className="loading-spinner"></div>
          <p>Finding your best skill matches...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="find-skills-page">
      <div className="find-skills-container">
        {/* Header */}

        <section className="find-skills-header">
          <p className="find-skills-tag">DISCOVER • CONNECT • LEARN</p>

          <h1>
            Find Your <span>Skill Matches</span>
          </h1>

          <p className="find-skills-description">
            Discover students who can teach you the skills you're looking to
            learn.
          </p>
        </section>

        {/* Error */}

        {error && <div className="matches-message error-message">{error}</div>}

        {/* No skills message */}

        {!error && message && matches.length === 0 && (
          <div className="no-matches-card">
            <div className="no-matches-icon">
              <FaSearch />
            </div>

            <h2>Let's find your first match</h2>

            <p>{message}</p>

            <Link to="/profile" className="profile-btn">
              Add Learning Skills
            </Link>
          </div>
        )}

        {/* No matches */}

        {!error && !message && matches.length === 0 && (
          <div className="no-matches-card">
            <div className="no-matches-icon">
              <FaSearch />
            </div>

            <h2>No matches found yet</h2>

            <p>
              We couldn't find anyone who teaches the skills you're looking for.
            </p>

            <Link to="/profile" className="profile-btn">
              Update My Skills
            </Link>
          </div>
        )}

        {/* Match results */}

        {matches.length > 0 && (
          <section className="matches-section">
            <div className="matches-top">
              <div>
                <h2>Your Matches</h2>

                <p>
                  We found {matches.length}{" "}
                  {matches.length === 1 ? "student" : "students"} who can help
                  you learn.
                </p>
              </div>
            </div>

            <div className="matches-grid">
              {matches.map((match) => (
                <div className="match-card" key={match.user.id}>
                  {/* Existing Match Score */}

                  <div className="match-score">
                    <span>{match.matchScore}%</span>
                    <small>Match</small>
                  </div>

                  {/* User info */}

                  <div className="match-user">
                    {match.user.profilePicture ? (
                      <img
                        src={match.user.profilePicture}
                        alt={`${match.user.name} profile`}
                        className="match-user-picture"
                      />
                    ) : (
                      <FaUserCircle className="match-user-icon" />
                    )}

                    <div>
                      <h3>{match.user.name}</h3>

                      {/* Rating */}

                      <div className="match-rating">
                        {match.user.rating?.count > 0 ? (
                          <>
                            <span className="match-rating-stars">★</span>

                            <span className="match-rating-average">
                              {Number(match.user.rating.average).toFixed(1)}
                            </span>

                            <span className="match-rating-count">
                              ({match.user.rating.count})
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="match-rating-stars">★</span>

                            <span className="match-rating-new">New</span>
                          </>
                        )}
                      </div>

                      {match.user.gender &&
                        match.user.gender !== "Prefer not to say" && (
                          <p className="match-gender">{match.user.gender}</p>
                        )}
                    </div>
                  </div>

                  {/* AI Match */}

                  {match.aiMatchScore > 0 && (
                    <div className="ai-match-card">
                      <div className="ai-match-header">
                        <MdAutoAwesome className="ai-match-icon" />

                        <span className="ai-match-label">AI Match</span>

                        <span className="ai-match-score">
                          {match.aiMatchScore}%
                        </span>
                      </div>

                      <p className="ai-match-reason">
                        {getAIMatchReason(match)}
                      </p>
                    </div>
                  )}

                  {/* Relationship status */}

                  <div className="relationship-status">
                    {match.relationshipStatus === "request_sent" && (
                      <span className="status-badge status-request-sent">
                        <FaPaperPlane />
                        Request Sent
                      </span>
                    )}

                    {match.relationshipStatus === "request_received" && (
                      <span className="status-badge status-request-received">
                        <FaUserClock />
                        Request Received
                      </span>
                    )}

                    {match.relationshipStatus === "connected" && (
                      <span className="status-badge status-connected">
                        <FaCheck />
                        Connected
                      </span>
                    )}

                    {(!match.relationshipStatus ||
                      match.relationshipStatus === "available") && (
                      <span className="status-badge status-available">
                        Available
                      </span>
                    )}
                  </div>

                  {/* Bio */}

                  {match.user.bio && (
                    <p className="match-bio">{match.user.bio}</p>
                  )}

                  {/* Matched skills */}

                  <div className="matched-skills-section">
                    <h4>Can teach you</h4>

                    <div className="matched-skills">
                      {match.matchedSkills.map((skill) => (
                        <span key={skill} className="matched-skill">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* View profile */}

                  <Link
                    to={`/profile/${match.user.id}`}
                    className="view-profile-btn"
                  >
                    View Profile
                    <FaArrowRight />
                  </Link>

                  {/* Relationship action */}

                  {renderRelationshipAction(match)}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
};

export default FindSkills;
