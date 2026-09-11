
import { FaPaperPlane } from "react-icons/fa";

const MessageInput = ({
  messageText,
  selectedUser,
  onMessageChange,
  onKeyDown,
  onSend,
  sendingMessage,
}) => {
  return (
    <div className="message-input-area">
      <input
        type="text"
        placeholder={`Message ${selectedUser.name}...`}
        value={messageText}
        onChange={onMessageChange}
        onKeyDown={onKeyDown}
        disabled={sendingMessage}
      />

      <button
        type="button"
        onClick={onSend}
        disabled={
          sendingMessage ||
          !messageText.trim()
        }
        aria-label="Send message"
        title="Send message"
      >
        {sendingMessage ? (
          <span className="send-spinner"></span>
        ) : (
          <FaPaperPlane />
        )}
      </button>
    </div>
  );
};

export default MessageInput;