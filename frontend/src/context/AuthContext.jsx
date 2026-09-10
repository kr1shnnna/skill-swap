import {
  createContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { io } from "socket.io-client";

import api from "../services/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // ------------------------------------------
  // USER
  // ------------------------------------------

  const [user, setUser] = useState(() => {
    const savedUser =
      localStorage.getItem("user");

    return savedUser
      ? JSON.parse(savedUser)
      : null;
  });

  // ------------------------------------------
  // TOKEN
  // ------------------------------------------

  const [token, setToken] = useState(() => {
    return (
      localStorage.getItem("token") || null
    );
  });

  // ------------------------------------------
  // SWAP REQUEST NOTIFICATION
  // ------------------------------------------

  const [
    pendingSwapCount,
    setPendingSwapCount,
  ] = useState(0);

  // ------------------------------------------
  // CHAT NOTIFICATION
  // ------------------------------------------

  const [
    unreadMessageCount,
    setUnreadMessageCount,
  ] = useState(0);

  // ------------------------------------------
  // LAST RECEIVED MESSAGE
  // ------------------------------------------

  const [
    lastReceivedMessage,
    setLastReceivedMessage,
  ] = useState(null);

  // ------------------------------------------
  // DELIVERED MESSAGE IDS
  // ------------------------------------------

  const [
    deliveredMessageIds,
    setDeliveredMessageIds,
  ] = useState([]);

  // ------------------------------------------
  // SEEN MESSAGE IDS
  // ------------------------------------------

  const [
    seenMessageIds,
    setSeenMessageIds,
  ] = useState([]);

  // ------------------------------------------
  // SOCKET.IO
  // ------------------------------------------

  const socketRef = useRef(null);

  // ------------------------------------------
  // GET USER ID
  // ------------------------------------------

  const getUserId = (userObject) => {
    if (!userObject) {
      return null;
    }

    if (typeof userObject === "string") {
      return userObject;
    }

    return (
      userObject._id?.toString() ||
      userObject.id?.toString() ||
      null
    );
  };

  // ------------------------------------------
  // LOGIN
  // ------------------------------------------

  const login = (
    userData,
    tokenData
  ) => {
    localStorage.setItem(
      "token",
      tokenData
    );

    localStorage.setItem(
      "user",
      JSON.stringify(userData)
    );

    setUser(userData);
    setToken(tokenData);

    setPendingSwapCount(0);
    setUnreadMessageCount(0);
    setLastReceivedMessage(null);
    setDeliveredMessageIds([]);
    setSeenMessageIds([]);
  };

  // ------------------------------------------
  // LOGOUT
  // ------------------------------------------

  const logout = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    setToken(null);

    setPendingSwapCount(0);
    setUnreadMessageCount(0);
    setLastReceivedMessage(null);
    setDeliveredMessageIds([]);
    setSeenMessageIds([]);
  };

  // ------------------------------------------
  // FETCH PENDING SWAP COUNT
  // ------------------------------------------

  const fetchPendingSwapCount =
    async () => {
      if (!token) {
        setPendingSwapCount(0);
        return;
      }

      try {
        const response =
          await api.get(
            "/swaps/received"
          );

        const pendingCount = (
          response.data.swaps || []
        ).filter(
          (swap) =>
            swap.status === "pending"
        ).length;

        setPendingSwapCount(
          pendingCount
        );
      } catch (error) {
        console.error(
          "Fetch pending swap count error:",
          error
        );
      }
    };

  // ------------------------------------------
  // FETCH UNREAD MESSAGE COUNT
  // ------------------------------------------

  const fetchUnreadMessageCount =
    async () => {
      if (!token) {
        setUnreadMessageCount(0);
        return;
      }

      try {
        const response =
          await api.get(
            "/messages/unread/count"
          );

        const unreadCount =
          Number(
            response.data.unreadCount
          ) || 0;

        setUnreadMessageCount(
          unreadCount
        );
      } catch (error) {
        console.error(
          "Fetch unread message count error:",
          error
        );
      }
    };

  // ------------------------------------------
  // GLOBAL SOCKET.IO CONNECTION
  // ------------------------------------------

  useEffect(() => {
    if (!user || !token) {
      return;
    }

    const userId =
      getUserId(user);

    if (!userId) {
      console.error(
        "Unable to get logged-in user ID."
      );
      return;
    }

    const socket = io(
      "http://localhost:5000",
      {
        transports: ["websocket"],
      }
    );

    socketRef.current = socket;

    // ----------------------------------------
    // SOCKET CONNECTED
    // ----------------------------------------

    socket.on("connect", () => {
      socket.emit(
        "registerUser",
        userId
      );
    });

    // ----------------------------------------
    // RECEIVE MESSAGE
    // ----------------------------------------

    socket.on(
      "receiveMessage",
      async (newMessage) => {
        // Store latest incoming message
        // for Chat.jsx.
        setLastReceivedMessage(
          newMessage
        );

        // Increase global unread count.
        setUnreadMessageCount(
          (previousCount) =>
            previousCount + 1
        );

        // ------------------------------------
        // DELIVERY CONFIRMATION
        // ------------------------------------

        try {
          await api.patch(
            "/messages/delivered",
            {
              messageId:
                newMessage._id,
            }
          );
        } catch (error) {
          console.error(
            "Message delivery confirmation error:",
            error
          );
        }
      }
    );

    // ----------------------------------------
    // MESSAGE DELIVERED
    // ----------------------------------------

    socket.on(
      "messageDelivered",
      ({ messageId }) => {
        setDeliveredMessageIds(
          (previousIds) => {
            if (
              previousIds.includes(
                messageId
              )
            ) {
              return previousIds;
            }

            return [
              ...previousIds,
              messageId,
            ];
          }
        );
      }
    );

    // ----------------------------------------
    // MESSAGES SEEN
    // ----------------------------------------

    socket.on(
      "messagesSeen",
      ({ messageIds }) => {
        setSeenMessageIds(
          (previousIds) => {
            const newIds =
              messageIds.filter(
                (messageId) =>
                  !previousIds.includes(
                    messageId
                  )
              );

            if (newIds.length === 0) {
              return previousIds;
            }

            return [
              ...previousIds,
              ...newIds,
            ];
          }
        );
      }
    );

    // ----------------------------------------
    // SOCKET ERROR
    // ----------------------------------------

    socket.on(
      "connect_error",
      (error) => {
        console.error(
          "Socket connection error:",
          error.message
        );
      }
    );

    // ----------------------------------------
    // CLEANUP
    // ----------------------------------------

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, token]);

  // ------------------------------------------
  // FETCH INITIAL SWAP COUNT
  // ------------------------------------------

  useEffect(() => {
    fetchPendingSwapCount();
  }, [token]);

  // ------------------------------------------
  // FETCH INITIAL UNREAD MESSAGE COUNT
  // ------------------------------------------

  useEffect(() => {
    fetchUnreadMessageCount();
  }, [token]);

  // ------------------------------------------
  // CONTEXT VALUE
  // ------------------------------------------

  const value = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!token,

    // Swap notifications
    pendingSwapCount,
    fetchPendingSwapCount,

    // Chat notifications
    unreadMessageCount,
    setUnreadMessageCount,
    fetchUnreadMessageCount,

    // Latest real-time message
    lastReceivedMessage,

    // Delivered messages
    deliveredMessageIds,

    // Seen messages
    seenMessageIds,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
