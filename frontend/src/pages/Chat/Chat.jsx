import {
  useContext,
  useEffect,
  useState,
} from "react";

import {
  FaUserCircle,
  FaComments,
} from "react-icons/fa";

import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";

import "./Chat.css";

const Chat = () => {
  const {
    user,
    setUnreadMessageCount,
  } = useContext(AuthContext);

  const [conversations, setConversations] =
    useState([]);

  const [selectedUser, setSelectedUser] =
    useState(null);

  const [messages, setMessages] =
    useState([]);

  const [messagesLoading, setMessagesLoading] =
    useState(false);

  const [messageText, setMessageText] =
    useState("");

  const [sendingMessage, setSendingMessage] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /*
   * ------------------------------------------
   * GET USER ID
   * ------------------------------------------
   */

  const getUserId = (userObject) => {
    if (!userObject) return null;

    if (typeof userObject === "string") {
      return userObject;
    }

    return (
      userObject._id?.toString() ||
      userObject.id?.toString() ||
      null
    );
  };

  /*
   * ------------------------------------------
   * FETCH CONVERSATIONS
   * ------------------------------------------
   */

  useEffect(() => {
    fetchConversations();
  }, [user]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/swaps/accepted"
      );

      const swaps =
        response.data.swaps || [];

      const currentUserId =
        getUserId(user);

      const uniqueUsers = [];
      const seenUserIds = new Set();

      swaps.forEach((swap) => {
        const senderId =
          getUserId(swap.sender);

        const receiverId =
          getUserId(swap.receiver);

        let otherUser = null;

        /*
         * Current user is sender
         */
        if (
          senderId === currentUserId
        ) {
          otherUser = swap.receiver;
        }

        /*
         * Current user is receiver
         */
        else if (
          receiverId === currentUserId
        ) {
          otherUser = swap.sender;
        }

        if (!otherUser) return;

        const otherUserId =
          getUserId(otherUser);

        if (!otherUserId) return;

        /*
         * Prevent duplicate conversations
         */
        if (
          !seenUserIds.has(
            otherUserId
          )
        ) {
          seenUserIds.add(
            otherUserId
          );

          uniqueUsers.push(
            otherUser
          );
        }
      });

      setConversations(
        uniqueUsers
      );
    } catch (error) {
      console.error(
        "Fetch conversations error:",
        error
      );

      setError(
        error.response?.data
          ?.message ||
          "Unable to load conversations."
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * ------------------------------------------
   * FETCH MESSAGE HISTORY
   * ------------------------------------------
   */

  const fetchMessages = async (
    userId
  ) => {
    try {
      setMessagesLoading(true);

      setMessages([]);

      setError("");

      const response =
        await api.get(
          `/messages/${userId}`
        );

      setMessages(
        response.data.messages ||
          []
      );
    } catch (error) {
      console.error(
        "Fetch messages error:",
        error
      );

      setError(
        error.response?.data
          ?.message ||
          "Unable to load messages."
      );
    } finally {
      setMessagesLoading(false);
    }
  };

  /*
   * ------------------------------------------
   * SELECT CONVERSATION
   * ------------------------------------------
   */

  const handleSelectConversation = (
    conversationUser
  ) => {
    setSelectedUser(
      conversationUser
    );

    setMessageText("");

    setError("");

    const otherUserId =
      getUserId(
        conversationUser
      );

    if (otherUserId) {
      fetchMessages(
        otherUserId
      );
    }

    /*
     * For now, opening Chat clears
     * the global unread count.
     *
     * Later we can make this
     * conversation-specific.
     */
    setUnreadMessageCount(0);
  };

  /*
   * ------------------------------------------
   * SEND MESSAGE
   * ------------------------------------------
   */

  const handleSendMessage =
    async () => {
      const trimmedMessage =
        messageText.trim();

      /*
       * Don't send empty messages
       */
      if (!trimmedMessage) {
        return;
      }

      /*
       * No selected user
       */
      if (!selectedUser) {
        return;
      }

      const receiverId =
        getUserId(
          selectedUser
        );

      if (!receiverId) {
        setError(
          "Unable to identify the receiver."
        );

        return;
      }

      try {
        setSendingMessage(true);

        setError("");

        /*
         * Send through REST API
         */
        const response =
          await api.post(
            "/messages",
            {
              receiverId,
              message:
                trimmedMessage,
            }
          );

        const newMessage =
          response.data
            .newMessage;

        /*
         * Add message immediately
         * for sender.
         *
         * Backend emits Socket.IO
         * only to receiver.
         */
        if (newMessage) {
          setMessages(
            (previousMessages) => {
              /*
               * Prevent duplicate
               * message if necessary.
               */
              const alreadyExists =
                previousMessages.some(
                  (message) =>
                    message._id ===
                    newMessage._id
                );

              if (
                alreadyExists
              ) {
                return previousMessages;
              }

              return [
                ...previousMessages,
                newMessage,
              ];
            }
          );
        }

        /*
         * Clear input
         */
        setMessageText("");
      } catch (error) {
        console.error(
          "Send message error:",
          error
        );

        setError(
          error.response?.data
            ?.message ||
            "Unable to send message."
        );
      } finally {
        setSendingMessage(
          false
        );
      }
    };

  /*
   * ------------------------------------------
   * ENTER KEY
   * ------------------------------------------
   */

  const handleMessageKeyDown =
    (event) => {
      /*
       * Enter = send
       *
       * Shift + Enter =
       * normal input
       */
      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {
        event.preventDefault();

        handleSendMessage();
      }
    };

  /*
   * ------------------------------------------
   * LOADING
   * ------------------------------------------
   */

  if (loading) {
    return (
      <main className="chat-page">
        <div className="chat-loading">
          Loading your
          conversations...
        </div>
      </main>
    );
  }

  /*
   * ------------------------------------------
   * UI
   * ------------------------------------------
   */

  return (
    <main className="chat-page">
      <div className="chat-container">

        {/* ================================== */}
        {/* PAGE HEADER */}
        {/* ================================== */}

        <div className="chat-page-header">
          <div>
            <p className="chat-page-tag">
              CONNECT • LEARN • EXCHANGE
            </p>

            <h1>
              Skill<span>Chat</span>
            </h1>

            <p>
              Continue your skill
              exchange conversations.
            </p>
          </div>
        </div>

        {/* ================================== */}
        {/* ERROR */}
        {/* ================================== */}

        {error && (
          <div className="chat-error">
            {error}
          </div>
        )}

        {/* ================================== */}
        {/* CHAT WORKSPACE */}
        {/* ================================== */}

        <div className="chat-workspace">

          {/* ================================= */}
          {/* CONVERSATIONS PANEL */}
          {/* ================================= */}

          <aside className="conversation-panel">

            <div className="conversation-header">

              <div>
                <h2>
                  Conversations
                </h2>

                <p>
                  {conversations.length}{" "}
                  active exchange
                  {conversations.length !==
                  1
                    ? "s"
                    : ""}
                </p>
              </div>

              <FaComments />

            </div>

            {/* ----------------------------- */}
            {/* NO CONVERSATIONS */}
            {/* ----------------------------- */}

            {conversations.length ===
            0 ? (

              <div className="empty-conversations">

                <FaComments />

                <h3>
                  No conversations yet
                </h3>

                <p>
                  Accept a skill swap
                  request to start
                  chatting with another
                  student.
                </p>

              </div>

            ) : (

              /* --------------------------- */
              /* CONVERSATION LIST */
              /* --------------------------- */

              <div className="conversation-list">

                {conversations.map(
                  (conversationUser) => {

                    const conversationUserId =
                      getUserId(
                        conversationUser
                      );

                    const selectedUserId =
                      getUserId(
                        selectedUser
                      );

                    return (
                      <button
                        key={
                          conversationUserId
                        }
                        className={`conversation-item ${
                          selectedUserId ===
                          conversationUserId
                            ? "active"
                            : ""
                        }`}
                        onClick={() =>
                          handleSelectConversation(
                            conversationUser
                          )
                        }
                      >

                        <FaUserCircle className="conversation-avatar" />

                        <div className="conversation-info">

                          <h3>
                            {conversationUser.name ||
                              "SkillSwap Student"}
                          </h3>

                          <p>
                            Skill exchange
                            partner
                          </p>

                        </div>

                      </button>
                    );
                  }
                )}

              </div>
            )}

          </aside>

          {/* ================================== */}
          {/* CHAT AREA */}
          {/* ================================== */}

          <section className="chat-area">

            {/* -------------------------------- */}
            {/* NO SELECTED CONVERSATION */}
            {/* -------------------------------- */}

            {!selectedUser ? (

              <div className="chat-welcome">

                <FaComments />

                <h2>
                  Start a Skill Exchange
                </h2>

                <p>
                  Select a conversation
                  to start chatting with
                  your skill partner.
                </p>

              </div>

            ) : (

              <>
                {/* ============================ */}
                {/* CHAT HEADER */}
                {/* ============================ */}

                <div className="conversation-chat-header">

                  <FaUserCircle className="chat-user-avatar" />

                  <div>

                    <h2>
                      {selectedUser.name}
                    </h2>

                    <p>
                      Skill Exchange
                      Partner
                    </p>

                  </div>

                </div>

                {/* ============================ */}
                {/* MESSAGES */}
                {/* ============================ */}

                <div className="messages-area">

                  {messagesLoading ? (

                    <div className="messages-placeholder">

                      <p>
                        Loading
                        conversation...
                      </p>

                    </div>

                  ) : messages.length ===
                    0 ? (

                    <div className="messages-placeholder">

                      <p>
                        Your
                        conversation
                        with{" "}
                        <strong>
                          {
                            selectedUser.name
                          }
                        </strong>{" "}
                        will appear
                        here.
                      </p>

                      <span>
                        Start by saying
                        hello 👋
                      </span>

                    </div>

                  ) : (

                    <div className="messages-list">

                      {messages.map(
                        (message) => {

                          const senderId =
                            getUserId(
                              message.sender
                            );

                          const currentUserId =
                            getUserId(
                              user
                            );

                          const isMine =
                            senderId ===
                            currentUserId;

                          return (
                            <div
                              key={
                                message._id
                              }
                              className={`message-row ${
                                isMine
                                  ? "mine"
                                  : "theirs"
                              }`}
                            >

                              <div className="message-bubble">

                                <p>
                                  {
                                    message.message
                                  }
                                </p>

                                <span>
                                  {new Date(
                                    message.createdAt
                                  ).toLocaleTimeString(
                                    [],
                                    {
                                      hour: "2-digit",
                                      minute:
                                        "2-digit",
                                    }
                                  )}
                                </span>

                              </div>

                            </div>
                          );
                        }
                      )}

                    </div>
                  )}

                </div>

                {/* ============================ */}
                {/* MESSAGE INPUT */}
                {/* ============================ */}

                <div className="message-input-area">

                  <input
                    type="text"
                    placeholder={`Message ${selectedUser.name}...`}
                    value={messageText}
                    onChange={(event) =>
                      setMessageText(
                        event.target.value
                      )
                    }
                    onKeyDown={
                      handleMessageKeyDown
                    }
                    disabled={
                      sendingMessage
                    }
                  />

                  <button
                    onClick={
                      handleSendMessage
                    }
                    disabled={
                      sendingMessage ||
                      !messageText.trim()
                    }
                  >
                    {sendingMessage
                      ? "Sending..."
                      : "Send"}
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