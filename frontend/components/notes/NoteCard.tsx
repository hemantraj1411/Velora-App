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

  const getColorClass = () => {
    const colors = [
      "border-purple-500/30 bg-purple-500/5",
      "border-blue-500/30 bg-blue-500/5",
      "border-green-500/30 bg-green-500/5",
      "border-yellow-500/30 bg-yellow-500/5",
      "border-pink-500/30 bg-pink-500/5",
      "border-indigo-500/30 bg-indigo-500/5",
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
      className={`relative rounded-xl md:rounded-2xl p-3 md:p-5 border ${getColorClass()} backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 active:scale-[0.98] md:hover:scale-[1.02] group min-h-[120px] md:min-h-[140px]`}
    >
      {/* Pin Badge - Mobile Optimized */}
      {note.isPinned && (
        <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-[8px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-0.5 rounded-full shadow-lg z-10">
          📌 Pinned
        </div>
      )}

      {isEditing ? (
        <div className="space-y-2 md:space-y-3">
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            placeholder="Note title..."
            className="w-full px-3 py-1.5 md:py-2 rounded-lg bg-[#0f1a2a] border border-[#2a3a4a] text-white text-sm md:text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
            autoFocus
          />
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            rows={3}
            placeholder="Write your note..."
            className="w-full px-3 py-1.5 md:py-2 rounded-lg bg-[#0f1a2a] border border-[#2a3a4a] text-white text-sm md:text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 md:px-4 py-1 md:py-1.5 rounded-lg bg-gray-700 text-white text-xs md:text-sm hover:bg-gray-600 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 md:px-4 py-1 md:py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-purple-500 text-white text-xs md:text-sm hover:shadow-lg transition flex items-center gap-1"
            >
              <CheckIcon className="h-3 w-3 md:h-4 md:w-4" />
              Save
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-1 md:gap-2 mb-1 md:mb-2">
            <h3 className="font-semibold text-white text-sm md:text-lg line-clamp-1 flex-1">
              {note.title || "Untitled"}
            </h3>
          </div>
          
          <p className="text-xs md:text-sm text-gray-300 line-clamp-2 md:line-clamp-3 leading-relaxed">
            {note.content || "No content"}
          </p>
          
          <div className="mt-2 md:mt-4 flex items-center flex-wrap gap-1 md:gap-2 text-[10px] md:text-xs">
            <span className="flex items-center gap-0.5 md:gap-1 text-gray-400">
              <CalendarIcon className="h-2.5 w-2.5 md:h-3.5 md:w-3.5" />
              {new Date(note.updatedAt).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric'
              })}
            </span>
            
            {note.tags && note.tags.length > 0 && (
              <div className="flex flex-wrap gap-0.5 md:gap-1">
                {note.tags.slice(0, 2).map(tag => (
                  <span 
                    key={tag} 
                    className="px-1 md:px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[8px] md:text-xs"
                  >
                    #{tag}
                  </span>
                ))}
                {note.tags.length > 2 && (
                  <span className="px-1 md:px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400 text-[8px] md:text-xs">
                    +{note.tags.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ✅ Action Buttons - Always Visible on Mobile */}
          <div className="flex items-center justify-end gap-1 mt-3 md:mt-4 pt-2 md:pt-3 border-t border-white/5">
            <button
              onClick={handleTogglePin}
              className={`p-2 md:p-1.5 rounded-lg active:bg-white/10 transition ${
                note.isPinned ? "text-yellow-400 bg-yellow-500/10" : "text-gray-400 hover:text-white"
              } min-h-[36px] min-w-[36px] md:min-h-0 md:min-w-0 flex items-center justify-center`}
              title={note.isPinned ? "Unpin" : "Pin"}
            >
              <span className="text-base md:text-sm">{note.isPinned ? "📌" : "📍"}</span>
            </button>
            <button
              onClick={handleToggleArchive}
              className="p-2 md:p-1.5 rounded-lg active:bg-white/10 transition text-gray-400 hover:text-white min-h-[36px] min-w-[36px] md:min-h-0 md:min-w-0 flex items-center justify-center"
              title="Archive"
            >
              <ArchiveBoxIcon className="h-4 w-4 md:h-4 md:w-4" />
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 md:p-1.5 rounded-lg active:bg-white/10 transition text-gray-400 hover:text-white min-h-[36px] min-w-[36px] md:min-h-0 md:min-w-0 flex items-center justify-center"
              title="Edit"
            >
              <PencilIcon className="h-4 w-4 md:h-4 md:w-4" />
            </button>
            <button
              onClick={() => onDelete(note._id)}
              className="p-2 md:p-1.5 rounded-lg active:bg-red-500/20 transition text-gray-400 hover:text-red-400 min-h-[36px] min-w-[36px] md:min-h-0 md:min-w-0 flex items-center justify-center"
              title="Delete"
            >
              <TrashIcon className="h-4 w-4 md:h-4 md:w-4" />
            </button>
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