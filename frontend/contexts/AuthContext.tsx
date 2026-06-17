"use client";

import React, { createContext, useState, useEffect, ReactNode } from "react";
import { api, setAuthToken, removeAuthToken } from "@/lib/api";
import { User, AuthResponse } from "@/types";
import toast from "react-hot-toast";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem("velora_token");
    if (token) {
      setAuthToken(token);
      try {
        const response = await api.get<{ user: User }>("/auth/profile");
        setUser(response.data.user);
      } catch (error) {
        console.error("Auth check failed:", error);
        localStorage.removeItem("velora_token");
        localStorage.removeItem("velora_refresh_token");
        localStorage.removeItem("velora_user");
        removeAuthToken();
      }
    }
    setLoading(false);
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post<AuthResponse>("/auth/login", { email, password });
      const { token, refreshToken, user } = response.data;
      
      localStorage.setItem("velora_token", token);
      localStorage.setItem("velora_refresh_token", refreshToken);
      localStorage.setItem("velora_user", JSON.stringify(user));
      setAuthToken(token);
      setUser(user);
      toast.success("Login successful!");
    } catch (error: any) {
      console.error("Login error:", error);
      const errorMessage = error.response?.data?.error || "Login failed. Please try again.";
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await api.post<AuthResponse>("/auth/register", { name, email, password });
      const { token, refreshToken, user } = response.data;
      
      localStorage.setItem("velora_token", token);
      localStorage.setItem("velora_refresh_token", refreshToken);
      localStorage.setItem("velora_user", JSON.stringify(user));
      setAuthToken(token);
      setUser(user);
      toast.success("Registration successful!");
    } catch (error: any) {
      console.error("Registration error:", error);
      const errorMessage = error.response?.data?.error || "Registration failed. Please try again.";
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    localStorage.removeItem("velora_token");
    localStorage.removeItem("velora_refresh_token");
    localStorage.removeItem("velora_user");
    removeAuthToken();
    setUser(null);
    toast.success("Logged out successfully");
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem("velora_user", JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };