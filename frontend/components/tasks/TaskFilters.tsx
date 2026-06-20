"use client";

import { MagnifyingGlassIcon, XMarkIcon, FunnelIcon } from "@heroicons/react/24/outline";

interface TaskFiltersProps {
  filters: {
    status: string;
    priority: string;
    category: string;
    search: string;
  };
  setFilters: (filters: any) => void;
}

const categories = ["All", "Work", "Study", "Personal", "Health", "Finance", "Shopping", "Family"];

export default function TaskFilters({ filters, setFilters }: TaskFiltersProps) {
  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    setFilters({
      status: "",
      priority: "",
      category: "",
      search: "",
    });
  };

  const hasActiveFilters = filters.status || filters.priority || filters.category || filters.search;

  return (
    <div className="bg-[#1a2234]/50 backdrop-blur-xl rounded-2xl p-4 md:p-5 space-y-4 border border-[#2a3a4a]">
      {/* Search Bar */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="🔍 Search tasks..."
          value={filters.search}
          onChange={(e) => handleFilterChange("search", e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-[#2a3a4a] bg-[#0f1a2a] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
        />
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange("status", e.target.value)}
          className="px-4 py-2 rounded-xl border border-[#2a3a4a] bg-[#0f1a2a] text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
        >
          <option value="">📋 All Status</option>
          <option value="pending">⏳ Pending</option>
          <option value="in-progress">🔄 In Progress</option>
          <option value="completed">✅ Completed</option>
          <option value="overdue">⚠️ Overdue</option>
        </select>

        <select
          value={filters.priority}
          onChange={(e) => handleFilterChange("priority", e.target.value)}
          className="px-4 py-2 rounded-xl border border-[#2a3a4a] bg-[#0f1a2a] text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
        >
          <option value="">🎯 All Priorities</option>
          <option value="high">🔴 High</option>
          <option value="medium">🟠 Medium</option>
          <option value="low">🟢 Low</option>
        </select>

        <select
          value={filters.category}
          onChange={(e) => handleFilterChange("category", e.target.value)}
          className="px-4 py-2 rounded-xl border border-[#2a3a4a] bg-[#0f1a2a] text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
        >
          {categories.map(cat => (
            <option key={cat} value={cat === "All" ? "" : cat}>
              📁 {cat}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 text-sm hover:bg-red-500/20 transition-all flex items-center gap-1"
          >
            <XMarkIcon className="h-4 w-4" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}