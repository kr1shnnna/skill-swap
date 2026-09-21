import {
  FaUserCircle,
  FaArrowLeft,
  FaCalendarAlt,
  FaPhone,
  FaVideo,
} from "react-icons/fa";

const ChatHeader = ({
  selectedUser,
  onlineUserIds,
  getUserId,
  onBack,
  onSchedule,
  onAudioCall,
  onVideoCall,
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

      {selectedUser.profilePicture ? (
        <img
          src={selectedUser.profilePicture}
          alt={`${selectedUser.name || "Student"} profile`}
          className="chat-user-avatar-image"
        />
      ) : (
        <FaUserCircle className="chat-user-avatar" />
      )}

      <div>
        <h2>{selectedUser.name}</h2>

        <p className={isOnline ? "user-status online" : "user-status offline"}>
          <span className="status-dot"></span>

          {isOnline ? "Online" : "Offline"}
        </p>
      </div>

      <div className="chat-header-actions">
        <button
          type="button"
          className="call-btn audio-call-btn"
          onClick={onAudioCall}
          aria-label="Start audio call"
          title="Audio call"
        >
          <FaPhone />
        </button>

        <button
          type="button"
          className="call-btn video-call-btn"
          onClick={onVideoCall}
          aria-label="Start video call"
          title="Video call"
        >
          <FaVideo />
        </button>

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
    </div>
  );
};

export default ChatHeader;
