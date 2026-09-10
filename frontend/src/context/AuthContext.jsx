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
    const savedUser = localStorage.getItem("user");

    return savedUser
      ? JSON.parse(savedUser)
      : null;
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

  const [pendingSwapCount, setPendingSwapCount] =
    useState(0);

  // ------------------------------------------
  // CHAT NOTIFICATION
  // ------------------------------------------

  const [unreadMessageCount, setUnreadMessageCount] =
    useState(0);

  // ------------------------------------------
  // SOCKET.IO
  // ------------------------------------------

  const socketRef = useRef(null);

  // ------------------------------------------
  // GET USER ID
  // ------------------------------------------

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

  // ------------------------------------------
  // LOGIN
  // ------------------------------------------

  const login = (userData, tokenData) => {
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

    // Reset notifications when logging in
    setPendingSwapCount(0);
    setUnreadMessageCount(0);
  };

  // ------------------------------------------
  // LOGOUT
  // ------------------------------------------

  const logout = () => {
    // Disconnect Socket.IO
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
      const response = await api.get(
        "/swaps/received"
      );

      const pendingCount = (
        response.data.swaps || []
      ).filter(
        (swap) => swap.status === "pending"
      ).length;

      setPendingSwapCount(
        pendingCount
      );
    } catch (error) {
      console.error(
        "Fetch pending swap requests error:",
        error
      );
    }
  };

  // ------------------------------------------
  // GLOBAL SOCKET.IO CONNECTION
  // ------------------------------------------

  useEffect(() => {
    // Don't connect if user is not logged in
    if (!user || !token) {
      return;
    }

    const userId = getUserId(user);

    if (!userId) {
      console.error(
        "Unable to get logged-in user ID."
      );

      return;
    }

    console.log(
      "Creating global Socket.IO connection..."
    );

    // Create Socket.IO connection
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
      console.log(
        "Global Socket connected:",
        socket.id
      );

      /*
       * IMPORTANT:
       *
       * This must match your backend:
       *
       * socket.on("registerUser", (userId) => {
       *   addUser(userId, socket.id);
       * });
       */

      socket.emit(
        "registerUser",
        userId
      );

      console.log(
        "User registered with Socket.IO:",
        userId
      );
    });

    // ----------------------------------------
    // RECEIVE MESSAGE
    // ----------------------------------------

    socket.on(
      "receiveMessage",
      (newMessage) => {
        console.log(
          "Global real-time message received:",
          newMessage
        );

        /*
         * Increase unread message count.
         *
         * We are keeping this manual for now.
         * Opening /chat will NOT automatically
         * clear the count yet.
         */

        setUnreadMessageCount(
          (previousCount) =>
            previousCount + 1
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
    // SOCKET DISCONNECTED
    // ----------------------------------------

    socket.on("disconnect", (reason) => {
      console.log(
        "Global Socket disconnected:",
        reason
      );
    });

    // ----------------------------------------
    // CLEANUP
    // ----------------------------------------

    return () => {
      console.log(
        "Cleaning up global Socket.IO connection..."
      );

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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
