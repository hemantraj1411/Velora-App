"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  TrashIcon, 
  PencilIcon, 
  ArchiveBoxIcon,
  XMarkIcon,
  CheckIcon,
  PaperClipIcon
} from "@heroicons/react/24/outline";
import { Note } from "@/types";

export default function NoteCard({ note, onUpdate, onDelete }: NoteCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(note.content);
  const [editedTitle, setEditedTitle] = useState(note.title);

  const handleSave = async () => {
    await onUpdate(note._id, { title: editedTitle, content: editedContent });
    setIsEditing(false);
  };

  const handleTogglePin = async () => {
    await onUpdate(note._id, { isPinned: !note.isPinned });
  };

  const handleToggleArchive = async () => {
    await onUpdate(note._id, { isArchived: !note.isArchived });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass rounded-xl p-4 hover:shadow-lg transition group"
    >
      {isEditing ? (
        <div className="space-y-3">
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold"
            autoFocus
          />
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition"
            >
              <CheckIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold flex-1">{note.title}</h3>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
              {/* Pin button - using emoji or custom styling instead of PinIcon */}
              <button
                onClick={handleTogglePin}
                className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition ${
                  note.isPinned ? "text-yellow-500" : ""
                }`}
              >
                <span className="text-sm">{note.isPinned ? "📌" : "📍"}</span>
              </button>
              <button
                onClick={handleToggleArchive}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <ArchiveBoxIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(note._id)}
                className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 transition"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
            {note.content || "No content"}
          </p>
          
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
            <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
            {note.tags && note.tags.length > 0 && (
              <div className="flex gap-1">
                {note.tags.slice(0, 2).map(tag => (
                  <span key={tag} className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800">
                    #{tag}
                  </span>
                ))}
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