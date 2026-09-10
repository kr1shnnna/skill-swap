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
    lastReceivedMessage,
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
   * FORMAT MESSAGE TIME
   * ------------------------------------------
   */

  const formatMessageTime = (date) => {
    if (!date) return "";

    const messageDate = new Date(date);

    if (Number.isNaN(messageDate.getTime())) {
      return "";
    }

    return messageDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
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
        if (senderId === currentUserId) {
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
          !seenUserIds.has(otherUserId)
        ) {
          seenUserIds.add(otherUserId);

          uniqueUsers.push({
            user: otherUser,
            latestMessage: null,
            unreadCount: 0,
          });
        }
      });

      /*
       * Fetch latest message and unread count
       * for every conversation.
       */
      const conversationsWithMessages =
        await Promise.all(
          uniqueUsers.map(
            async (conversation) => {
              try {
                const otherUserId =
                  getUserId(
                    conversation.user
                  );

                const messageResponse =
                  await api.get(
                    `/messages/${otherUserId}`
                  );

                const messageData =
                  messageResponse.data;

                const conversationMessages =
                  messageData.messages || [];

                const latestMessage =
                  conversationMessages.length >
                  0
                    ? conversationMessages[
                        conversationMessages.length -
                          1
                      ]
                    : null;

                return {
                  ...conversation,
                  latestMessage,
                  unreadCount:
                    messageData.unreadCount || 0,
                };
              } catch (error) {
                console.error(
                  "Fetch conversation messages error:",
                  error
                );

                return conversation;
              }
            }
          )
        );

      /*
       * Sort conversations so the one with
       * the newest message appears first.
       *
       * Conversations with no messages go last.
       */
      conversationsWithMessages.sort(
        (a, b) => {
          const dateA = a.latestMessage
            ? new Date(
                a.latestMessage.createdAt
              ).getTime()
            : 0;

          const dateB = b.latestMessage
            ? new Date(
                b.latestMessage.createdAt
              ).getTime()
            : 0;

          return dateB - dateA;
        }
      );

      setConversations(
        conversationsWithMessages
      );
    } catch (error) {
      console.error(
        "Fetch conversations error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to load conversations."
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * ------------------------------------------
   * REAL-TIME SIDEBAR MESSAGE UPDATE
   * ------------------------------------------
   */

  useEffect(() => {
    if (!lastReceivedMessage) {
      return;
    }

    const senderId = getUserId(
      lastReceivedMessage.sender
    );

    if (!senderId) {
      return;
    }

    setConversations(
      (previousConversations) => {
        const existingConversation =
          previousConversations.find(
            (conversation) =>
              getUserId(
                conversation.user
              ) === senderId
          );

        /*
         * If the conversation already exists,
         * update its latest message.
         */
        if (existingConversation) {
          const updatedConversations =
            previousConversations.map(
              (conversation) => {
                if (
                  getUserId(
                    conversation.user
                  ) !== senderId
                ) {
                  return conversation;
                }

                /*
                 * If this is not the currently
                 * selected conversation, increase
                 * its unread count.
                 */
                const selectedUserId =
                  getUserId(
                    selectedUser
                  );

                const isCurrentlyOpen =
                  selectedUserId ===
                  senderId;

                return {
                  ...conversation,
                  latestMessage:
                    lastReceivedMessage,
                  unreadCount:
                    isCurrentlyOpen
                      ? conversation.unreadCount
                      : conversation.unreadCount +
                        1,
                };
              }
            );

          /*
           * Move the conversation with the
           * newest message to the top.
           */
          const updatedConversation =
            updatedConversations.find(
              (conversation) =>
                getUserId(
                  conversation.user
                ) === senderId
            );

          const otherConversations =
            updatedConversations.filter(
              (conversation) =>
                getUserId(
                  conversation.user
                ) !== senderId
            );

          return [
            updatedConversation,
            ...otherConversations,
          ];
        }

        /*
         * Conversation shouldn't normally
         * be missing because it comes from
         * accepted swaps.
         */
        return previousConversations;
      }
    );
  }, [lastReceivedMessage]);

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
        response.data.messages || []
      );

      return response.data;
    } catch (error) {
      console.error(
        "Fetch messages error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to load messages."
      );

      return null;
    } finally {
      setMessagesLoading(false);
    }
  };

  /*
   * ------------------------------------------
   * MARK CONVERSATION AS READ
   * ------------------------------------------
   */

  const markConversationAsRead = async (
    userId,
    unreadCount
  ) => {
    if (!unreadCount || unreadCount <= 0) {
      return;
    }

    try {
      const response =
        await api.patch(
          `/messages/${userId}/read`
        );

      const updatedCount =
        response.data.updatedCount || 0;

      /*
       * Update this conversation's unread
       * count only.
       */
      setConversations(
        (previousConversations) =>
          previousConversations.map(
            (conversation) => {
              if (
                getUserId(
                  conversation.user
                ) === userId
              ) {
                return {
                  ...conversation,
                  unreadCount: 0,
                };
              }

              return conversation;
            }
          )
      );

      /*
       * Decrease global Navbar notification.
       */
      if (updatedCount > 0) {
        setUnreadMessageCount(
          (previousCount) =>
            Math.max(
              0,
              previousCount -
                updatedCount
            )
        );
      }
    } catch (error) {
      console.error(
        "Mark messages as read error:",
        error
      );
    }
  };

  /*
   * ------------------------------------------
   * SELECT CONVERSATION
   * ------------------------------------------
   */

  const handleSelectConversation = async (
    conversation
  ) => {
    const conversationUser =
      conversation.user;

    const otherUserId =
      getUserId(
        conversationUser
      );

    setSelectedUser(
      conversationUser
    );

    setMessageText("");

    setError("");

    if (!otherUserId) {
      return;
    }

    /*
     * Fetch conversation messages.
     */
    const messageData =
      await fetchMessages(
        otherUserId
      );

    /*
     * Mark only this conversation
     * as read.
     */
    const unreadCount =
      messageData?.unreadCount ||
      conversation.unreadCount ||
      0;

    await markConversationAsRead(
      otherUserId,
      unreadCount
    );
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
          response.data.newMessage;

        /*
         * Add message immediately
         * for sender.
         */
        if (newMessage) {
          setMessages(
            (previousMessages) => {
              const alreadyExists =
                previousMessages.some(
                  (message) =>
                    message._id ===
                    newMessage._id
                );

              if (alreadyExists) {
                return previousMessages;
              }

              return [
                ...previousMessages,
                newMessage,
              ];
            }
          );

          /*
           * Update sidebar preview
           * for the current conversation.
           */
          setConversations(
            (previousConversations) => {
              const updated =
                previousConversations.map(
                  (conversation) => {
                    if (
                      getUserId(
                        conversation.user
                      ) !== receiverId
                    ) {
                      return conversation;
                    }

                    return {
                      ...conversation,
                      latestMessage:
                        newMessage,
                    };
                  }
                );

              /*
               * Move this conversation
               * to the top.
               */
              const selectedConversation =
                updated.find(
                  (conversation) =>
                    getUserId(
                      conversation.user
                    ) === receiverId
                );

              const otherConversations =
                updated.filter(
                  (conversation) =>
                    getUserId(
                      conversation.user
                    ) !== receiverId
                );

              return selectedConversation
                ? [
                    selectedConversation,
                    ...otherConversations,
                  ]
                : updated;
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
          error.response?.data?.message ||
            "Unable to send message."
        );
      } finally {
        setSendingMessage(false);
      }
    };

  /*
   * ------------------------------------------
   * ENTER KEY
   * ------------------------------------------
   */

  const handleMessageKeyDown =
    (event) => {
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
                  (conversation) => {

                    const conversationUser =
                      conversation.user;

                    const conversationUserId =
                      getUserId(
                        conversationUser
                      );

                    const selectedUserId =
                      getUserId(
                        selectedUser
                      );

                    const latestMessage =
                      conversation.latestMessage;

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
                            conversation
                          )
                        }
                      >

                        <FaUserCircle className="conversation-avatar" />

                        <div className="conversation-info">

                          {/* USER + TIME */}
                          <div className="conversation-top-row">

                            <h3>
                              {conversationUser.name ||
                                "SkillSwap Student"}
                            </h3>

                            {latestMessage && (
                              <span className="conversation-time">
                                {formatMessageTime(
                                  latestMessage.createdAt
                                )}
                              </span>
                            )}

                          </div>

                          {/* MESSAGE PREVIEW + UNREAD */}
                          <div className="conversation-bottom-row">

                            <p
                              className={
                                conversation.unreadCount >
                                0
                                  ? "unread-preview"
                                  : ""
                              }
                            >
                              {latestMessage
                                ? latestMessage.message
                                : "Skill exchange partner"}
                            </p>

                            {conversation.unreadCount >
                              0 && (
                              <span className="conversation-unread-badge">
                                {conversation.unreadCount >
                                9
                                  ? "9+"
                                  : conversation.unreadCount}
                              </span>
                            )}

                          </div>

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
                            getUserId(user);

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
                                  {formatMessageTime(
                                    message.createdAt
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
