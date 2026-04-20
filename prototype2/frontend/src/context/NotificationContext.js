import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { AuthContext } from "./AuthContext";

export const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { token } = useContext(AuthContext);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = async () => {
    if (!token) {
      setUnreadCount(0);
      return;
    }

    try {
      const notifications = await api.get("/notifications?onlyUnread=true", token);
      setUnreadCount(notifications.length);
    } catch (error) {
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    refreshUnreadCount();
  }, [token]);

  const value = useMemo(
    () => ({
      unreadCount,
      refreshUnreadCount,
    }),
    [unreadCount]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

