
const MessageList = ({
  messages,
  user,
  getUserId,
  isSameDay,
  formatDateSeparator,
  formatMessageTime,
  messagesEndRef,
}) => {
  return (
    <div className="messages-list">

      {messages.map((message, index) => {
        const senderId =
          getUserId(message.sender);

        const currentUserId =
          getUserId(user);

        const isMine =
          senderId === currentUserId;

        const previousMessage =
          index > 0
            ? messages[index - 1]
            : null;

        const shouldShowDateSeparator =
          index === 0 ||
          !isSameDay(
            previousMessage.createdAt,
            message.createdAt
          );

        return (
          <div key={message._id}>

            {shouldShowDateSeparator && (
              <div className="message-date-separator">
                <span>
                  {formatDateSeparator(
                    message.createdAt
                  )}
                </span>
              </div>
            )}

            <div
              className={`message-row ${
                isMine
                  ? "mine"
                  : "theirs"
              }`}
            >
              <div className="message-bubble">

                <p>
                  {message.message}
                </p>

                <div className="message-meta">

                  <span>
                    {formatMessageTime(
                      message.createdAt
                    )}
                  </span>

                  {isMine && (
                    <span
                      className={`message-status ${
                        message.read
                          ? "seen"
                          : message.delivered
                          ? "delivered"
                          : ""
                      }`}
                    >
                      {message.read
                        ? "✓✓"
                        : message.delivered
                        ? "✓✓"
                        : "✓"}
                    </span>
                  )}

                </div>

              </div>
            </div>

          </div>
        );
      })}

      <div ref={messagesEndRef} />

    </div>
  );
};

export default MessageList;