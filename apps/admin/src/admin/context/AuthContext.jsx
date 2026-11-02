import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "../lib/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() =>
    sessionStorage.getItem("wings_admin_token")
  );

  const [user, setUser] = useState(() => {
    try {
      const stored = sessionStorage.getItem("wings_admin_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [loadingUser, setLoadingUser] = useState(false);

  const fetchProfile = useCallback(async (authToken) => {
    if (!authToken) return;
    try {
      setLoadingUser(true);
      const profile = await api.getMe();
      if (profile && profile.email) {
        setUser(profile);
        sessionStorage.setItem("wings_admin_user", JSON.stringify(profile));
      }
    } catch (_err) {
      // If error fetching profile, keep stored user or default
    } finally {
      setLoadingUser(false);
    }
  }, []);

  useEffect(() => {
    function handleSessionExpired() {
      sessionStorage.removeItem("wings_admin_token");
      sessionStorage.removeItem("wings_admin_user");
      setToken(null);
      setUser(null);
    }

    window.addEventListener("wings-admin-session-expired", handleSessionExpired);
    return () =>
      window.removeEventListener("wings-admin-session-expired", handleSessionExpired);
  }, []);

  useEffect(() => {
    if (token) {
      fetchProfile(token);
    } else {
      setUser(null);
    }
  }, [token, fetchProfile]);

  const login = (newToken, userData = null) => {
    sessionStorage.setItem("wings_admin_token", newToken);
    setToken(newToken);
    if (userData) {
      sessionStorage.setItem("wings_admin_user", JSON.stringify(userData));
      setUser(userData);
    }
    fetchProfile(newToken);
  };

  const logout = () => {
    sessionStorage.removeItem("wings_admin_token");
    sessionStorage.removeItem("wings_admin_user");
    setToken(null);
    setUser(null);
  };

  // Helper to determine if user can access a specific section
  const canAccess = useCallback(
    (sectionKey) => {
      // If no user loaded yet, default to allow if token exists, or deny
      if (!user) return true;

      // Super Admin or users with ["all"] have access to every module
      if (user.isSuperAdmin || (Array.isArray(user.sections) && user.sections.includes("all"))) {
        return true;
      }

      if (!Array.isArray(user.sections)) {
        return false;
      }

      // Check section key
      return user.sections.includes(sectionKey);
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loadingUser,
        login,
        logout,
        canAccess,
        refreshProfile: () => fetchProfile(token),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
