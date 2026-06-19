"use client";
import toast from "react-hot-toast"; // ✅ ADD THIS IMPORT


import { api, setAuthToken, removeAuthToken } from "./api";

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'premium' | 'admin';
  avatar?: string;
  lastLoginAt: string;
  googleId?: string; // Added for Google OAuth users
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
    emailReminders: boolean;
    defaultView: string;
    language: string;
    timezone: string;
  };
  stats: {
    totalTasks: number;
    completedTasks: number;
    currentStreak: number;
    longestStreak: number;
    totalFocusTime: number;
    xp: number;
    level: number;
  };
  badges: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
}

interface RegisterResponse {
  token: string;
  refreshToken: string;
  user: User;
}

interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
}

class AuthService {
  private static instance: AuthService;
  private tokenKey = "velora_token";
  private refreshTokenKey = "velora_refresh_token";
  private userKey = "velora_user";

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Get stored token
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(this.tokenKey);
  }

  // Get stored refresh token
  getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(this.refreshTokenKey);
  }

  // Get stored user
  getUser(): User | null {
    if (typeof window === "undefined") return null;
    const userStr = localStorage.getItem(this.userKey);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  // Set auth data
  setAuthData(token: string, refreshToken: string, user: User): void {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.refreshTokenKey, refreshToken);
    localStorage.setItem(this.userKey, JSON.stringify(user));
    setAuthToken(token);
  }

  // Clear auth data
  clearAuthData(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
    removeAuthToken();
  }

  // ========== ✅ GOOGLE OAUTH METHODS ==========

  // ✅ Initiate Google Login with proper scope
  loginWithGoogle(): void {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      console.error('❌ NEXT_PUBLIC_API_URL is not set');
      toast.error('Login service unavailable. Please try again later.');
      return;
    }
    
    const scope = 'email profile';
    const redirectUri = `${window.location.origin}/auth/callback`;
    
    console.log('🔑 Initiating Google login with scope:', scope);
    console.log('📡 Redirect URI:', redirectUri);
    console.log('🌐 API URL:', apiUrl);
    
    // Redirect to backend's Google auth endpoint with scope parameter
    window.location.href = `${apiUrl}/auth/google?scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  }

  // ✅ Handle Google OAuth Callback - Updated to handle token from URL
  async handleGoogleCallback(tokenOrCode: string): Promise<User> {
    try {
      console.log('📥 Handling Google callback with parameter:', tokenOrCode.substring(0, 15) + '...');
      
      // ✅ FIXED: Handle both token (from URL hash) and code (from backend)
      if (tokenOrCode.includes('.')) {
        // This is a JWT token - save it directly
        console.log('✅ JWT token detected, saving directly');
        const user = this.getUser();
        if (user) {
          this.setAuthData(tokenOrCode, this.getRefreshToken() || '', user);
          return user;
        } else {
          // If no user exists, fetch profile
          const profile = await this.getProfile();
          return profile;
        }
      }
      
      // This is a code - exchange it with backend
      console.log('🔄 Exchanging code for token...');
      const response = await api.post<LoginResponse>("/auth/google/callback", { code: tokenOrCode });
      const { token, refreshToken, user } = response.data;
      
      console.log('✅ Google authentication successful for:', user.email);
      this.setAuthData(token, refreshToken, user);
      
      return user;
    } catch (error: any) {
      console.error('❌ Google callback error:', error);
      throw new Error(error.response?.data?.error || "Google authentication failed");
    }
  }

  // ========== EMAIL/PASSWORD AUTH ==========

  // Login user with email/password
  async login(email: string, password: string): Promise<User> {
    try {
      const response = await api.post<LoginResponse>("/auth/login", { email, password });
      const { token, refreshToken, user } = response.data;
      this.setAuthData(token, refreshToken, user);
      return user;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || "Login failed");
    }
  }

  // Register user with email/password
  async register(name: string, email: string, password: string): Promise<User> {
    try {
      const response = await api.post<RegisterResponse>("/auth/register", { name, email, password });
      const { token, refreshToken, user } = response.data;
      this.setAuthData(token, refreshToken, user);
      return user;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || "Registration failed");
    }
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      this.clearAuthData();
    }
  }

  // Refresh token
  async refreshToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await api.post<RefreshTokenResponse>("/auth/refresh-token", { refreshToken });
      const { token, refreshToken: newRefreshToken } = response.data;
      
      const user = this.getUser();
      if (user) {
        this.setAuthData(token, newRefreshToken, user);
      }
      return true;
    } catch (error) {
      this.clearAuthData();
      return false;
    }
  }

  // Get current user profile
  async getProfile(): Promise<User> {
    try {
      const response = await api.get<User>("/auth/profile");
      const user = response.data;
      if (user) {
        localStorage.setItem(this.userKey, JSON.stringify(user));
      }
      return user;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || "Failed to get profile");
    }
  }

  // Update user profile
  async updateProfile(updates: Partial<User>): Promise<User> {
    try {
      const response = await api.put<User>("/auth/profile", updates);
      const user = response.data;
      localStorage.setItem(this.userKey, JSON.stringify(user));
      return user;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || "Failed to update profile");
    }
  }

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await api.put("/auth/change-password", { currentPassword, newPassword });
    } catch (error: any) {
      throw new Error(error.response?.data?.error || "Failed to change password");
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getUser();
  }

  // Check if user is premium
  isPremium(): boolean {
    const user = this.getUser();
    return user?.role === "premium" || user?.role === "admin";
  }

  // Check if user is admin
  isAdmin(): boolean {
    const user = this.getUser();
    return user?.role === "admin";
  }

  // Get user stats
  getUserStats() {
    const user = this.getUser();
    return user?.stats || {
      totalTasks: 0,
      completedTasks: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalFocusTime: 0,
      xp: 0,
      level: 1,
    };
  }

  // Get level progress
  getLevelProgress() {
    const stats = this.getUserStats();
    const currentLevelXP = (stats.level - 1) * 100;
    const nextLevelXP = stats.level * 100;
    const xpInCurrentLevel = stats.xp - currentLevelXP;
    const percentage = (xpInCurrentLevel / 100) * 100;
    
    return {
      currentXP: stats.xp,
      nextLevelXP,
      percentage: Math.min(Math.max(percentage, 0), 100),
      currentLevel: stats.level,
    };
  }

  // Update user streak (call when user completes a task)
  async updateStreak(): Promise<void> {
    const user = this.getUser();
    if (!user) return;
    
    const today = new Date().toDateString();
    const lastLogin = new Date(user.lastLoginAt).toDateString();
    
    if (lastLogin !== today) {
      // Update streak in backend
      await this.getProfile();
    }
  }
}

export const authService = AuthService.getInstance();

// Utility hooks for components
export function useAuthToken() {
  return authService.getToken();
}

export function useUser() {
  return authService.getUser();
}

export function useIsAuthenticated() {
  return authService.isAuthenticated();
}

export function useIsPremium() {
  return authService.isPremium();
}