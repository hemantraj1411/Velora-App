"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  XMarkIcon,
  SparklesIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import NoteCard from "./NoteCard";
import { api } from "@/lib/api";
import { Note } from "@/types";
import toast from "react-hot-toast";

export default function NoteManager() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, [search, selectedFilter]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (selectedFilter === "Pinned") params.append("pinned", "true");
      if (selectedFilter === "Archived") params.append("archived", "true");
      
      const response = await api.get(`/notes?${params.toString()}`);
      setNotes(response.data.notes || []);
    } catch (error) {
      console.error("Failed to load notes:", error);
      toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async () => {
    try {
      const response = await api.post("/notes", {
        title: "",
        content: "",
        type: "text",
      });
      setNotes([response.data.note, ...notes]);
      toast.success("✨ New note created!");
    } catch (error) {
      toast.error("Failed to create note");
    }
  };

  const handleUpdateNote = async (id: string, updates: Partial<Note>) => {
    try {
      const response = await api.put(`/notes/${id}`, updates);
      setNotes(notes.map(n => n._id === id ? response.data.note : n));
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
  const otherNotes = notes.filter(n => !n.isPinned && !n.isArchived);
  const archivedNotes = notes.filter(n => n.isArchived);

  const filters = [
    { label: "All", icon: "📚" },
    { label: "Pinned", icon: "📌" },
    { label: "Archived", icon: "📦" },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header - Mobile Friendly */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white flex items-center gap-2">
            <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
              📝 Notes
            </span>
            <span className="text-xs md:text-sm text-gray-400 font-normal">
              ({notes.length})
            </span>
          </h2>
          <p className="text-xs md:text-sm text-gray-400">Capture your thoughts instantly</p>
        </div>
        <button
          onClick={handleCreateNote}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 flex items-center justify-center gap-2 text-sm md:text-base"
        >
          <PlusIcon className="h-4 w-4 md:h-5 md:w-5" />
          New Note
        </button>
      </div>

      {/* Search and Filters - Mobile Friendly */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 md:pl-10 pr-8 md:pr-10 py-2.5 rounded-xl bg-[#1a2234] border border-[#2a3a4a] text-white text-sm md:text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
        
        {/* Mobile Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="md:hidden px-4 py-2.5 rounded-xl bg-[#1a2234] border border-[#2a3a4a] text-white flex items-center justify-center gap-2 text-sm"
        >
          <FunnelIcon className="h-4 w-4" />
          Filters
        </button>

        {/* Desktop Filters */}
        <div className="hidden md:flex gap-2">
          {filters.map((filter) => (
            <button
              key={filter.label}
              onClick={() => setSelectedFilter(filter.label)}
              className={`px-4 py-2 rounded-xl transition-all duration-200 flex items-center gap-1.5 text-sm ${
                selectedFilter === filter.label
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-500/25"
                  : "bg-[#1a2234] text-gray-400 hover:text-white hover:bg-[#2a3a4a]"
              }`}
            >
              <span>{filter.icon}</span>
              <span>{filter.label}</span>
            </button>
          ))}
        </div>

        {/* Mobile Filters Dropdown */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden flex gap-2 p-2 bg-[#1a2234] rounded-xl border border-[#2a3a4a] flex-wrap"
          >
            {filters.map((filter) => (
              <button
                key={filter.label}
                onClick={() => {
                  setSelectedFilter(filter.label);
                  setShowFilters(false);
                }}
                className={`flex-1 px-3 py-2 rounded-lg transition-all duration-200 flex items-center justify-center gap-1 text-sm ${
                  selectedFilter === filter.label
                    ? "bg-purple-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-[#2a3a4a]"
                }`}
              >
                <span>{filter.icon}</span>
                <span>{filter.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </div>

      {/* Quick Create Bar - Mobile Friendly */}
      <div className="relative">
        <div 
          className="bg-[#1a2234] rounded-xl p-3 md:p-4 border border-[#2a3a4a] border-dashed hover:border-purple-500/50 transition cursor-pointer" 
          onClick={handleCreateNote}
        >
          <div className="flex items-center gap-2 md:gap-3 text-gray-400 hover:text-white transition">
            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
              <SparklesIcon className="h-3 w-3 md:h-4 md:w-4 text-purple-400" />
            </div>
            <span className="text-xs md:text-sm">Quick note... Tap to create</span>
          </div>
        </div>
      </div>

      {/* Notes Grid - Mobile First */}
      <AnimatePresence mode="wait">
        {loading ? (
          <div className="grid grid-cols-1 gap-3 md:gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-[#1a2234] rounded-xl p-4 h-32 md:h-40 animate-pulse border border-[#2a3a4a]">
                <div className="h-3 md:h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
                <div className="h-2 md:h-3 bg-gray-700 rounded w-3/4 mb-1.5"></div>
                <div className="h-2 md:h-3 bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : notes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-[#1a2234] rounded-2xl p-8 md:p-16 text-center border border-[#2a3a4a]"
          >
            <div className="text-4xl md:text-6xl mb-3 md:mb-4">📝</div>
            <h3 className="text-base md:text-xl font-semibold text-white mb-1 md:mb-2">No notes yet</h3>
            <p className="text-sm md:text-base text-gray-400 mb-3 md:mb-4">Start capturing your ideas</p>
            <button
              onClick={handleCreateNote}
              className="px-4 md:px-6 py-2 md:py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm md:text-base hover:shadow-lg transition"
            >
              Create Your First Note
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4 md:space-y-6"
          >
            {/* Pinned Notes */}
            {pinnedNotes.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2 md:mb-3">
                  <span className="text-base md:text-lg">📌</span>
                  <h3 className="text-xs md:text-sm font-medium text-gray-400 uppercase tracking-wider">Pinned</h3>
                  <span className="text-[10px] md:text-xs text-gray-500">({pinnedNotes.length})</span>
                </div>
                <div className="grid grid-cols-1 gap-3 md:gap-4">
                  {pinnedNotes.map((note) => (
                    <NoteCard
                      key={note._id}
                      note={note}
                      onUpdate={handleUpdateNote}
                      onDelete={handleDeleteNote}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Other Notes */}
            {otherNotes.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2 md:mb-3">
                  <span className="text-base md:text-lg">📄</span>
                  <h3 className="text-xs md:text-sm font-medium text-gray-400 uppercase tracking-wider">All Notes</h3>
                  <span className="text-[10px] md:text-xs text-gray-500">({otherNotes.length})</span>
                </div>
                <div className="grid grid-cols-1 gap-3 md:gap-4">
                  {otherNotes.map((note) => (
                    <NoteCard
                      key={note._id}
                      note={note}
                      onUpdate={handleUpdateNote}
                      onDelete={handleDeleteNote}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Archived Notes */}
            {archivedNotes.length > 0 && selectedFilter === "All" && (
              <div>
                <div className="flex items-center gap-2 mb-2 md:mb-3">
                  <span className="text-base md:text-lg">📦</span>
                  <h3 className="text-xs md:text-sm font-medium text-gray-400 uppercase tracking-wider">Archived</h3>
                  <span className="text-[10px] md:text-xs text-gray-500">({archivedNotes.length})</span>
                </div>
                <div className="grid grid-cols-1 gap-3 md:gap-4 opacity-60">
                  {archivedNotes.map((note) => (
                    <NoteCard
                      key={note._id}
                      note={note}
                      onUpdate={handleUpdateNote}
                      onDelete={handleDeleteNote}
                    />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}