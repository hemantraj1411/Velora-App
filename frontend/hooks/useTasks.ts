"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { Task } from "@/types";
import toast from "react-hot-toast";

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async (filters?: any) => {
    try {
      setLoading(true);
      const params = new URLSearchParams(filters);
      const response = await api.get(`/tasks?${params.toString()}`);
      setTasks(response.data.tasks);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch tasks");
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  const createTask = useCallback(async (taskData: Partial<Task>) => {
    try {
      const response = await api.post("/tasks", taskData);
      setTasks(prev => [response.data.task, ...prev]);
      toast.success("Task created successfully");
      return response.data.task;
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to create task");
      throw err;
    }
  }, []);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    try {
      const response = await api.put(`/tasks/${id}`, updates);
      setTasks(prev => prev.map(t => t._id === id ? response.data.task : t));
      toast.success("Task updated successfully");
      return response.data.task;
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update task");
      throw err;
    }
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    try {
      await api.delete(`/tasks/${id}`);
      setTasks(prev => prev.filter(t => t._id !== id));
      toast.success("Task deleted successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete task");
      throw err;
    }
  }, []);

  const getTaskStats = useCallback(async () => {
    try {
      const response = await api.get("/tasks/stats");
      return response.data;
    } catch (err: any) {
      toast.error("Failed to fetch task stats");
      throw err;
    }
  }, []);

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    getTaskStats,
  };
}