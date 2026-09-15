import { createContext, useEffect, useRef, useState } from "react";

import { io } from "socket.io-client";

import api from "../services/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // ------------------------------------------
  // USER
  // ------------------------------------------

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");

    return savedUser ? JSON.parse(savedUser) : null;
  });

  // ------------------------------------------
  // TOKEN
  // ------------------------------------------

  const [token, setToken] = useState(() => {
    return localStorage.getItem("token") || null;
  });

  // ------------------------------------------
  // SWAP REQUEST NOTIFICATION
  // ------------------------------------------

  const [pendingSwapCount, setPendingSwapCount] = useState(0);

  // ------------------------------------------
  // CHAT NOTIFICATION
  // ------------------------------------------

  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  // ------------------------------------------
  // LAST RECEIVED MESSAGE
  // ------------------------------------------

  const [lastReceivedMessage, setLastReceivedMessage] = useState(null);

  // ------------------------------------------
  // DELIVERED MESSAGE IDS
  // ------------------------------------------

  const [deliveredMessageIds, setDeliveredMessageIds] = useState([]);

  // ------------------------------------------
  // SEEN MESSAGE IDS
  // ------------------------------------------

  const [seenMessageIds, setSeenMessageIds] = useState([]);

  // ------------------------------------------
  // TYPING USER
  // ------------------------------------------

  const [typingUserId, setTypingUserId] = useState(null);

  // ------------------------------------------
  // ONLINE USERS
  // ------------------------------------------

  const [onlineUserIds, setOnlineUserIds] = useState([]);

  // ------------------------------------------
  // INCOMING CALL
  // ------------------------------------------

  const [incomingCall, setIncomingCall] = useState(null);

  // ------------------------------------------
  // OUTGOING CALL / CALLING STATE
  // ------------------------------------------

  const [outgoingCall, setOutgoingCall] = useState(null);

  // ------------------------------------------
  // CALL ACCEPTED
  // ------------------------------------------

  const [callAccepted, setCallAccepted] = useState(null);

  // ------------------------------------------
  // CALL REJECTED
  // ------------------------------------------

  const [callRejected, setCallRejected] = useState(false);

  // ------------------------------------------
  // CALL CANCELLED
  // ------------------------------------------

  const [callCancelled, setCallCancelled] = useState(false);

  // ------------------------------------------
  // CALL FAILED
  // ------------------------------------------

  const [callFailed, setCallFailed] = useState(null);

  // ------------------------------------------
  // CALL ENDED
  // ------------------------------------------

  const [callEnded, setCallEnded] = useState(false);

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

    return userObject._id?.toString() || userObject.id?.toString() || null;
  };

  // ------------------------------------------
  // LOGIN
  // ------------------------------------------

  const login = (userData, tokenData) => {
    localStorage.setItem("token", tokenData);

    localStorage.setItem("user", JSON.stringify(userData));

    setUser(userData);
    setToken(tokenData);

    setPendingSwapCount(0);
    setUnreadMessageCount(0);
    setLastReceivedMessage(null);
    setDeliveredMessageIds([]);
    setSeenMessageIds([]);
    setTypingUserId(null);
    setOnlineUserIds([]);

    // Reset call state
    setIncomingCall(null);
    setOutgoingCall(null);
    setCallAccepted(null);
    setCallRejected(false);
    setCallCancelled(false);

    setCallEnded(false);

    setCallFailed(null);
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
    setTypingUserId(null);
    setOnlineUserIds([]);

    // Reset call state
    setIncomingCall(null);
    setOutgoingCall(null);
    setCallAccepted(null);
    setCallRejected(false);
    setCallCancelled(false);
    setCallEnded(false);
    setCallFailed(null);
  };

  // ------------------------------------------
  // FETCH PENDING SWAP COUNT
  // ------------------------------------------

  const fetchPendingSwapCount = async () => {
    if (!token) {
      setPendingSwapCount(0);
      return;
    }

    try {
      const response = await api.get("/swaps/received");

      const pendingCount = (response.data.swaps || []).filter(
        (swap) => swap.status === "pending",
      ).length;

      setPendingSwapCount(pendingCount);
    } catch (error) {
      console.error("Fetch pending swap count error:", error);
    }
  };

  // ------------------------------------------
  // FETCH UNREAD MESSAGE COUNT
  // ------------------------------------------

  const fetchUnreadMessageCount = async () => {
    if (!token) {
      setUnreadMessageCount(0);
      return;
    }

    try {
      const response = await api.get("/messages/unread/count");

      const unreadCount = Number(response.data.unreadCount) || 0;

      setUnreadMessageCount(unreadCount);
    } catch (error) {
      console.error("Fetch unread message count error:", error);
    }
  };

  // ------------------------------------------
  // GLOBAL SOCKET.IO CONNECTION
  // ------------------------------------------

  useEffect(() => {
    if (!user || !token) {
      return;
    }

    const userId = getUserId(user);

    if (!userId) {
      console.error("Unable to get logged-in user ID.");

      return;
    }

    const socket = io("http://localhost:5000", {
      transports: ["websocket"],
    });

    socketRef.current = socket;

    // ----------------------------------------
    // SOCKET CONNECTED
    // ----------------------------------------

    socket.on("connect", () => {
      socket.emit("registerUser", userId);
    });

    // ----------------------------------------
    // CURRENT ONLINE USERS
    // ----------------------------------------

    socket.on("onlineUsers", (userIds) => {
      if (!Array.isArray(userIds)) {
        return;
      }

      const normalizedIds = userIds.filter(Boolean).map((id) => id.toString());

      setOnlineUserIds(normalizedIds);
    });

    // ----------------------------------------
    // USER CAME ONLINE
    // ----------------------------------------

    socket.on("userOnline", ({ userId }) => {
      if (!userId) {
        return;
      }

      const normalizedId = userId.toString();

      setOnlineUserIds((previousIds) => {
        if (previousIds.includes(normalizedId)) {
          return previousIds;
        }

        return [...previousIds, normalizedId];
      });
    });

    // ----------------------------------------
    // USER WENT OFFLINE
    // ----------------------------------------

    socket.on("userOffline", ({ userId }) => {
      if (!userId) {
        return;
      }

      const normalizedId = userId.toString();

      setOnlineUserIds((previousIds) =>
        previousIds.filter((id) => id !== normalizedId),
      );
    });

    // ----------------------------------------
    // RECEIVE MESSAGE
    // ----------------------------------------

    socket.on("receiveMessage", async (newMessage) => {
      setLastReceivedMessage(newMessage);

      setUnreadMessageCount((previousCount) => previousCount + 1);

      // ------------------------------------
      // DELIVERY CONFIRMATION
      // ------------------------------------

      try {
        await api.patch("/messages/delivered", {
          messageId: newMessage._id,
        });
      } catch (error) {
        console.error("Message delivery confirmation error:", error);
      }
    });

    // ----------------------------------------
    // MESSAGE DELIVERED
    // ----------------------------------------

    socket.on("messageDelivered", ({ messageId }) => {
      setDeliveredMessageIds((previousIds) => {
        if (previousIds.includes(messageId)) {
          return previousIds;
        }

        return [...previousIds, messageId];
      });
    });

    // ----------------------------------------
    // MESSAGES SEEN
    // ----------------------------------------

    socket.on("messagesSeen", ({ messageIds }) => {
      setSeenMessageIds((previousIds) => {
        const newIds = messageIds.filter(
          (messageId) => !previousIds.includes(messageId),
        );

        if (newIds.length === 0) {
          return previousIds;
        }

        return [...previousIds, ...newIds];
      });
    });

    // ----------------------------------------
    // USER TYPING
    // ----------------------------------------

    socket.on("userTyping", ({ senderId }) => {
      setTypingUserId(senderId?.toString() || null);
    });

    // ----------------------------------------
    // USER STOPPED TYPING
    // ----------------------------------------

    socket.on("userStoppedTyping", ({ senderId }) => {
      const stoppedUserId = senderId?.toString();

      setTypingUserId((previousId) =>
        previousId?.toString() === stoppedUserId ? null : previousId,
      );
    });

    // ----------------------------------------
    // INCOMING CALL
    // ----------------------------------------

    socket.on("incomingCall", ({ callerId, callType, roomName }) => {
      if (!callerId || !callType || !roomName) {
        return;
      }

      // Clear any previous call status
      setCallRejected(false);
      setCallCancelled(false);
      setCallFailed(null);

      setIncomingCall({
        callerId: callerId.toString(),
        callType,
        roomName,
      });
    });

    // ----------------------------------------
    // CALL ACCEPTED
    // ----------------------------------------

    socket.on("callAccepted", ({ callType, roomName }) => {
      if (!callType || !roomName) {
        return;
      }

      setCallAccepted({
        callType,
        roomName,
      });

      // Stop calling state
      setOutgoingCall(null);
    });

    // ----------------------------------------
    // CALL REJECTED
    // ----------------------------------------

    socket.on("callRejected", () => {
      setCallRejected(true);

      // Stop calling state
      setOutgoingCall(null);
    });

    // ----------------------------------------
    // CALL CANCELLED
    // ----------------------------------------

    socket.on("callCancelled", () => {
      setCallCancelled(true);

      // Clear incoming call
      setIncomingCall(null);
    });

    // ----------------------------------------
    // CALL ENDED
    // ----------------------------------------

    socket.on("callEnded", () => {
      setCallEnded(true);
    });

    // ----------------------------------------
    // CALL FAILED
    // ----------------------------------------

    socket.on("callFailed", ({ message }) => {
      setCallFailed({
        message: message || "Unable to start the call.",
      });

      // Stop calling state
      setOutgoingCall(null);
    });

    // ----------------------------------------
    // SOCKET ERROR
    // ----------------------------------------

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
    });

    // ----------------------------------------
    // CLEANUP
    // ----------------------------------------

    return () => {
      socket.disconnect();
      socketRef.current = null;

      setTypingUserId(null);
      setOnlineUserIds([]);

      setIncomingCall(null);
      setOutgoingCall(null);
      setCallAccepted(null);
      setCallRejected(false);
      setCallCancelled(false);
      setCallEnded(false);
      setCallFailed(null);
    };
  }, [user, token]);

  // ------------------------------------------
  // START TYPING
  // ------------------------------------------

  const startTyping = (receiverId) => {
    if (!socketRef.current) {
      return;
    }

    if (!receiverId) {
      return;
    }

    socketRef.current.emit("typing", {
      receiverId: receiverId.toString(),
    });
  };

  // ------------------------------------------
  // STOP TYPING
  // ------------------------------------------

  const stopTyping = (receiverId) => {
    if (!socketRef.current) {
      return;
    }

    if (!receiverId) {
      return;
    }

    socketRef.current.emit("stopTyping", {
      receiverId: receiverId.toString(),
    });
  };

  // ------------------------------------------
  // START CALL
  // ------------------------------------------

  const startCall = (receiverId, callType, roomName) => {
    if (!socketRef.current) {
      console.error("Socket is not connected.");

      return false;
    }

    if (!receiverId || !callType || !roomName) {
      return false;
    }

    // Reset previous call states
    setCallAccepted(null);
    setCallRejected(false);
    setCallCancelled(false);
    setCallFailed(null);

    // Store outgoing call
    setOutgoingCall({
      receiverId: receiverId.toString(),
      callType,
      roomName,
    });

    socketRef.current.emit("callUser", {
  receiverId: receiverId.toString(),
  callerName:
    user?.name ||
    user?.username ||
    user?.fullName ||
    "SkillSwap Student",
  callType,
  roomName,
});
    return true;
  };

  // ------------------------------------------
  // ACCEPT CALL
  // ------------------------------------------

  const acceptCall = (callerId, callType, roomName) => {
    if (!socketRef.current) {
      console.error("Socket is not connected.");

      return false;
    }

    if (!callerId || !callType || !roomName) {
      return false;
    }

    socketRef.current.emit("acceptCall", {
      callerId: callerId.toString(),
      callType,
      roomName,
    });

    // Clear incoming call
    setIncomingCall(null);

    // Reset old call states
    setCallRejected(false);
    setCallCancelled(false);
    setCallFailed(null);

    return true;
  };

  // ------------------------------------------
  // REJECT CALL
  // ------------------------------------------

  const rejectCall = (callerId) => {
    if (!socketRef.current) {
      console.error("Socket is not connected.");

      return false;
    }

    if (!callerId) {
      return false;
    }

    socketRef.current.emit("rejectCall", {
      callerId: callerId.toString(),
    });

    // Clear incoming call
    setIncomingCall(null);

    return true;
  };

  // ------------------------------------------
  // CANCEL CALL
  // ------------------------------------------

  const cancelCall = (receiverId) => {
    if (!socketRef.current) {
      console.error("Socket is not connected.");

      return false;
    }

    if (!receiverId) {
      return false;
    }

    socketRef.current.emit("cancelCall", {
      receiverId: receiverId.toString(),
    });

    // Clear outgoing call
    setOutgoingCall(null);

    return true;
  };

  // ------------------------------------------
  // END ACTIVE CALL
  // ------------------------------------------

  const endCall = (receiverId) => {
    if (!socketRef.current) {
      console.error("Socket is not connected.");

      return false;
    }

    if (!receiverId) {
      return false;
    }

    socketRef.current.emit("endCall", {
      receiverId: receiverId.toString(),
    });

    return true;
  };

  // ------------------------------------------
  // CLEAR CALL STATUS
  // ------------------------------------------

  const clearCallStatus = () => {
    setCallAccepted(null);
    setCallRejected(false);
    setCallCancelled(false);
    setCallFailed(null);
    setCallEnded(false);

  };

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

    // Typing indicator
    typingUserId,
    startTyping,
    stopTyping,

    // ----------------------------------------
    // CALLS
    // ----------------------------------------

    startCall,

    incomingCall,
    setIncomingCall,

    outgoingCall,
    setOutgoingCall,

    acceptCall,

    callAccepted,
    setCallAccepted,

    rejectCall,

    callRejected,
    setCallRejected,

    cancelCall,

    callCancelled,
    setCallCancelled,

    endCall,

    callEnded,
    setCallEnded,

    callFailed,
    setCallFailed,

    clearCallStatus,

    // Online users
    onlineUserIds,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
