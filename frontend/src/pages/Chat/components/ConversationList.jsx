import { FaUserCircle, FaComments } from "react-icons/fa";

const ConversationList = ({
  conversations,
  selectedUser,
  getUserId,
  onlineUserIds,
  formatMessageTime,
  onSelectConversation,
}) => {
  return (
    <aside className="conversation-panel">
      {/* ================================= */}
      {/* CONVERSATIONS HEADER */}
      {/* ================================= */}

      <div className="conversation-header">
        <div>
          <h2>Conversations</h2>

          <p>
            {conversations.length} active exchange
            {conversations.length !== 1 ? "s" : ""}
          </p>
        </div>

        <FaComments />
      </div>

      {/* ================================= */}
      {/* EMPTY STATE */}
      {/* ================================= */}

      {conversations.length === 0 ? (
        <div className="empty-conversations">
          <FaComments />

          <h3>No conversations yet</h3>

          <p>
            Accept a skill swap request to start chatting with another student.
          </p>
        </div>
      ) : (
        /* ================================= */
        /* CONVERSATION LIST */
        /* ================================= */

        <div className="conversation-list">
          {conversations.map((conversation) => {
            const conversationUser = conversation.user;

            const conversationUserId = getUserId(conversationUser);

            const selectedUserId = getUserId(selectedUser);

            const latestMessage = conversation.latestMessage;

            const isOnline = onlineUserIds.includes(conversationUserId);

            return (
              <button
                key={conversationUserId}
                type="button"
                className={`conversation-item ${
                  selectedUserId === conversationUserId ? "active" : ""
                }`}
                onClick={() => onSelectConversation(conversation)}
              >
                {/* ======================= */}
                {/* AVATAR */}
                {/* ======================= */}

                <div className="conversation-avatar-wrapper">
                  {conversationUser.profilePicture ? (
                    <img
                      src={conversationUser.profilePicture}
                      alt={`${conversationUser.name || "Student"} profile`}
                      className="conversation-avatar-image"
                    />
                  ) : (
                    <FaUserCircle className="conversation-avatar" />
                  )}

                  <span
                    className={`conversation-status-dot ${
                      isOnline ? "online" : "offline"
                    }`}
                  />
                </div>

                {/* ======================= */}
                {/* CONVERSATION INFO */}
                {/* ======================= */}

                <div className="conversation-info">
                  {/* NAME + TIME */}

                  <div className="conversation-top-row">
                    <h3>{conversationUser.name || "SkillSwap Student"}</h3>

                    {latestMessage && (
                      <span className="conversation-time">
                        {formatMessageTime(latestMessage.createdAt)}
                      </span>
                    )}
                  </div>

                  {/* MESSAGE PREVIEW */}

                  <div className="conversation-bottom-row">
                    <p
                      className={
                        conversation.unreadCount > 0 ? "unread-preview" : ""
                      }
                    >
                      {latestMessage
                        ? latestMessage.message
                        : "Skill exchange partner"}
                    </p>

                    {/* UNREAD BADGE */}

                    {conversation.unreadCount > 0 && (
                      <span className="conversation-unread-badge">
                        {conversation.unreadCount > 9
                          ? "9+"
                          : conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </aside>
  );
};

export default ConversationList;
