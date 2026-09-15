import { useEffect, useState } from "react";

import {
  FaUserCircle,
  FaCalendarAlt,
  FaClock,
  FaBookOpen,
  FaStickyNote,
  FaVideo,
  FaLock,
} from "react-icons/fa";

import api from "../../../services/api";

const JOIN_EARLY_MINUTES = 10;
const JOIN_AFTER_MINUTES = 60;

const SessionCard = ({
  session,
  currentUserId,
  onJoinMeeting,
}) => {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [currentTime, setCurrentTime] = useState(
    new Date()
  );

  const isRequester =
    session.requester?._id?.toString() ===
    currentUserId?.toString();

  const isPartner =
    session.partner?._id?.toString() ===
    currentUserId?.toString();

  const statusChangedByCurrentUser =
    session.statusUpdatedBy?.toString() ===
    currentUserId?.toString();

  const partner = isRequester
    ? session.partner
    : session.requester;

  /*
   * ------------------------------------------
   * KEEP CURRENT TIME UPDATED
   * ------------------------------------------
   *
   * This allows the Join Meeting button to
   * automatically unlock when the 10-minute
   * window begins.
   */
  useEffect(() => {
    if (session.status !== "accepted") {
      return;
    }

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [session.status]);

  /*
   * ------------------------------------------
   * SESSION START TIME
   * ------------------------------------------
   */
  const getSessionStartTime = () => {
    if (!session.date || !session.time) {
      return null;
    }

    const sessionDate = new Date(session.date);

    if (Number.isNaN(sessionDate.getTime())) {
      return null;
    }

    const [hours, minutes] =
      session.time.split(":").map(Number);

    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes)
    ) {
      return null;
    }

    /*
     * The date stored by the backend represents
     * the selected calendar day.
     *
     * Use the local date components so the
     * displayed session time and Join window
     * remain consistent with the user's local
     * selection.
     */
    sessionDate.setHours(
      hours,
      minutes,
      0,
      0
    );

    return sessionDate;
  };

  const sessionStartTime =
    getSessionStartTime();

  /*
   * ------------------------------------------
   * JOIN WINDOW
   * ------------------------------------------
   */
  let joinState = "unavailable";

  if (
    session.status === "accepted" &&
    sessionStartTime
  ) {
    const joinStartTime =
      new Date(
        sessionStartTime.getTime() -
          JOIN_EARLY_MINUTES * 60 * 1000
      );

    const joinEndTime =
      new Date(
        sessionStartTime.getTime() +
          JOIN_AFTER_MINUTES * 60 * 1000
      );

    if (currentTime < joinStartTime) {
      joinState = "tooEarly";
    } else if (
      currentTime >= joinStartTime &&
      currentTime <= joinEndTime
    ) {
      joinState = "available";
    } else {
      joinState = "expired";
    }
  }

  /*
   * ------------------------------------------
   * STATUS UPDATE
   * ------------------------------------------
   */
  const handleStatusUpdate = async (status) => {
    try {
      setUpdating(true);
      setError("");

      await api.patch(
        `/sessions/${session._id}/status`,
        { status }
      );
    } catch (error) {
      console.error(
        "Session status update error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to update session."
      );
    } finally {
      setUpdating(false);
    }
  };

  /*
   * ------------------------------------------
   * JOIN MEETING
   * ------------------------------------------
   */
  const handleJoinMeeting = () => {
    if (joinState !== "available") {
      return;
    }

    if (!onJoinMeeting) {
      console.warn(
        "Join Meeting handler is not connected yet."
      );

      return;
    }

    onJoinMeeting(session);
  };

  return (
    <article className="session-card">
      {/* ================= HEADER ================= */}

      <div className="session-card-header">
        <div className="session-partner">
          <FaUserCircle />

          <div>
            <span className="session-label">
              SESSION WITH
            </span>

            <h3>
              {partner?.name ||
                "SkillSwap Student"}
            </h3>
          </div>
        </div>

        <span
          className={`session-status ${session.status}`}
        >
          {session.status === "cancelled"
            ? statusChangedByCurrentUser
              ? "Cancelled by you"
              : "Cancelled by requester"
            : session.status === "rejected"
            ? statusChangedByCurrentUser
              ? "Rejected by you"
              : "Rejected by partner"
            : session.status}
        </span>
      </div>

      {/* ================= DETAILS ================= */}

      <div className="session-card-details">
        <div className="session-detail">
          <FaCalendarAlt />

          <div>
            <span>Date</span>

            <strong>
              {new Date(
                session.date
              ).toLocaleDateString([], {
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

            <strong>
              {session.time}
            </strong>
          </div>
        </div>

        <div className="session-detail">
          <FaBookOpen />

          <div>
            <span>Topic</span>

            <strong>
              {session.topic}
            </strong>
          </div>
        </div>
      </div>

      {/* ================= NOTE ================= */}

      {session.note && (
        <div className="session-note">
          <FaStickyNote />

          <p>{session.note}</p>
        </div>
      )}

      {/* ================= ACTIONS ================= */}

      {/* Pending request actions */}

      {session.status === "pending" && (
        <div className="session-actions">
          {isPartner && (
            <>
              <button
                type="button"
                className="session-reject-btn"
                onClick={() =>
                  handleStatusUpdate(
                    "rejected"
                  )
                }
                disabled={updating}
              >
                {updating
                  ? "Updating..."
                  : "Reject"}
              </button>

              <button
                type="button"
                className="session-accept-btn"
                onClick={() =>
                  handleStatusUpdate(
                    "accepted"
                  )
                }
                disabled={updating}
              >
                {updating
                  ? "Updating..."
                  : "Accept"}
              </button>
            </>
          )}

          {isRequester && (
            <button
              type="button"
              className="session-cancel-btn"
              onClick={() =>
                handleStatusUpdate(
                  "cancelled"
                )
              }
              disabled={updating}
            >
              {updating
                ? "Updating..."
                : "Cancel Request"}
            </button>
          )}
        </div>
      )}

      {/* Accepted session actions */}

      {session.status === "accepted" && (
        <>
          <div className="session-actions">
            {/* ================= JOIN MEETING ================= */}

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

            {/* ================= COMPLETE ================= */}

            <button
              type="button"
              className="session-complete-btn"
              onClick={() =>
                handleStatusUpdate(
                  "completed"
                )
              }
              disabled={updating}
            >
              {updating
                ? "Updating..."
                : "Mark as Completed"}
            </button>

            {/* ================= CANCEL ================= */}

            {isRequester && (
              <button
                type="button"
                className="session-cancel-btn"
                onClick={() =>
                  handleStatusUpdate(
                    "cancelled"
                  )
                }
                disabled={updating}
              >
                {updating
                  ? "Updating..."
                  : "Cancel Session"}
              </button>
            )}
          </div>

          {/* Join information */}

          {joinState === "tooEarly" &&
            sessionStartTime && (
              <div className="session-join-info">
                Meeting will be available 10
                minutes before the scheduled
                time.
              </div>
            )}

          {joinState === "available" && (
            <div className="session-join-info session-join-info-active">
              Meeting is available now. You
              can join until 60 minutes after
              the scheduled time.
            </div>
          )}
        </>
      )}

      {/* ================= ERROR ================= */}

      {error && (
        <div className="session-action-error">
          {error}
        </div>
      )}
    </article>
  );
};

export default SessionCard;

