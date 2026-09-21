import { useEffect, useState } from "react";

import {
  FaUserCircle,
  FaCalendarAlt,
  FaClock,
  FaBookOpen,
  FaStickyNote,
  FaVideo,
  FaLock,
  FaStar,
} from "react-icons/fa";

import api from "../../../services/api";

const JOIN_EARLY_MINUTES = 10;
const JOIN_AFTER_MINUTES = 60;

const SessionCard = ({ session, currentUserId, onJoinMeeting }) => {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);

  // Rating state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingError, setRatingError] = useState("");
  const [hasRated, setHasRated] = useState(false);
  const [myRating, setMyRating] = useState(null);

  const isRequester =
    session.requester?._id?.toString() === currentUserId?.toString();

  const isPartner =
    session.partner?._id?.toString() === currentUserId?.toString();

  const partner = isRequester ? session.partner : session.requester;

  /*
   * ==========================================
   * UPDATE CURRENT TIME
   * ==========================================
   */

  useEffect(() => {
    if (session.status !== "accepted") {
      return;
    }

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [session.status]);

  /*
   * ==========================================
   * CHECK WHETHER USER ALREADY RATED
   * ==========================================
   */

  useEffect(() => {
    const checkRating = async () => {
      if (session.status !== "completed" || !session._id) {
        return;
      }

      try {
        const response = await api.get(`/ratings/session/${session._id}`);

        setHasRated(response.data.hasRated);
        setMyRating(response.data.rating);
      } catch (error) {
        console.error("Check rating error:", error);
      }
    };

    checkRating();
  }, [session.status, session._id]);

  /*
   * ==========================================
   * GET SESSION START TIME
   * ==========================================
   */

  const getSessionStartTime = () => {
    if (!session.date || !session.time) {
      return null;
    }

    const sessionDate = new Date(session.date);

    if (Number.isNaN(sessionDate.getTime())) {
      return null;
    }

    const [hours, minutes] = session.time.split(":").map(Number);

    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return null;
    }

    sessionDate.setHours(hours, minutes, 0, 0);

    return sessionDate;
  };

  const sessionStartTime = getSessionStartTime();

  /*
   * ==========================================
   * SESSION TIMING
   * ==========================================
   */

  let sessionState = "unavailable";
  let joinState = "unavailable";

  let countdownText = "";

  if (session.status === "accepted" && sessionStartTime) {
    const joinStartTime = new Date(
      sessionStartTime.getTime() - JOIN_EARLY_MINUTES * 60 * 1000,
    );

    const sessionEndTime = new Date(
      sessionStartTime.getTime() + JOIN_AFTER_MINUTES * 60 * 1000,
    );

    /*
     * Before the 10-minute join window
     */

    if (currentTime < joinStartTime) {
      sessionState = "upcoming";
      joinState = "tooEarly";

      const difference = sessionStartTime.getTime() - currentTime.getTime();

      const totalSeconds = Math.max(0, Math.floor(difference / 1000));

      const days = Math.floor(totalSeconds / (24 * 60 * 60));

      const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));

      const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);

      const seconds = totalSeconds % 60;

      if (days > 0) {
        countdownText = `${days}d ${hours}h ${minutes}m`;
      } else if (hours > 0) {
        countdownText = `${hours}h ${minutes}m ${seconds}s`;
      } else {
        countdownText = `${minutes}m ${seconds}s`;
      }
    } else if (
      currentTime >= sessionStartTime &&
      currentTime <= sessionEndTime
    ) {
      /*
       * Session is currently live
       */

      sessionState = "live";
      joinState = "available";

      const difference = sessionEndTime.getTime() - currentTime.getTime();

      const totalSeconds = Math.max(0, Math.floor(difference / 1000));

      const hours = Math.floor(totalSeconds / (60 * 60));

      const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);

      const seconds = totalSeconds % 60;

      if (hours > 0) {
        countdownText = `${hours}h ${minutes}m ${seconds}s remaining`;
      } else {
        countdownText = `${minutes}m ${seconds}s remaining`;
      }
    } else {
      /*
       * Session window has ended
       */

      sessionState = "ended";
      joinState = "expired";
      countdownText = "Session window ended";
    }
  }

  /*
   * ==========================================
   * SESSION STATUS LABEL
   * ==========================================
   */

  const getSessionStatusLabel = () => {
    if (session.status !== "accepted") {
      return session.status;
    }

    if (sessionState === "upcoming") {
      return "Upcoming";
    }

    if (sessionState === "live") {
      return "Live Now";
    }

    if (sessionState === "ended") {
      return "Session Ended";
    }

    return "Accepted";
  };

  /*
   * ==========================================
   * SESSION STATUS CLASS
   * ==========================================
   */

  const getSessionStatusClass = () => {
    if (session.status !== "accepted") {
      return session.status;
    }

    if (sessionState === "upcoming") {
      return "upcoming";
    }

    if (sessionState === "live") {
      return "live";
    }

    if (sessionState === "ended") {
      return "ended";
    }

    return "accepted";
  };

  /*
   * ==========================================
   * UPDATE SESSION STATUS
   * ==========================================
   */

  const handleStatusUpdate = async (status) => {
    try {
      setUpdating(true);
      setError("");

      await api.patch(`/sessions/${session._id}/status`, { status });
    } catch (error) {
      console.error("Session status update error:", error);

      setError(error.response?.data?.message || "Unable to update session.");
    } finally {
      setUpdating(false);
    }
  };

  /*
   * ==========================================
   * JOIN MEETING
   * ==========================================
   */

  const handleJoinMeeting = () => {
    if (joinState !== "available") {
      return;
    }

    if (!onJoinMeeting) {
      console.warn("Join Meeting handler is not connected yet.");

      return;
    }

    onJoinMeeting(session);
  };

  /*
   * ==========================================
   * OPEN RATING MODAL
   * ==========================================
   */

  const handleOpenRating = () => {
    setRatingError("");
    setSelectedRating(0);
    setReviewText("");
    setShowRatingModal(true);
  };

  /*
   * ==========================================
   * CLOSE RATING MODAL
   * ==========================================
   */

  const handleCloseRating = () => {
    if (ratingLoading) {
      return;
    }

    setShowRatingModal(false);
    setRatingError("");
  };

  /*
   * ==========================================
   * SUBMIT RATING
   * ==========================================
   */

  const handleSubmitRating = async () => {
    if (selectedRating === 0) {
      setRatingError("Please select a rating.");
      return;
    }

    try {
      setRatingLoading(true);
      setRatingError("");

      const response = await api.post("/ratings", {
        sessionId: session._id,
        rating: selectedRating,
        review: reviewText.trim(),
      });

      setHasRated(true);
      setMyRating(response.data.rating);

      setShowRatingModal(false);
      setSelectedRating(0);
      setReviewText("");
    } catch (error) {
      console.error("Submit rating error:", error);

      setRatingError(
        error.response?.data?.message || "Unable to submit rating.",
      );
    } finally {
      setRatingLoading(false);
    }
  };

  /*
   * ==========================================
   * RENDER
   * ==========================================
   */

  return (
    <article className="session-card">
      {/* ==========================================
          CARD HEADER
          ========================================== */}

      <div className="session-card-header">
        <div className="session-partner">
          {partner?.profilePicture ? (
            <img
              src={partner.profilePicture}
              alt={`${partner.name || "Student"} profile`}
              className="session-partner-picture"
            />
          ) : (
            <FaUserCircle className="session-partner-icon" />
          )}

          <div>
            <span className="session-label">SESSION WITH</span>

            <h3>{partner?.name || "SkillSwap Student"}</h3>
          </div>
        </div>

        <span className={`session-status ${getSessionStatusClass()}`}>
          {getSessionStatusLabel()}
        </span>
      </div>

      {/* ==========================================
          SESSION DETAILS
          ========================================== */}

      <div className="session-card-details">
        <div className="session-detail">
          <FaCalendarAlt />

          <div>
            <span>Date</span>

            <strong>
              {new Date(session.date).toLocaleDateString([], {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </strong>
          </div>
        </div>

        <div className="session-detail">
          <FaClock />

          <div>
            <span>Time</span>

            <strong>{session.time}</strong>
          </div>
        </div>

        <div className="session-detail">
          <FaBookOpen />

          <div>
            <span>Topic</span>

            <strong>{session.topic}</strong>
          </div>
        </div>
      </div>

      {/* ==========================================
          NOTE
          ========================================== */}

      {session.note && (
        <div className="session-note">
          <FaStickyNote />

          <p>{session.note}</p>
        </div>
      )}

      {/* ==========================================
          PENDING REQUEST
          ========================================== */}

      {session.status === "pending" && (
        <div className="session-actions">
          {isPartner && (
            <>
              <button
                type="button"
                className="session-reject-btn"
                onClick={() => handleStatusUpdate("rejected")}
                disabled={updating}
              >
                {updating ? "Updating..." : "Reject"}
              </button>

              <button
                type="button"
                className="session-accept-btn"
                onClick={() => handleStatusUpdate("accepted")}
                disabled={updating}
              >
                {updating ? "Updating..." : "Accept"}
              </button>
            </>
          )}

          {isRequester && (
            <button
              type="button"
              className="session-cancel-btn"
              onClick={() => handleStatusUpdate("cancelled")}
              disabled={updating}
            >
              {updating ? "Updating..." : "Cancel Request"}
            </button>
          )}
        </div>
      )}

      {/* ==========================================
          ACCEPTED SESSION
          ========================================== */}

      {session.status === "accepted" && (
        <>
          {/* SESSION TIMING */}

          {sessionState === "upcoming" && (
            <div className="session-live-status session-live-status-upcoming">
              <div className="session-live-status-content">
                <span className="session-live-dot upcoming-dot" />

                <div>
                  <strong>Upcoming Session</strong>

                  <span>Starts in {countdownText}</span>
                </div>
              </div>
            </div>
          )}

          {sessionState === "live" && (
            <div className="session-live-status session-live-status-live">
              <div className="session-live-status-content">
                <span className="session-live-dot live-dot" />

                <div>
                  <strong>Live Now</strong>

                  <span>Session is currently live • {countdownText}</span>
                </div>
              </div>
            </div>
          )}

          {sessionState === "ended" && (
            <div className="session-live-status session-live-status-ended">
              <div className="session-live-status-content">
                <span className="session-live-dot ended-dot" />

                <div>
                  <strong>Session Ended</strong>

                  <span>The 60-minute meeting window has ended.</span>
                </div>
              </div>
            </div>
          )}

          {/* ACTIONS */}

          <div className="session-actions">
            {joinState === "available" && (
              <button
                type="button"
                className="session-join-btn"
                onClick={handleJoinMeeting}
              >
                <FaVideo />
                Join Meeting
              </button>
            )}

            {joinState === "tooEarly" && (
              <button
                type="button"
                className="session-join-btn session-join-btn-disabled"
                disabled
              >
                <FaLock />
                Join available 10 min before
              </button>
            )}

            {joinState === "expired" && (
              <button
                type="button"
                className="session-join-btn session-join-btn-disabled"
                disabled
              >
                <FaClock />
                Session window ended
              </button>
            )}

            <button
              type="button"
              className="session-complete-btn"
              onClick={() => setShowCompleteConfirm(true)}
              disabled={updating}
            >
              Mark as Completed
            </button>

            {isRequester && (
              <button
                type="button"
                className="session-cancel-btn"
                onClick={() => handleStatusUpdate("cancelled")}
                disabled={updating}
              >
                {updating ? "Updating..." : "Cancel Session"}
              </button>
            )}
          </div>

          {/* JOIN INFORMATION */}

          {joinState === "tooEarly" && sessionStartTime && (
            <div className="session-join-info">
              Meeting will be available 10 minutes before the scheduled time.
            </div>
          )}

          {joinState === "available" && (
            <div className="session-join-info session-join-info-active">
              Meeting is available now. You can join until 60 minutes after the
              scheduled time.
            </div>
          )}
        </>
      )}

      {/* ==========================================
          COMPLETED SESSION — RATING
          ========================================== */}

      {session.status === "completed" && (
        <div className="session-rating-section">
          {hasRated ? (
            <div className="session-rated-state">
              <div className="session-rated-header">
                <span className="session-rated-check">✓</span>

                <div>
                  <strong>You rated this session</strong>

                  <div className="session-rated-stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FaStar
                        key={star}
                        className={
                          star <= (myRating?.rating || 0)
                            ? "session-star filled"
                            : "session-star"
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>

              {myRating?.review && (
                <p className="session-my-review">"{myRating.review}"</p>
              )}
            </div>
          ) : (
            <div className="session-rate-prompt">
              <div className="session-rate-content">
                <strong>How was your skill exchange?</strong>

                <span>
                  Share your experience with {partner?.name || "your partner"}.
                </span>
              </div>

              <button
                type="button"
                className="session-rate-btn"
                onClick={handleOpenRating}
              >
                <FaStar />
                Rate Partner
              </button>
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          COMPLETE CONFIRMATION
          ========================================== */}

      {showCompleteConfirm && (
        <div className="session-confirm-box">
          <div className="session-confirm-content">
            <strong>Mark this session as completed?</strong>

            <p>This will move the session to your session history.</p>

            <div className="session-confirm-actions">
              <button
                type="button"
                className="session-confirm-cancel"
                onClick={() => setShowCompleteConfirm(false)}
                disabled={updating}
              >
                Cancel
              </button>

              <button
                type="button"
                className="session-confirm-complete"
                onClick={async () => {
                  await handleStatusUpdate("completed");

                  setShowCompleteConfirm(false);
                }}
                disabled={updating}
              >
                {updating ? "Completing..." : "Yes, Complete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          RATING MODAL
          ========================================== */}

      {showRatingModal && (
        <div
          className="rating-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              handleCloseRating();
            }
          }}
        >
          <div
            className="rating-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            {/* HEADER */}

            <div className="rating-modal-header">
              <div>
                <span className="rating-modal-label">SESSION COMPLETED</span>

                <h3>Rate {partner?.name || "your partner"}</h3>
              </div>

              <button
                type="button"
                className="rating-modal-close"
                onClick={handleCloseRating}
                disabled={ratingLoading}
                aria-label="Close rating modal"
              >
                ×
              </button>
            </div>

            {/* STARS */}

            <div className="rating-stars-container">
              <p>How was your skill exchange?</p>

              <div className="rating-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="rating-star-button"
                    onClick={() => setSelectedRating(star)}
                    disabled={ratingLoading}
                    aria-label={`Rate ${star} out of 5`}
                  >
                    <FaStar
                      className={
                        star <= selectedRating
                          ? "rating-star active"
                          : "rating-star"
                      }
                    />
                  </button>
                ))}
              </div>

              {selectedRating > 0 && (
                <span className="rating-selected-text">
                  {selectedRating === 1 && "Poor"}
                  {selectedRating === 2 && "Needs improvement"}
                  {selectedRating === 3 && "Good"}
                  {selectedRating === 4 && "Very good"}
                  {selectedRating === 5 && "Excellent"}
                </span>
              )}
            </div>

            {/* REVIEW */}

            <textarea
              className="rating-review-input"
              value={reviewText}
              onChange={(event) => setReviewText(event.target.value)}
              placeholder="Write a review (optional)"
              maxLength={500}
              disabled={ratingLoading}
            />

            <div className="rating-review-count">{reviewText.length}/500</div>

            {/* ERROR */}

            {ratingError && <div className="rating-error">{ratingError}</div>}

            {/* ACTIONS */}

            <div className="rating-modal-actions">
              <button
                type="button"
                className="rating-cancel-btn"
                onClick={handleCloseRating}
                disabled={ratingLoading}
              >
                Cancel
              </button>

              <button
                type="button"
                className="rating-submit-btn"
                onClick={handleSubmitRating}
                disabled={ratingLoading || selectedRating === 0}
              >
                {ratingLoading ? "Submitting..." : "Submit Rating"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          ERROR
          ========================================== */}

      {error && <div className="session-action-error">{error}</div>}
    </article>
  );
};

export default SessionCard;
