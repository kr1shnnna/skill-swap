import { useEffect, useState } from "react";

import { Link, useParams, useNavigate } from "react-router-dom";

import {
  FaUserCircle,
  FaChalkboardTeacher,
  FaBookOpen,
  FaArrowLeft,
  FaComments,
  FaPaperPlane,
  FaUserClock,
  FaStar,
} from "react-icons/fa";

import api from "../../services/api";

import "./StudentProfile.css";

const StudentProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [relationshipStatus, setRelationshipStatus] = useState("available");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [requestLoading, setRequestLoading] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [requestError, setRequestError] = useState("");

  // Ratings & reviews
  const [ratings, setRatings] = useState([]);
  const [ratingsLoading, setRatingsLoading] = useState(true);
  const [ratingsError, setRatingsError] = useState("");

  // Connection & SkillSwap stats
  const [connectionCount, setConnectionCount] = useState(0);
  const [skillSwapCount, setSkillSwapCount] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchStudentProfile = async () => {
      try {
        setLoading(true);
        setRatingsLoading(true);

        const [profileResponse, ratingsResponse, statsResponse] =
          await Promise.all([
            api.get(`/users/${userId}`),
            api.get(`/ratings/user/${userId}`),
            api.get(`/connections/stats/${userId}`),
          ]);

        setStudent(profileResponse.data.user);

        setRelationshipStatus(
          profileResponse.data.relationshipStatus || "available",
        );

        setRatings(ratingsResponse.data.ratings || []);
      } catch (error) {
        console.error("Student profile error:", error);

        setError(
          error.response?.data?.message || "Unable to load student profile.",
        );

        setRatingsError(
          error.response?.data?.message || "Unable to load ratings.",
        );
      } finally {
        setLoading(false);
        setRatingsLoading(false);
      }
    };

    fetchStudentProfile();
  }, [userId]);

  const handleOpenChat = () => {
    navigate("/chat", {
      state: {
        userId: userId.toString(),
      },
    });
  };

  const handleSendRequest = async () => {
    setRequestLoading(true);
    setRequestMessage("");
    setRequestError("");

    try {
      const response = await api.post("/swaps", {
        receiverId: userId,
      });

      setRequestMessage(
        response.data.message || "Swap request sent successfully!",
      );
    } catch (error) {
      console.error("Send swap request error:", error);

      setRequestError(
        error.response?.data?.message || "Unable to send swap request.",
      );
    } finally {
      setRequestLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="student-profile-page">
        <div className="student-profile-loading">Loading profile...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="student-profile-page">
        <div className="student-profile-error">
          <h2>Profile not found</h2>

          <p>{error}</p>

          <Link to="/find-skills" className="back-btn">
            <FaArrowLeft />
            Back to Matches
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="student-profile-page">
      <div className="student-profile-container">
        {/* Back to Matches */}
        <Link to="/find-skills" className="back-link">
          <FaArrowLeft />
          Back to Matches
        </Link>

        <section className="student-profile-card">
          {/* ==========================================
              PROFILE HEADER
              ========================================== */}
          <div className="student-profile-header">
            <FaUserCircle className="student-profile-icon" />

            <div>
              <h1>{student.name}</h1>

              <p>SkillSwap Student</p>

              {student.gender && student.gender !== "Prefer not to say" && (
                <p className="student-gender">Gender: {student.gender}</p>
              )}
            </div>
          </div>

          {/* ==========================================
              BIO
              ========================================== */}
          <div className="student-profile-section">
            <h2>About</h2>

            <p className="student-bio">
              {student.bio || "This student hasn't added a bio yet."}
            </p>
          </div>

          {/* ==========================================
              RATINGS & REVIEWS
              ========================================== */}
          <div className="student-profile-section rating-section">
            <h2>
              <FaStar />
              Ratings & Reviews
            </h2>

            {/* Rating Summary */}
            <div className="rating-summary">
              {student.rating?.count > 0 ? (
                <div className="rating-summary-score">
                  <span className="rating-average">
                    {Number(student.rating.average).toFixed(1)}
                  </span>

                  <div className="rating-stars-display">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FaStar
                        key={star}
                        className={
                          star <= Math.round(student.rating.average)
                            ? "profile-star filled"
                            : "profile-star"
                        }
                      />
                    ))}
                  </div>

                  <span className="rating-count">
                    Based on {student.rating.count}{" "}
                    {student.rating.count === 1 ? "rating" : "ratings"}
                  </span>
                </div>
              ) : (
                <div className="rating-summary-score">
                  <span className="rating-new">New</span>

                  <span className="rating-count">No ratings yet</span>
                </div>
              )}
            </div>

            {/* Reviews */}
            <div className="reviews-container">
              <h3>Reviews</h3>

              {ratingsLoading ? (
                <p className="reviews-loading">Loading reviews...</p>
              ) : ratingsError ? (
                <p className="reviews-error">{ratingsError}</p>
              ) : ratings.length === 0 ? (
                <p className="no-reviews">
                  No reviews yet. Complete a skill exchange to build your
                  reputation.
                </p>
              ) : (
                <div className="reviews-list">
                  {ratings.map((rating) => (
                    <div className="review-card" key={rating._id}>
                      {/* Review Header */}
                      <div className="review-header">
                        <div className="reviewer-info">
                          <FaUserCircle className="reviewer-icon" />

                          <div>
                            <h4>
                              {rating.reviewer?.name || "SkillSwap Student"}
                            </h4>

                            <span className="review-date">
                              {new Date(rating.createdAt).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Individual Rating */}
                        <div className="review-rating">
                          <FaStar />

                          <span>{rating.rating}.0</span>
                        </div>
                      </div>

                      {/* Review Text */}
                      {rating.review && (
                        <p className="review-text">"{rating.review}"</p>
                      )}

                      {/* Session Topic */}
                      {rating.session?.topic && (
                        <span className="review-session">
                          Skill exchange: {rating.session.topic}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ==========================================
              TEACHING SKILLS
              ========================================== */}
          <div className="student-profile-section">
            <h2>
              <FaChalkboardTeacher />
              Skills I Can Teach
            </h2>

            {student.skillsToTeach?.length > 0 ? (
              <div className="student-skills">
                {student.skillsToTeach.map((skill) => (
                  <span key={skill} className="student-skill teach">
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="empty-skills">No teaching skills added yet.</p>
            )}
          </div>

          {/* ==========================================
              LEARNING SKILLS
              ========================================== */}
          <div className="student-profile-section">
            <h2>
              <FaBookOpen />
              Skills I Want to Learn
            </h2>

            {student.skillsToLearn?.length > 0 ? (
              <div className="student-skills">
                {student.skillsToLearn.map((skill) => (
                  <span key={skill} className="student-skill learn">
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="empty-skills">No learning goals added yet.</p>
            )}
          </div>

          {/* ==========================================
              ACTION
              ========================================== */}
          <div className="student-profile-action">
            {relationshipStatus === "connected" ? (
              <button
                type="button"
                className="send-request-btn"
                onClick={handleOpenChat}
              >
                <FaComments />
                Connected · Chat
              </button>
            ) : relationshipStatus === "request_sent" ? (
              <div className="relationship-action request-sent">
                <FaPaperPlane />
                <span>Request Sent</span>
              </div>
            ) : relationshipStatus === "request_received" ? (
              <div className="relationship-action request-received">
                <FaUserClock />
                <span>Request Received</span>
              </div>
            ) : (
              <button
                type="button"
                className="send-request-btn"
                onClick={handleSendRequest}
                disabled={requestLoading}
              >
                {requestLoading ? "Sending..." : "Send Swap Request"}
              </button>
            )}

            {requestMessage && (
              <p className="request-success">{requestMessage}</p>
            )}

            {requestError && <p className="request-error">{requestError}</p>}
          </div>
        </section>
      </div>
    </main>
  );
};

export default StudentProfile;
