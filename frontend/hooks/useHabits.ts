"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { Habit } from "@/types";
import toast from "react-hot-toast";

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHabits = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/habits");
      setHabits(response.data.habits);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch habits");
      toast.error("Failed to load habits");
    } finally {
      setLoading(false);
    }
  }, []);

  const createHabit = useCallback(async (habitData: Partial<Habit>) => {
    try {
      const response = await api.post("/habits", habitData);
      setHabits(prev => [response.data.habit, ...prev]);
      toast.success("Habit created successfully");
      return response.data.habit;
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to create habit");
      throw err;
    }
  }, []);

  const updateHabit = useCallback(async (id: string, updates: Partial<Habit>) => {
    try {
      const response = await api.put(`/habits/${id}`, updates);
      setHabits(prev => prev.map(h => h._id === id ? response.data.habit : h));
      toast.success("Habit updated successfully");
      return response.data.habit;
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update habit");
      throw err;
    }
  }, []);

  const deleteHabit = useCallback(async (id: string) => {
    try {
      await api.delete(`/habits/${id}`);
      setHabits(prev => prev.filter(h => h._id !== id));
      toast.success("Habit deleted successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete habit");
      throw err;
    }
  }, []);

  const trackHabit = useCallback(async (id: string, date: Date, completed: boolean, note?: string) => {
    try {
      const response = await api.post(`/habits/${id}/track`, { date, completed, note });
      setHabits(prev => prev.map(h => h._id === id ? response.data.habit : h));
      toast.success(completed ? "Habit tracked! 🔥" : "Habit untracked");
      return response.data.habit;
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to track habit");
      throw err;
    }
  }, []);

  const getHabitStats = useCallback(async () => {
    try {
      const response = await api.get("/habits/stats");
      return response.data;
    } catch (err: any) {
      toast.error("Failed to fetch habit stats");
      throw err;
    }
  }, []);

  return {
    habits,
    loading,
    error,
    fetchHabits,
    createHabit,
    updateHabit,
    deleteHabit,
    trackHabit,
    getHabitStats,
  };
}