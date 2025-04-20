import React, { useState, useEffect, useCallback } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useDebounce } from '../hooks/useDebounce';

interface SearchFilterProps {
  onSearch: (query: string) => void;
  onFilter: (filters: {
    fileType?: string;
    minSize?: number;
    maxSize?: number;
    startDate?: string;
    endDate?: string;
  }) => void;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({ onSearch, onFilter }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    fileType: '',
    minSize: '',
    maxSize: '',
    startDate: '',
    endDate: '',
  });

  // Debounce the search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Apply search when debounced query changes
  useEffect(() => {
    onSearch(debouncedSearchQuery);
  }, [debouncedSearchQuery, onSearch]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    
    // Apply filters immediately when they change
    const filterParams = {
      fileType: name === 'fileType' ? value : filters.fileType,
      minSize: name === 'minSize' ? (value ? parseFloat(value) * 1024 * 1024 : undefined) : (filters.minSize ? parseFloat(filters.minSize) * 1024 * 1024 : undefined),
      maxSize: name === 'maxSize' ? (value ? parseFloat(value) * 1024 * 1024 : undefined) : (filters.maxSize ? parseFloat(filters.maxSize) * 1024 * 1024 : undefined),
      startDate: name === 'startDate' ? value : filters.startDate,
      endDate: name === 'endDate' ? value : filters.endDate,
    };

    // Validate date range
    if (filterParams.startDate && filterParams.endDate) {
      const start = new Date(filterParams.startDate);
      const end = new Date(filterParams.endDate);
      if (start > end) {
        // Swap dates if start is after end
        [filterParams.startDate, filterParams.endDate] = [filterParams.endDate, filterParams.startDate];
        setFilters(prev => ({
          ...prev,
          startDate: filterParams.startDate,
          endDate: filterParams.endDate,
        }));
      }
    }

    onFilter(filterParams);
  };

  const resetFilters = useCallback(() => {
    setFilters({
      fileType: '',
      minSize: '',
      maxSize: '',
      startDate: '',
      endDate: '',
    });
    setSearchQuery('');
    onFilter({});
    onSearch('');
  }, [onFilter, onSearch]);

  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Search Input */}
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search files..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
        </div>

        {/* File Type Filter */}
        <div className="min-w-[150px]">
          <select
            id="fileType"
            name="fileType"
            value={filters.fileType}
            onChange={handleFilterChange}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
          >
            <option value="">All Types</option>
            <option value="image">Images</option>
            <option value="document">Documents</option>
            <option value="video">Videos</option>
            <option value="audio">Audio</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Size Range Filter */}
        <div className="flex gap-2 min-w-[200px]">
          <input
            type="number"
            id="minSize"
            name="minSize"
            value={filters.minSize}
            onChange={handleFilterChange}
            placeholder="Min (MB)"
            className="block w-full border-gray-300 p-2 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
          <input
            type="number"
            id="maxSize"
            name="maxSize"
            value={filters.maxSize}
            onChange={handleFilterChange}
            placeholder="Max (MB)"
            className="block w-full border-gray-300 p-2 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>

        {/* Date Range Filter */}
        <div className="flex gap-2 min-w-[200px]">
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
            max={filters.endDate || undefined}
            className="block w-full border-gray-300 p-2 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
            min={filters.startDate || undefined}
            className="block w-full border-gray-300 p-2 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>

        {/* Reset Button */}
        <button
          onClick={resetFilters}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Reset
        </button>
      </div>
    </div>
  );
}; 