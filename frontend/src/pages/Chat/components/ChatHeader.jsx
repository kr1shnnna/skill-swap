import { FaUserCircle, FaArrowLeft, FaCalendarAlt } from "react-icons/fa";

const ChatHeader = ({
  selectedUser,
  onlineUserIds,
  getUserId,
  onBack,
  onSchedule,
}) => {
  if (!selectedUser) {
    return null;
  }

  const selectedUserId = getUserId(selectedUser);

  const isOnline = onlineUserIds.includes(selectedUserId);

  return (
    <div className="conversation-chat-header">
      {/* MOBILE BACK BUTTON */}

      <button
        type="button"
        className="mobile-chat-back-btn"
        onClick={onBack}
        aria-label="Back to conversations"
      >
        <FaArrowLeft />
      </button>

      <FaUserCircle className="chat-user-avatar" />

      <div>
        <h2>{selectedUser.name}</h2>

        <p className={isOnline ? "user-status online" : "user-status offline"}>
          <span className="status-dot"></span>

          {isOnline ? "Online" : "Offline"}
        </p>
      </div>
      
      <button
        type="button"
        className="schedule-session-btn"
        onClick={onSchedule}
        aria-label="Schedule a session"
        title="Schedule a session"
      >
        <FaCalendarAlt />
      </button>
    </div>
  );
};

export default ChatHeader;
