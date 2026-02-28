import { createContext, useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../../config";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Axios should send cookies with every request
  axios.defaults.withCredentials = true;

  useEffect(() => {
    // Check if user already logged in (session exists)
    const checkSession = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/auth/users/session`, { withCredentials: true });
        if (res.data.user) setUser(res.data.user);
      } catch (err) {
        console.log("No active session");
      }
    };
    checkSession();
  }, []);

  const login = async (email, password) => {
    const res = await axios.post(`${BASE_URL}/auth/users/login`, { email, password }, { withCredentials: true });
    setUser(res.data.user);
  };

  const logout = async () => {
    await axios.post(`${BASE_URL}/auth/users/logout`, {}, { withCredentials: true });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
