import {
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { useLocation,
  useNavigate
 } from "react-router-dom";

import {
  FaUserCircle,
  FaComments,
  FaArrowLeft,
} from "react-icons/fa";

import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";

import "./Chat.css";

const Chat = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    user,
    setUnreadMessageCount,
    lastReceivedMessage,
    deliveredMessageIds,
    seenMessageIds,

    // Typing
    typingUserId,
    startTyping,
    stopTyping,

    // Online / Offline
    onlineUserIds,
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
   * TYPING
   * ------------------------------------------
   */

  const typingTimeoutRef =
    useRef(null);

  const isTypingRef =
    useRef(false);

  /*
   * ------------------------------------------
   * AUTO SCROLL
   * ------------------------------------------
   */

  const messagesEndRef =
    useRef(null);

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

    const messageDate =
      new Date(date);

    if (
      Number.isNaN(
        messageDate.getTime()
      )
    ) {
      return "";
    }

    return messageDate.toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  /*
   * ------------------------------------------
   * CHECK SAME DAY
   * ------------------------------------------
   */

  const isSameDay = (
    dateA,
    dateB
  ) => {
    const firstDate =
      new Date(dateA);

    const secondDate =
      new Date(dateB);

    return (
      firstDate.getFullYear() ===
        secondDate.getFullYear() &&
      firstDate.getMonth() ===
        secondDate.getMonth() &&
      firstDate.getDate() ===
        secondDate.getDate()
    );
  };

  /*
   * ------------------------------------------
   * FORMAT DATE SEPARATOR
   * ------------------------------------------
   */

  const formatDateSeparator = (
    date
  ) => {
    if (!date) return "";

    const messageDate =
      new Date(date);

    if (
      Number.isNaN(
        messageDate.getTime()
      )
    ) {
      return "";
    }

    const today =
      new Date();

    const yesterday =
      new Date();

    yesterday.setDate(
      yesterday.getDate() - 1
    );

    if (
      isSameDay(
        messageDate,
        today
      )
    ) {
      return "Today";
    }

    if (
      isSameDay(
        messageDate,
        yesterday
      )
    ) {
      return "Yesterday";
    }

    if (
      messageDate.getFullYear() ===
      today.getFullYear()
    ) {
      return messageDate.toLocaleDateString(
        [],
        {
          weekday: "long",
          month: "long",
          day: "numeric",
        }
      );
    }

    return messageDate.toLocaleDateString(
      [],
      {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }
    );
  };

  /*
   * ------------------------------------------
   * SCROLL TO BOTTOM
   * ------------------------------------------
   */

  const scrollToBottom = (
    behavior = "smooth"
  ) => {
    if (
      messagesEndRef.current
    ) {
      messagesEndRef.current.scrollIntoView(
        {
          behavior,
          block: "end",
        }
      );
    }
  };

  /*
   * ------------------------------------------
   * CLEAR TYPING STATE
   * ------------------------------------------
   */

  const clearTypingState = () => {
    const receiverId =
      getUserId(selectedUser);

    if (
      receiverId &&
      isTypingRef.current
    ) {
      stopTyping(receiverId);
    }

    isTypingRef.current =
      false;

    if (
      typingTimeoutRef.current
    ) {
      clearTimeout(
        typingTimeoutRef.current
      );

      typingTimeoutRef.current =
        null;
    }
  };

  /*
   * ------------------------------------------
   * HANDLE MESSAGE INPUT
   * ------------------------------------------
   */

  const handleMessageChange = (
    event
  ) => {
    const value =
      event.target.value;

    setMessageText(value);

    const receiverId =
      getUserId(selectedUser);

    if (!receiverId) {
      return;
    }

    /*
     * Empty input = stop typing.
     */

    if (!value.trim()) {
      if (
        isTypingRef.current
      ) {
        stopTyping(receiverId);

        isTypingRef.current =
          false;
      }

      if (
        typingTimeoutRef.current
      ) {
        clearTimeout(
          typingTimeoutRef.current
        );

        typingTimeoutRef.current =
          null;
      }

      return;
    }

    /*
     * Start typing.
     */

    if (
      !isTypingRef.current
    ) {
      startTyping(receiverId);

      isTypingRef.current =
        true;
    }

    /*
     * Reset typing timer.
     */

    if (
      typingTimeoutRef.current
    ) {
      clearTimeout(
        typingTimeoutRef.current
      );
    }

    typingTimeoutRef.current =
      setTimeout(() => {
        stopTyping(receiverId);

        isTypingRef.current =
          false;

        typingTimeoutRef.current =
          null;
      }, 1000);
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

    
  const fetchConversations =async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await api.get(
            "/swaps/accepted"
          );

        const swaps =
          response.data.swaps || [];

        const currentUserId =
          getUserId(user);

        const uniqueUsers = [];

        const seenUserIds =
          new Set();

        swaps.forEach((swap) => {
          const senderId =
            getUserId(
              swap.sender
            );

          const receiverId =
            getUserId(
              swap.receiver
            );

          let otherUser = null;

          if (
            senderId ===
            currentUserId
          ) {
            otherUser =
              swap.receiver;
          } else if (
            receiverId ===
            currentUserId
          ) {
            otherUser =
              swap.sender;
          }

          if (!otherUser) {
            return;
          }

          const otherUserId =
            getUserId(
              otherUser
            );

          if (!otherUserId) {
            return;
          }

          if (
            !seenUserIds.has(
              otherUserId
            )
          ) {
            seenUserIds.add(
              otherUserId
            );

            uniqueUsers.push({
              user: otherUser,
              latestMessage:
                null,
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
              async (
                conversation
              ) => {
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
                    messageData.messages ||
                    [];

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
         * Sort newest first.
         */

        conversationsWithMessages.sort(
          (a, b) => {
            const dateA =
              a.latestMessage
                ? new Date(
                    a.latestMessage.createdAt
                  ).getTime()
                : 0;

            const dateB =
              b.latestMessage
                ? new Date(
                    b.latestMessage.createdAt
                  ).getTime()
                : 0;

            return (
              dateB - dateA
            );
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
 * OPEN CONVERSATION FROM NAVIGATION
 * ------------------------------------------
 */

useEffect(() => {
  const requestedUserId =
    location.state?.userId;

  if (
    !requestedUserId ||
    conversations.length === 0
  ) {
    return;
  }

  const conversation =
    conversations.find(
      (item) =>
        getUserId(item.user)?.toString() ===
        requestedUserId.toString()
    );

  if (!conversation) {
    return;
  }

  const currentlySelectedUserId =
    getUserId(selectedUser);

  if (
    currentlySelectedUserId?.toString() ===
    requestedUserId.toString()
  ) {
    return;
  }

  handleSelectConversation(conversation);

  navigate("/chat", {
  replace: true,
  state: {},
});
}, [
  location.state,
  conversations,
  selectedUser,
]);

  /*
   * ------------------------------------------
   * REAL-TIME MESSAGE UPDATE
   * ------------------------------------------
   */

  useEffect(() => {
    if (!lastReceivedMessage) {
      return;
    }

    const senderId =
      getUserId(
        lastReceivedMessage.sender
      );

    if (!senderId) {
      return;
    }

    const selectedUserId =
      getUserId(selectedUser);

    const isCurrentConversation =
      selectedUserId ===
      senderId;

    /*
     * MESSAGE RECEIVED IN OPEN CHAT
     */

    if (
      isCurrentConversation
    ) {
      setMessages(
        (previousMessages) => {
          const alreadyExists =
            previousMessages.some(
              (message) =>
                message._id ===
                lastReceivedMessage._id
            );

          if (
            alreadyExists
          ) {
            return previousMessages;
          }

          return [
            ...previousMessages,
            lastReceivedMessage,
          ];
        }
      );

      setTimeout(() => {
        scrollToBottom();
      }, 50);

      /*
       * Immediately mark as read.
       */

      api
        .patch(
          `/messages/${senderId}/read`
        )
        .then((response) => {
          const updatedCount =
            Number(
              response.data
                .updatedCount
            ) || 0;

          if (
            updatedCount > 0
          ) {
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
     * UPDATE SIDEBAR
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

        if (
          !conversationExists
        ) {
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
                unreadCount:
                  isCurrentConversation
                    ? 0
                    : conversation.unreadCount +
                      1,
              };
            }
          );

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
      deliveredMessageIds.length ===
        0
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
                conversation
                  .latestMessage
                  ._id
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
  }, [
    deliveredMessageIds,
  ]);

  /*
   * ------------------------------------------
   * UPDATE SEEN MESSAGE
   * ------------------------------------------
   */

  useEffect(() => {
    if (
      !seenMessageIds ||
      seenMessageIds.length === 0
    ) {
      return;
    }

    setMessages(
      (previousMessages) =>
        previousMessages.map(
          (message) => {
            if (
              seenMessageIds.includes(
                message._id
              )
            ) {
              return {
                ...message,
                read: true,
              };
            }

            return message;
          }
        )
    );

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
              seenMessageIds.includes(
                conversation
                  .latestMessage
                  ._id
              )
            ) {
              return {
                ...conversation,
                latestMessage: {
                  ...conversation.latestMessage,
                  read: true,
                },
              };
            }

            return conversation;
          }
        )
    );
  }, [
    seenMessageIds,
  ]);

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

      const fetchedMessages =
        response.data.messages ||
        [];

      setMessages(
        fetchedMessages
      );

      setTimeout(() => {
        scrollToBottom("auto");
      }, 50);

      return response.data;
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

  const handleSelectConversation =
    async (
      conversation
    ) => {
      clearTypingState();

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

      setMessages([]);

      if (!otherUserId) {
        return;
      }

      const unreadCountBeforeRead =
        Number(
          conversation.unreadCount
        ) || 0;

      /*
       * Clear sidebar badge.
       */

      if (
        unreadCountBeforeRead >
        0
      ) {
        setConversations(
          (previousConversations) =>
            previousConversations.map(
              (item) => {
                if (
                  getUserId(
                    item.user
                  ) ===
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

      const backendUnreadCount =
        Number(
          messageData?.unreadCount
        ) || 0;

      /*
       * Mark messages as read.
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
              response.data
                .updatedCount
            ) || 0;

          setConversations(
            (previousConversations) =>
              previousConversations.map(
                (item) => {
                  if (
                    getUserId(
                      item.user
                    ) ===
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

          if (
            updatedCount > 0
          ) {
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

      setTimeout(() => {
        scrollToBottom("auto");
      }, 100);
    };

  /*
   * ------------------------------------------
   * MOBILE BACK TO CONVERSATIONS
   * ------------------------------------------
   */

  const handleBackToConversations =
    () => {
      clearTypingState();

      setSelectedUser(null);

      setMessages([]);

      setMessageText("");

      setError("");
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

      if (!trimmedMessage) {
        return;
      }

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

      /*
       * Stop typing.
       */

      stopTyping(
        receiverId
      );

      isTypingRef.current =
        false;

      if (
        typingTimeoutRef.current
      ) {
        clearTimeout(
          typingTimeoutRef.current
        );

        typingTimeoutRef.current =
          null;
      }

      try {
        setSendingMessage(
          true
        );

        setError("");

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

        if (newMessage) {
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

              if (
                alreadyExists
              ) {
                return previousMessages;
              }

              return [
                ...previousMessages,
                messageToAdd,
              ];
            }
          );

          setTimeout(() => {
            scrollToBottom();
          }, 50);

          /*
           * Update sidebar.
           */

          setConversations(
            (previousConversations) => {
              const updated =
                previousConversations.map(
                  (conversation) => {
                    if (
                      getUserId(
                        conversation.user
                      ) !==
                      receiverId
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

              const selectedConversation =
                updated.find(
                  (conversation) =>
                    getUserId(
                      conversation.user
                    ) ===
                    receiverId
                );

              const otherConversations =
                updated.filter(
                  (conversation) =>
                    getUserId(
                      conversation.user
                    ) !==
                    receiverId
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
   * CLEANUP TYPING
   * ------------------------------------------
   */

  useEffect(() => {
    return () => {
      if (
        typingTimeoutRef.current
      ) {
        clearTimeout(
          typingTimeoutRef.current
        );
      }
    };
  }, []);

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

        <div
          className={`chat-workspace ${
            selectedUser
              ? "mobile-chat-open"
              : ""
          }`}
        >

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

              <div className="conversation-list">

                {conversations.map(
                  (
                    conversation
                  ) => {

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

                        <div className="conversation-avatar-wrapper">
  <FaUserCircle className="conversation-avatar" />

  <span
    className={`conversation-status-dot ${
      onlineUserIds.includes(
        conversationUserId
      )
        ? "online"
        : "offline"
    }`}
  />
</div>


                        <div className="conversation-info">

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

                  {/* MOBILE BACK BUTTON */}

                  <button
                    type="button"
                    className="mobile-chat-back-btn"
                    onClick={
                      handleBackToConversations
                    }
                    aria-label="Back to conversations"
                  >
                    <FaArrowLeft />
                  </button>

                  <FaUserCircle className="chat-user-avatar" />

                  <div>

                    <h2>
                      {selectedUser.name}
                    </h2>

                    <p
                      className={
                        onlineUserIds.includes(
                          getUserId(
                            selectedUser
                          )
                        )
                          ? "user-status online"
                          : "user-status offline"
                      }
                    >

                      <span className="status-dot"></span>

                      {onlineUserIds.includes(
                        getUserId(
                          selectedUser
                        )
                      )
                        ? "Online"
                        : "Offline"}

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

                  ) : messages.length ===
                    0 ? (

                    <div className="messages-placeholder">

                      <p>
                        Your conversation
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
                        (
                          message,
                          index
                        ) => {

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

                          const previousMessage =
                            index >
                            0
                              ? messages[
                                  index -
                                    1
                                ]
                              : null;

                          const shouldShowDateSeparator =
                            index ===
                              0 ||
                            !isSameDay(
                              previousMessage.createdAt,
                              message.createdAt
                            );

                          return (
                            <div
                              key={
                                message._id
                              }
                            >

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
                        }
                      )}

                      {/* AUTO SCROLL TARGET */}

                      <div
                        ref={
                          messagesEndRef
                        }
                      />

                    </div>

                  )}

                </div>

                {/* ============================ */}
                {/* TYPING INDICATOR */}
                {/* ============================ */}

                {typingUserId &&
                  typingUserId.toString() ===
                    getUserId(
                      selectedUser
                    )?.toString() && (

                    <div className="typing-indicator">

                      <span className="typing-dot"></span>

                      <span className="typing-dot"></span>

                      <span className="typing-dot"></span>

                      <span className="typing-text">
                        {
                          selectedUser.name
                        }{" "}
                        is typing...
                      </span>

                    </div>

                  )}

                {/* ============================ */}
                {/* MESSAGE INPUT */}
                {/* ============================ */}

                <div className="message-input-area">

                  <input
                    type="text"
                    placeholder={`Message ${selectedUser.name}...`}
                    value={messageText}
                    onChange={
                      handleMessageChange
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
