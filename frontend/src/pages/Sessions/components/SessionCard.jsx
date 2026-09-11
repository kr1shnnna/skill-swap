
import {
  FaUserCircle,
  FaCalendarAlt,
  FaClock,
  FaBookOpen,
  FaStickyNote,
} from "react-icons/fa";

const SessionCard = ({
  session,
  currentUserId,
}) => {
  const isRequester =
    session.requester?._id?.toString() ===
    currentUserId?.toString();

  const partner = isRequester
    ? session.partner
    : session.requester;

  return (
    <article className="session-card">

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
          {session.status}
        </span>
      </div>

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

      {session.note && (
        <div className="session-note">
          <FaStickyNote />

          <p>
            {session.note}
          </p>
        </div>
      )}

    </article>
  );
};

export default SessionCard;

