"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PlusIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import NoteCard from "./NoteCard";
import { api } from "@/lib/api";
import { Note } from "@/types";
import toast from "react-hot-toast";

export default function NoteManager() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("All");
  const [folders, setFolders] = useState<string[]>(["All"]);

  useEffect(() => {
    fetchNotes();
    fetchFolders();
  }, [search, selectedFolder]);

  const fetchNotes = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (selectedFolder !== "All") params.append("folder", selectedFolder);
      
      const response = await api.get(`/notes?${params.toString()}`);
      setNotes(response.data.notes);
    } catch (error) {
      toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  const fetchFolders = async () => {
    try {
      const response = await api.get("/notes/folders");
      setFolders(["All", ...response.data.folders]);
    } catch (error) {
      console.error("Failed to fetch folders");
    }
  };

  const handleCreateNote = async () => {
    try {
      const response = await api.post("/notes", {
        title: "Untitled Note",
        content: "",
        type: "text",
      });
      setNotes([response.data.note, ...notes]);
      toast.success("Note created");
    } catch (error) {
      toast.error("Failed to create note");
    }
  };

  const handleUpdateNote = async (id: string, updates: Partial<Note>) => {
    try {
      const response = await api.put(`/notes/${id}`, updates);
      setNotes(notes.map(n => n._id === id ? response.data.note : n));
      toast.success("Note updated");
    } catch (error) {
      toast.error("Failed to update note");
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (confirm("Delete this note?")) {
      try {
        await api.delete(`/notes/${id}`);
        setNotes(notes.filter(n => n._id !== id));
        toast.success("Note deleted");
      } catch (error) {
        toast.error("Failed to delete note");
      }
    }
  };

  const pinnedNotes = notes.filter(n => n.isPinned);
  const otherNotes = notes.filter(n => !n.isPinned);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold gradient-text">Notes</h2>
        <button
          onClick={handleCreateNote}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold hover:shadow-lg transition flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          New Note
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        
        <select
          value={selectedFolder}
          onChange={(e) => setSelectedFolder(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {folders.map(folder => (
            <option key={folder}>{folder}</option>
          ))}
        </select>
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass rounded-xl p-4 h-40 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400">No notes yet. Create your first note!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pinnedNotes.length > 0 && (
            <>
              <h3 className="text-lg font-semibold">📌 Pinned</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pinnedNotes.map((note) => (
                  <NoteCard
                    key={note._id}
                    note={note}
                    onUpdate={handleUpdateNote}
                    onDelete={handleDeleteNote}
                  />
                ))}
              </div>
            </>
          )}
          
          {otherNotes.length > 0 && (
            <>
              <h3 className="text-lg font-semibold">📄 All Notes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {otherNotes.map((note) => (
                  <NoteCard
                    key={note._id}
                    note={note}
                    onUpdate={handleUpdateNote}
                    onDelete={handleDeleteNote}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}