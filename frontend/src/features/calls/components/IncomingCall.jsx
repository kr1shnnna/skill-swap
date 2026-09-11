
import {
  FaPhone,
  FaVideo,
  FaPhoneSlash,
  FaUserCircle,
} from "react-icons/fa";

const IncomingCall = ({
  caller,
  callType = "video",
  onAccept,
  onReject,
}) => {
  if (!caller) {
    return null;
  }

  const isVideoCall = callType === "video";

  return (
    <div className="incoming-call-overlay">
      <div className="incoming-call-card">
        <div className="incoming-call-icon">
          <FaUserCircle />
        </div>

        <p className="incoming-call-label">
          INCOMING {isVideoCall ? "VIDEO" : "AUDIO"} CALL
        </p>

        <h2>{caller.name || "SkillSwap Student"}</h2>

        <p className="incoming-call-message">
          {isVideoCall
            ? "Someone wants to start a video call with you."
            : "Someone wants to start an audio call with you."}
        </p>

        <div className="incoming-call-actions">
          <button
            type="button"
            className="incoming-call-reject"
            onClick={onReject}
            aria-label="Reject call"
          >
            <FaPhoneSlash />
            <span>Reject</span>
          </button>

          <button
            type="button"
            className="incoming-call-accept"
            onClick={onAccept}
            aria-label="Accept call"
          >
            {isVideoCall ? <FaVideo /> : <FaPhone />}
            <span>Accept</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCall;