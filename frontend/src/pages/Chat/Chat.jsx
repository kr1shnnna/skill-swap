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
    deliveredMessageIds,
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
    if (!user) {
      return;
    }

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

        if (!otherUser) {
          return;
        }

        const otherUserId =
          getUserId(otherUser);

        if (!otherUserId) {
          return;
        }

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
       * Fetch messages for each conversation.
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
                    Number(
                      messageData.unreadCount
                    ) || 0,
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
       * Sort by newest message.
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
   * REAL-TIME MESSAGE UPDATE
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

    const selectedUserId =
      getUserId(selectedUser);

    const isCurrentConversation =
      selectedUserId === senderId;

    /*
     * ------------------------------------------
     * MESSAGE RECEIVED IN OPEN CHAT
     * ------------------------------------------
     */

    if (isCurrentConversation) {
      setMessages((previousMessages) => {
        const alreadyExists =
          previousMessages.some(
            (message) =>
              message._id ===
              lastReceivedMessage._id
          );

        if (alreadyExists) {
          return previousMessages;
        }

        return [
          ...previousMessages,
          lastReceivedMessage,
        ];
      });

      /*
       * Since this conversation is already
       * open, immediately mark the new
       * message as read in MongoDB.
       */

      api
        .patch(
          `/messages/${senderId}/read`
        )
        .then((response) => {
          const updatedCount =
            Number(
              response.data.updatedCount
            ) || 0;

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
        })
        .catch((error) => {
          console.error(
            "Mark incoming message as read error:",
            error
          );
        });
    }

    /*
     * ------------------------------------------
     * UPDATE SIDEBAR
     * ------------------------------------------
     */

    setConversations(
      (previousConversations) => {
        const conversationExists =
          previousConversations.some(
            (conversation) =>
              getUserId(
                conversation.user
              ) === senderId
          );

        if (!conversationExists) {
          return previousConversations;
        }

        const updatedConversations =
          previousConversations.map(
            (conversation) => {
              const conversationUserId =
                getUserId(
                  conversation.user
                );

              if (
                conversationUserId !==
                senderId
              ) {
                return conversation;
              }

              return {
                ...conversation,

                latestMessage:
                  lastReceivedMessage,

                /*
                 * Open conversation:
                 *     unread = 0
                 *
                 * Closed conversation:
                 *     increase unread count
                 */

                unreadCount:
                  isCurrentConversation
                    ? 0
                    : conversation.unreadCount +
                      1,
              };
            }
          );

        /*
         * Move latest conversation
         * to the top.
         */

        const latestConversation =
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
          latestConversation,
          ...otherConversations,
        ];
      }
    );
  }, [
    lastReceivedMessage,
    selectedUser,
    setUnreadMessageCount,
  ]);

  /*
   * ------------------------------------------
   * UPDATE DELIVERED MESSAGE
   * ------------------------------------------
   */

  useEffect(() => {
    if (
      !deliveredMessageIds ||
      deliveredMessageIds.length === 0
    ) {
      return;
    }

    setMessages(
      (previousMessages) =>
        previousMessages.map(
          (message) => {
            if (
              deliveredMessageIds.includes(
                message._id
              )
            ) {
              return {
                ...message,
                delivered: true,
              };
            }

            return message;
          }
        )
    );

    /*
     * Also update the latest message
     * shown in the conversation sidebar.
     */

    setConversations(
      (previousConversations) =>
        previousConversations.map(
          (conversation) => {
            if (
              !conversation.latestMessage
            ) {
              return conversation;
            }

            if (
              deliveredMessageIds.includes(
                conversation.latestMessage._id
              )
            ) {
              return {
                ...conversation,
                latestMessage: {
                  ...conversation.latestMessage,
                  delivered: true,
                },
              };
            }

            return conversation;
          }
        )
    );
  }, [deliveredMessageIds]);

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
   * SELECT CONVERSATION
   * ------------------------------------------
   */

  const handleSelectConversation = async (
    conversation
  ) => {
    const conversationUser =
      conversation.user;

    const otherUserId =
      getUserId(conversationUser);

    setSelectedUser(
      conversationUser
    );

    setMessageText("");

    setError("");

    if (!otherUserId) {
      return;
    }

    /*
     * Remember unread count before
     * marking messages as read.
     */

    const unreadCountBeforeRead =
      Number(
        conversation.unreadCount
      ) || 0;

    /*
     * Immediately clear sidebar badge.
     */

    if (unreadCountBeforeRead > 0) {
      setConversations(
        (previousConversations) =>
          previousConversations.map(
            (item) => {
              if (
                getUserId(item.user) ===
                otherUserId
              ) {
                return {
                  ...item,
                  unreadCount: 0,
                };
              }

              return item;
            }
          )
      );
    }

    /*
     * Fetch conversation.
     */

    const messageData =
      await fetchMessages(
        otherUserId
      );

    /*
     * Backend unread count.
     */

    const backendUnreadCount =
      Number(
        messageData?.unreadCount
      ) || 0;

    /*
     * Mark unread messages as read.
     */

    if (
      backendUnreadCount > 0 ||
      unreadCountBeforeRead > 0
    ) {
      try {
        const response =
          await api.patch(
            `/messages/${otherUserId}/read`
          );

        const updatedCount =
          Number(
            response.data.updatedCount
          ) || 0;

        /*
         * Keep conversation read
         * in sidebar.
         */

        setConversations(
          (previousConversations) =>
            previousConversations.map(
              (item) => {
                if (
                  getUserId(item.user) ===
                  otherUserId
                ) {
                  return {
                    ...item,
                    unreadCount: 0,
                  };
                }

                return item;
              }
            )
        );

        /*
         * Decrease Navbar unread count.
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
    }
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
       * Don't send empty messages.
       */

      if (!trimmedMessage) {
        return;
      }

      /*
       * No selected user.
       */

      if (!selectedUser) {
        return;
      }

      const receiverId =
        getUserId(selectedUser);

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
         * Send through REST API.
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
         * Add sent message immediately.
         */

        if (newMessage) {
          /*
           * If the delivery event arrived
           * before this REST response,
           * preserve the delivered state.
           */

          const isAlreadyDelivered =
            deliveredMessageIds?.includes(
              newMessage._id
            );

          const messageToAdd = {
            ...newMessage,
            delivered:
              newMessage.delivered ||
              isAlreadyDelivered,
          };

          setMessages(
            (previousMessages) => {
              const alreadyExists =
                previousMessages.some(
                  (message) =>
                    message._id ===
                    messageToAdd._id
                );

              if (alreadyExists) {
                return previousMessages;
              }

              return [
                ...previousMessages,
                messageToAdd,
              ];
            }
          );

          /*
           * Update sidebar preview.
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
                        messageToAdd,
                      unreadCount: 0,
                    };
                  }
                );

              /*
               * Move conversation to top.
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
         * Clear input.
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
          Loading your conversations...
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
              Continue your skill exchange
              conversations.
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
                  {conversations.length !== 1
                    ? "s"
                    : ""}
                </p>
              </div>

              <FaComments />

            </div>

            {/* ----------------------------- */}
            {/* NO CONVERSATIONS */}
            {/* ----------------------------- */}

            {conversations.length === 0 ? (

              <div className="empty-conversations">

                <FaComments />

                <h3>
                  No conversations yet
                </h3>

                <p>
                  Accept a skill swap request
                  to start chatting with another
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
                  Select a conversation to start
                  chatting with your skill partner.
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
                      Skill Exchange Partner
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

                                <div className="message-meta">
                                  <span>
                                    {formatMessageTime(
                                      message.createdAt
                                    )}
                                  </span>

                                  {isMine && (
                                    <span
                                      className={`message-status ${
                                        message.delivered
                                          ? "delivered"
                                          : ""
                                      }`}
                                    >
                                      {message.delivered
                                        ? "✓✓"
                                        : "✓"}
                                    </span>
                                  )}
                                </div>

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
