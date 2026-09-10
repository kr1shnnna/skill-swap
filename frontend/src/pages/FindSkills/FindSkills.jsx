import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaSearch,
  FaUserCircle,
  FaArrowRight,
} from "react-icons/fa";
import api from "../../services/api";
import "./FindSkills.css";

const FindSkills = () => {
  const [matches, setMatches] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await api.get("/matches");

        setMatches(response.data.matches || []);
        setMessage(response.data.message || "");
      } catch (error) {
        console.error("Fetch matches error:", error);

        setError(
          error.response?.data?.message ||
            "Unable to load skill matches."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

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
          <p className="find-skills-tag">
            DISCOVER • CONNECT • LEARN
          </p>

          <h1>
            Find Your <span>Skill Matches</span>
          </h1>

          <p className="find-skills-description">
            Discover students who can teach you the skills
            you're looking to learn.
          </p>
        </section>

        {/* Error */}
        {error && (
          <div className="matches-message error-message">
            {error}
          </div>
        )}

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
              We couldn't find anyone who teaches the skills
              you're looking for.
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
                  {matches.length === 1 ? "student" : "students"} who
                  can help you learn.
                </p>
              </div>
            </div>

            <div className="matches-grid">
              {matches.map((match) => (
                <div
                  className="match-card"
                  key={match.user.id}
                >
                  {/* Match score */}
                  <div className="match-score">
                    <span>{match.matchScore}%</span>
                    <small>Match</small>
                  </div>

                  {/* User info */}
                  <div className="match-user">
                    <FaUserCircle className="match-user-icon" />

                    <div>
                      <h3>{match.user.name}</h3>
                      <p>{match.user.email}</p>
                    </div>
                  </div>

                  {/* Bio */}
                  {match.user.bio && (
                    <p className="match-bio">
                      {match.user.bio}
                    </p>
                  )}

                  {/* Matched skills */}
                  <div className="matched-skills-section">
                    <h4>Can teach you</h4>

                    <div className="matched-skills">
                      {match.matchedSkills.map((skill) => (
                        <span
                          key={skill}
                          className="matched-skill"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action */}
                  <Link
                    to={`/profile/${match.user.id}`}
                    className="view-profile-btn"
                  >
                    View Profile
                    <FaArrowRight />
                  </Link>
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