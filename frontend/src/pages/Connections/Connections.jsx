import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./Connections.css";

const Connections = () => {
  const navigate = useNavigate();

  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/connections");

        setConnections(response.data.connections || []);
      } catch (error) {
        console.error("Connections error:", error);

        setError(
          error.response?.data?.message || "Unable to load your connections.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchConnections();
  }, []);

  if (loading) {
    return (
      <div className="connections-page">
        <div className="connections-container">
          <h1>My Connections</h1>
          <p className="connections-status">Loading your connections...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="connections-page">
        <div className="connections-container">
          <h1>My Connections</h1>

          <div className="connections-error">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="connections-page">
      <div className="connections-container">
        <div className="connections-header">
          <div>
            <h1>My Connections</h1>
            <p>Students you have completed SkillSwaps with.</p>
          </div>

          <div className="connections-count">
            {connections.length}
            <span>
              {connections.length === 1 ? " Connection" : " Connections"}
            </span>
          </div>
        </div>

        {connections.length === 0 ? (
          <div className="connections-empty">
            <div className="connections-empty-icon">🔗</div>

            <h2>No connections yet</h2>

            <p>
              Complete a SkillSwap with another student to create a connection.
            </p>

            <button
              onClick={() => navigate("/find-skills")}
              className="connections-primary-button"
            >
              Find Skills
            </button>
          </div>
        ) : (
          <div className="connections-grid">
            {connections.map((connection) => {
              const user = connection.user;

              return (
                <div className="connection-card" key={connection.connectionId}>
                  <div className="connection-card-top">
                    <div className="connection-avatar">
                      {user?.profilePicture ? (
                        <img
                          src={user.profilePicture}
                          alt={`${user.name || "Student"} profile`}
                          className="connection-avatar-image"
                        />
                      ) : (
                        user?.name?.charAt(0)?.toUpperCase() || "?"
                      )}
                    </div>

                    <div className="connection-user-info">
                      <h2>{user?.name || "Student"}</h2>

                      <div className="connection-rating">
                        <span className="connection-star">★</span>

                        {user?.rating?.count > 0 ? (
                          <>
                            <span>
                              {Number(user.rating.average).toFixed(1)}
                            </span>

                            <span className="connection-rating-count">
                              ({user.rating.count})
                            </span>
                          </>
                        ) : (
                          <span className="connection-new-rating">New</span>
                        )}
                      </div>

                      <div className="connection-swap-count">
                        🔄 {connection.skillSwapCount || 0}{" "}
                        {connection.skillSwapCount === 1
                          ? "SkillSwap together"
                          : "SkillSwaps together"}
                      </div>
                    </div>
                  </div>

                  {user?.bio && <p className="connection-bio">{user.bio}</p>}

                  <div className="connection-skills">
                    {user?.skillsToTeach?.length > 0 && (
                      <div className="connection-skill-section">
                        <h3>Can teach</h3>

                        <div className="connection-tags">
                          {user.skillsToTeach
                            .slice(0, 4)
                            .map((skill, index) => (
                              <span className="connection-tag" key={index}>
                                {skill}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}

                    {user?.skillsToLearn?.length > 0 && (
                      <div className="connection-skill-section">
                        <h3>Wants to learn</h3>

                        <div className="connection-tags">
                          {user.skillsToLearn
                            .slice(0, 4)
                            .map((skill, index) => (
                              <span
                                className="connection-tag learn"
                                key={index}
                              >
                                {skill}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="connection-actions">
                    <button
                      className="connection-profile-button"
                      onClick={() => navigate(`/profile/${user._id}`)}
                    >
                      View Profile
                    </button>

                    <button
                      className="connection-chat-button"
                      onClick={() => navigate(`/chat?userId=${user._id}`)}
                    >
                      Chat
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Connections;
