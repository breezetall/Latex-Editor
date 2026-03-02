import React, { createContext, useContext, useState, useEffect } from 'react';
import { request, handleLogout as apiLogout } from '../api/client';

interface AuthContextType {
  displayName: string;
  fetchUserProfile: () => Promise<void>;
  updateProfile: (newName: string) => Promise<boolean>;
  register: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [displayName, setDisplayName] = useState<string>("");

  const fetchUserProfile = async () => {
    try {
      const response = await request('/api/auth/profile');
      if (response.ok) {
        const data = await response.json();
        setDisplayName(data.displayName || data.email);
      }
    } catch (err) {
      console.error("Profile load failed", err);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/login", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        return { success: false, message: "Invalid email or password" };
      }

      const result = await response.json();
      
      // Save jwt tokens
      localStorage.setItem("token", result.accessToken);
      localStorage.setItem("refreshToken", result.refreshToken);

      await fetchUserProfile();

      return { success: true };
    } catch (err) {
      return { success: false, message: "Server connection failed" };
    }
  };

 const register = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Email: email, Password: password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        const firstError = errorData[0].description;
        const message = firstError ? firstError : "Registration failed";
        return { success: false, message };
      }

      return { success: true };
    } catch (err) {
      return { success: false, message: "Connection error" };
    }
  };

  const updateProfile = async (newName: string) => {
    try {
      const response = await request('/api/auth/update', {
        method: 'POST',
        body: JSON.stringify({ displayName: newName })
      });
      if (response.ok) {
        setDisplayName(newName);
        return true;
      }
    } catch (err) {
      return false;
    }
    return false;
  };

  const logout = () => {
    apiLogout(); 
  };

  return (
    <AuthContext.Provider value={{ displayName, fetchUserProfile, updateProfile, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};