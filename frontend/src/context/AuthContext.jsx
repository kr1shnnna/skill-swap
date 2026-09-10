import { createContext, useEffect, useState } from "react";
import api from "../services/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");

    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("token") || null;
  });

  // Number of pending incoming swap requests
  const [pendingSwapCount, setPendingSwapCount] = useState(0);

  const login = (userData, tokenData) => {
    localStorage.setItem("token", tokenData);
    localStorage.setItem("user", JSON.stringify(userData));

    setUser(userData);
    setToken(tokenData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    setToken(null);

    // Clear notifications after logout
    setPendingSwapCount(0);
  };

  // Fetch pending incoming swap requests
  const fetchPendingSwapCount = async () => {
    if (!token) {
      setPendingSwapCount(0);
      return;
    }

    try {
      const response = await api.get("/swaps/received");

      const pendingCount = (response.data.swaps || []).filter(
        (swap) => swap.status === "pending"
      ).length;

      setPendingSwapCount(pendingCount);
    } catch (error) {
      console.error(
        "Fetch pending swap requests error:",
        error
      );
    }
  };

  // Fetch notification count when user logs in
  useEffect(() => {
    fetchPendingSwapCount();
  }, [token]);

  const value = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!token,

    // Notification data
    pendingSwapCount,
    fetchPendingSwapCount,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};