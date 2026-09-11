import { useState } from "react";

import {
  FaUserCircle,
  FaCalendarAlt,
  FaClock,
  FaBookOpen,
  FaStickyNote,
} from "react-icons/fa";

import api from "../../../services/api";

const SessionCard = ({
  session,
  currentUserId,
}) => {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

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
              {partner?.name || "SkillSwap Student"}
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

          <p>
            {session.note}
          </p>
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
            handleStatusUpdate("rejected")
          }
          disabled={updating}
        >
          {updating ? "Updating..." : "Reject"}
        </button>

        <button
          type="button"
          className="session-accept-btn"
          onClick={() =>
            handleStatusUpdate("accepted")
          }
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
        onClick={() =>
          handleStatusUpdate("cancelled")
        }
        disabled={updating}
      >
        {updating ? "Updating..." : "Cancel Request"}
      </button>
    )}

  </div>
)}

{/* Accepted session actions */}
{session.status === "accepted" && (
  <div className="session-actions">

    <button
      type="button"
      className="session-complete-btn"
      onClick={() =>
        handleStatusUpdate("completed")
      }
      disabled={updating}
    >
      {updating
        ? "Updating..."
        : "Mark as Completed"}
    </button>

    {isRequester && (
      <button
        type="button"
        className="session-cancel-btn"
        onClick={() =>
          handleStatusUpdate("cancelled")
        }
        disabled={updating}
      >
        {updating ? "Updating..." : "Cancel Session"}
      </button>
    )}

  </div>
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
