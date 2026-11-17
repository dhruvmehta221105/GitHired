import { useCallback, useEffect, useState } from "react";
import { AuthContext } from "./authContextValue";

export const AuthProvider = ({ children }) => {
  // ✅ safe parse (fixes JSON error)
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  const login = (data) => {
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("token", data.token);
    setUser(data.user);
  };

  const updateUser = useCallback((updates) => {
    setUser((currentUser) => currentUser && { ...currentUser, ...updates });
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
  }, [user]);

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
  };

  // Helper function to check if user is admin
  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, login, updateUser, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

