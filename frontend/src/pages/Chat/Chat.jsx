import { useContext, useEffect, useState } from "react";
import { FaUserCircle, FaComments } from "react-icons/fa";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import "./Chat.css";

const Chat = () => {
  const { user } = useContext(AuthContext);

  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchConversations();
  }, []);

  const getUserId = (userObject) => {
    if (!userObject) return null;

    return (
      userObject._id?.toString() ||
      userObject.id?.toString() ||
      null
    );
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/swaps/accepted");

      const swaps = response.data.swaps || [];

      const currentUserId = getUserId(user);

      const uniqueUsers = [];
      const seenUserIds = new Set();

      swaps.forEach((swap) => {
        const senderId = getUserId(swap.sender);
        const receiverId = getUserId(swap.receiver);

        let otherUser = null;

        if (senderId === currentUserId) {
          otherUser = swap.receiver;
        } else if (receiverId === currentUserId) {
          otherUser = swap.sender;
        }

        if (!otherUser) return;

        const otherUserId = getUserId(otherUser);

        if (!otherUserId) return;

        if (!seenUserIds.has(otherUserId)) {
          seenUserIds.add(otherUserId);
          uniqueUsers.push(otherUser);
        }
      });

      setConversations(uniqueUsers);
    } catch (error) {
      console.error("Fetch conversations error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to load conversations."
      );
    } finally {
      setLoading(false);
    }
  };

  // Load messages when a conversation is selected
  const fetchMessages = async (userId) => {
    try {
      setMessagesLoading(true);
      setMessages([]);
      setError("");

      const response = await api.get(`/messages/${userId}`);

      setMessages(response.data.messages || []);
    } catch (error) {
      console.error("Fetch messages error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to load messages."
      );
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSelectConversation = (conversationUser) => {
    setSelectedUser(conversationUser);

    const otherUserId = getUserId(conversationUser);

    if (otherUserId) {
      fetchMessages(otherUserId);
    }
  };

  if (loading) {
    return (
      <main className="chat-page">
        <div className="chat-loading">
          Loading your conversations...
        </div>
      </main>
    );
  }

  return (
    <main className="chat-page">
      <div className="chat-container">

        {/* Page Header */}
        <div className="chat-page-header">
          <div>
            <p className="chat-page-tag">
              CONNECT • LEARN • EXCHANGE
            </p>

            <h1>
              Skill<span>Chat</span>
            </h1>

            <p>
              Continue your skill exchange conversations.
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="chat-error">
            {error}
          </div>
        )}

        {/* Chat Workspace */}
        <div className="chat-workspace">

          {/* Conversations */}
          <aside className="conversation-panel">

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

            {conversations.length === 0 ? (
              <div className="empty-conversations">
                <FaComments />

                <h3>No conversations yet</h3>

                <p>
                  Accept a skill swap request to start
                  chatting with another student.
                </p>
              </div>
            ) : (
              <div className="conversation-list">
                {conversations.map((conversationUser) => (
                  <button
                    key={getUserId(conversationUser)}
                    className={`conversation-item ${
                      getUserId(selectedUser) ===
                      getUserId(conversationUser)
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      handleSelectConversation(conversationUser)
                    }
                  >
                    <FaUserCircle className="conversation-avatar" />

                    <div className="conversation-info">
                      <h3>
                        {conversationUser.name ||
                          "SkillSwap Student"}
                      </h3>

                      <p>
                        Skill exchange partner
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </aside>

          {/* Chat Area */}
          <section className="chat-area">

            {!selectedUser ? (
              <div className="chat-welcome">
                <FaComments />

                <h2>
                  Start a Skill Exchange
                </h2>

                <p>
                  Select a conversation to start
                  chatting with your skill partner.
                </p>
              </div>
            ) : (
              <>
                {/* Conversation Header */}
                <div className="conversation-chat-header">
                  <FaUserCircle className="chat-user-avatar" />

                  <div>
                    <h2>
                      {selectedUser.name}
                    </h2>

                    <p>
                      Skill Exchange Partner
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div className="messages-area">
                  {messagesLoading ? (
                    <div className="messages-placeholder">
                      <p>
                        Loading conversation...
                      </p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="messages-placeholder">
                      <p>
                        Your conversation with{" "}
                        <strong>
                          {selectedUser.name}
                        </strong>{" "}
                        will appear here.
                      </p>

                      <span>
                        Start by saying hello 👋
                      </span>
                    </div>
                  ) : (
                    <div className="messages-list">
                      {messages.map((message) => {
                        const senderId = getUserId(message.sender);
                        const currentUserId = getUserId(user);

                        const isMine =
                          senderId === currentUserId;

                        return (
                          <div
                            key={message._id}
                            className={`message-row ${
                              isMine ? "mine" : "theirs"
                            }`}
                          >
                            <div className="message-bubble">
                              <p>
                                {message.message}
                              </p>

                              <span>
                                {new Date(
                                  message.createdAt
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div className="message-input-area">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    disabled
                  />

                  <button disabled>
                    Send
                  </button>
                </div>
              </>
            )}

          </section>
        </div>
      </div>
    </main>
  );
};

export default Chat;
