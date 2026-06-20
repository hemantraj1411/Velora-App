"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  TrashIcon, 
  PencilIcon, 
  ArchiveBoxIcon,
  XMarkIcon,
  CheckIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import { Note } from "@/types";

export default function NoteCard({ note, onUpdate, onDelete }: NoteCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(note.content);
  const [editedTitle, setEditedTitle] = useState(note.title);
  const [showTags, setShowTags] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const handleSave = async () => {
    await onUpdate(note._id, { 
      title: editedTitle || "Untitled", 
      content: editedContent 
    });
    setIsEditing(false);
  };

  const handleTogglePin = async () => {
    await onUpdate(note._id, { isPinned: !note.isPinned });
  };

  const handleToggleArchive = async () => {
    await onUpdate(note._id, { isArchived: !note.isArchived });
  };

  const handleAddTag = async () => {
    if (tagInput.trim()) {
      const currentTags = note.tags || [];
      await onUpdate(note._id, { tags: [...currentTags, tagInput.trim()] });
      setTagInput("");
      setShowTags(false);
    }
  };

  const handleRemoveTag = async (tag: string) => {
    const currentTags = note.tags || [];
    await onUpdate(note._id, { tags: currentTags.filter(t => t !== tag) });
  };

  const getColorClass = () => {
    const colors = [
      "border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10",
      "border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10",
      "border-green-500/30 bg-green-500/5 hover:bg-green-500/10",
      "border-yellow-500/30 bg-yellow-500/5 hover:bg-yellow-500/10",
      "border-pink-500/30 bg-pink-500/5 hover:bg-pink-500/10",
      "border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10",
    ];
    const index = note._id?.length ? note._id.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={`relative rounded-2xl p-5 border ${getColorClass()} backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 hover:scale-[1.02] group`}
    >
      {/* Pin Badge */}
      {note.isPinned && (
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs px-2 py-0.5 rounded-full shadow-lg">
          📌 Pinned
        </div>
      )}

      {isEditing ? (
        <div className="space-y-3">
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            placeholder="Note title..."
            className="w-full px-3 py-2 rounded-lg bg-[#0f1a2a] border border-[#2a3a4a] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
            autoFocus
          />
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            rows={4}
            placeholder="Write your note..."
            className="w-full px-3 py-2 rounded-lg bg-[#0f1a2a] border border-[#2a3a4a] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-1.5 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:shadow-lg transition flex items-center gap-1"
            >
              <CheckIcon className="h-4 w-4" />
              Save
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-white text-lg line-clamp-1 flex-1">
              {note.title || "Untitled"}
            </h3>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {/* Pin button with emoji */}
              <button
                onClick={handleTogglePin}
                className={`p-1.5 rounded-lg hover:bg-white/10 transition ${
                  note.isPinned ? "text-yellow-400" : "text-gray-400 hover:text-white"
                }`}
                title={note.isPinned ? "Unpin" : "Pin"}
              >
                <span className="text-base">{note.isPinned ? "📌" : "📍"}</span>
              </button>
              <button
                onClick={handleToggleArchive}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
                title="Archive"
              >
                <ArchiveBoxIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
                title="Edit"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(note._id)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition"
                title="Delete"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <p className="text-sm text-gray-300 line-clamp-3 leading-relaxed">
            {note.content || "No content"}
          </p>
          
          <div className="mt-4 flex items-center flex-wrap gap-2 text-xs">
            <span className="flex items-center gap-1 text-gray-400">
              <CalendarIcon className="h-3.5 w-3.5" />
              {new Date(note.updatedAt).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
            
            {note.tags && note.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {note.tags.slice(0, 3).map(tag => (
                  <span 
                    key={tag} 
                    className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs"
                  >
                    #{tag}
                  </span>
                ))}
                {note.tags.length > 3 && (
                  <span className="px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400 text-xs">
                    +{note.tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}

interface NoteCardProps {
  note: Note;
  onUpdate: (id: string, updates: Partial<Note>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}