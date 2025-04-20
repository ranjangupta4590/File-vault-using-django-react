import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFiles, deleteFile, downloadFile } from '../services/fileService';
import { FileType } from '../types/file';
import { SearchFilter } from './SearchFilter';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const FileList: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<{
    fileType?: string;
    minSize?: number;
    maxSize?: number;
    startDate?: string;
    endDate?: string;
  }>({});

  const queryClient = useQueryClient();

  const { data: allFiles = [], isLoading, error } = useQuery<FileType[]>({
    queryKey: ['files'],
    queryFn: () => getFiles(),
  });

  // Apply filters and search in memory for better performance
  const filteredFiles = useMemo(() => {
    return allFiles.filter(file => {
      // Search query filter
      const matchesSearch = searchQuery === '' || 
        file.original_filename.toLowerCase().includes(searchQuery.toLowerCase());

      // File type filter
      const matchesFileType = !filters.fileType || 
        file.file_type.toLowerCase().includes(filters.fileType.toLowerCase());

      // Size filters
      const matchesMinSize = !filters.minSize || file.size >= filters.minSize;
      const matchesMaxSize = !filters.maxSize || file.size <= filters.maxSize;

      // Date filters
      const fileDate = new Date(file.uploaded_at);
      const startDate = filters.startDate ? new Date(filters.startDate) : null;
      const endDate = filters.endDate ? new Date(filters.endDate) : null;
      
      // Set time to start/end of day for proper date comparison
      if (startDate) startDate.setHours(0, 0, 0, 0);
      if (endDate) endDate.setHours(23, 59, 59, 999);
      fileDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues

      const matchesStartDate = !startDate || fileDate >= startDate;
      const matchesEndDate = !endDate || fileDate <= endDate;

      return matchesSearch && matchesFileType && matchesMinSize && 
             matchesMaxSize && matchesStartDate && matchesEndDate;
    });
  }, [allFiles, searchQuery, filters]);

  const deleteMutation = useMutation({
    mutationFn: deleteFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      toast.success('File deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete file');
    },
  });

  const downloadMutation = useMutation({
    mutationFn: downloadFile,
    onSuccess: () => {
      toast.success('File download started');
    },
    onError: () => {
      toast.error('Failed to download file');
    },
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilter = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading files</div>;

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Uploaded Files</h3>
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
        <SearchFilter onSearch={handleSearch} onFilter={handleFilter} />
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Filename
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uploaded
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFiles.map((file) => (
                <tr key={file.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {file.original_filename}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {file.file_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(file.uploaded_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => downloadMutation.mutate(file.id)}
                      className="bg-primary-600 p-2 rounded-md text-white hover:text-primary-900 mr-4"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(file.id)}
                      className="bg-red-600 p-2 rounded-md text-white hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}; 