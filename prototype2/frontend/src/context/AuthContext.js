import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";

const TOKEN_KEY = "smart-rental-token";
const USER_KEY = "smart-rental-user";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      try {
        const savedToken = await AsyncStorage.getItem(TOKEN_KEY);
        const savedUser = await AsyncStorage.getItem(USER_KEY);

        if (savedToken) {
          setToken(savedToken);
          if (savedUser) {
            setUser(JSON.parse(savedUser));
          }

          try {
            const me = await api.get("/auth/me", savedToken);
            setUser(me.user);
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(me.user));
          } catch (error) {
            await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
            setToken(null);
            setUser(null);
          }
        }
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, []);

  const signup = async (payload) => {
    const formData = new FormData();
    formData.append("name", payload.name);
    formData.append("studentId", payload.studentId);
    formData.append("department", payload.department);
    formData.append("password", payload.password);
    formData.append("studentCardImage", payload.studentCardImage);

    return api.postForm("/auth/signup", formData);
  };

  const login = async (studentId, password) => {
    const response = await api.post("/auth/login", { studentId, password });
    setToken(response.token);
    setUser(response.user);
    await AsyncStorage.setItem(TOKEN_KEY, response.token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.user));
    return response;
  };

  const logout = async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      login,
      signup,
      logout,
      isAdmin: user?.role === "ADMIN",
    }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

