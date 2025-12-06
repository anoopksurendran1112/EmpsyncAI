"use client";

import { useState, useMemo } from "react";
import { Filter, Search, X } from "lucide-react";

interface Group {
  id: number;
  name: string;
}

interface FilterProps {
  selectedGroupId: number;
  setSelectedGroupId: (id: number) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  groupsData: any;
  groupsLoading: boolean;
  groupsError: any;
  filteredLoading?: boolean;
}

export default function FilterComponent({
  selectedGroupId,
  setSelectedGroupId,
  searchQuery,
  setSearchQuery,
  showFilters,
  setShowFilters,
  groupsData,
  groupsLoading,
  groupsError,
  filteredLoading = false
}: FilterProps) {
  const [tempSearchQuery, setTempSearchQuery] = useState(searchQuery);

  // Extract groups from the hook response
  const allGroups = useMemo(() => {
    if (!groupsData) {
      console.log("❌ No groups data");
      return [];
    }
    
    console.log("📊 Raw groups data:", groupsData);

    const groupsArray = groupsData.data || [];
    console.log("📋 Groups array:", groupsArray);

    const extractedGroups = groupsArray
      .map((groupItem: any) => {
        return {
          id: Number(groupItem.id),
          name: groupItem.group || groupItem.name || "Unnamed Group"
        };
      })
      .filter((group: { id: number; name: string }) => group.id && group.name.trim() !== "")
      .sort((a, b) => a.name.localeCompare(b.name));

    console.log("🎯 Final extracted groups:", extractedGroups);
    return extractedGroups;
  }, [groupsData]);

  const selectedGroupName = useMemo(() => {
    if (selectedGroupId === 0) return null;
    return allGroups.find(group => group.id === selectedGroupId)?.name || `Group ${selectedGroupId}`;
  }, [selectedGroupId, allGroups]);

  // ✅ Handle search submission
  const handleSearchSubmit = () => {
    setSearchQuery(tempSearchQuery);
  };

  // ✅ Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  // ✅ Clear all filters
  const clearFilters = () => {
    setSelectedGroupId(0);
    setSearchQuery("");
    setTempSearchQuery("");
  };

  // ✅ Clear only search
  const clearSearch = () => {
    setSearchQuery("");
    setTempSearchQuery("");
  };

  // ✅ Check if any filter is active
  const hasActiveFilters = selectedGroupId !== 0 || searchQuery !== "";

  if (!showFilters) {
    return (
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowFilters(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            hasActiveFilters
              ? "bg-blue-100 text-blue-700 border-blue-300"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
          }`}
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <span className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              !
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filter Employees</h3>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              <X className="h-3 w-3" />
              Clear All
            </button>
          )}
          <button
            onClick={() => setShowFilters(false)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Search Input - UPDATED FOR ENTER/CLICK SEARCH */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Employees {filteredLoading && "(Searching...)"}
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Press Enter to search..."
                value={tempSearchQuery}
                onChange={(e) => setTempSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              {tempSearchQuery && (
                <button
                  onClick={() => setTempSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
              onClick={handleSearchSubmit}
              disabled={filteredLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              Search
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Press Enter or click Search button to search
          </p>
        </div>

        {/* Group Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Group
          </label>
          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            disabled={groupsLoading}
          >
            <option value={0}>
              {groupsLoading ? "Loading groups..." : `All Groups (${allGroups.length})`}
            </option>
            {allGroups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Filters employees from all pages
          </p>
          {groupsError && (
            <p className="text-xs text-red-500 mt-1">
              Failed to load groups: {groupsError.message}
            </p>
          )}
          {!groupsLoading && allGroups.length === 0 && (
            <p className="text-xs text-yellow-500 mt-1">
              No groups found for this company
            </p>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600">Active filters:</span>
            {selectedGroupId !== 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                Group: {selectedGroupName}
                <button
                  onClick={() => setSelectedGroupId(0)}
                  className="hover:text-blue-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                Search: "{searchQuery}"
                <button
                  onClick={clearSearch}
                  className="hover:text-green-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}