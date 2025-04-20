import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fileService } from '../services/fileService';
import { FileType } from '../types/file';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface FileUploadProps {
  onUploadSuccess: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState<globalThis.File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation<FileType, Error, File>({
    mutationFn: async (file: File) => {
      try {
        const result = await fileService.uploadFile(file);
        return result;
      } catch (error) {
        console.error('Upload error in mutation:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ['files'] });
      onUploadSuccess();

      if (data && data.reference_count > 1) {
        toast.warning('File already exists in the system');
      } else {
        toast.success('File uploaded successfully');
      }
    },
    onError: (error: Error) => {
      console.error('Upload error:', error);
      if (error.message.includes('already exists')) {
        toast.warning('File already exists in the system');
      } else {
        toast.error('Failed to upload file: ' + error.message);
      }
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (selectedFile) {
      try {
        await uploadMutation.mutateAsync(selectedFile);
      } catch (error) {
        // Error is handled in mutation's onError
        console.error('Upload error in handler:', error);
      }
    }
  };

  return (
    <div className="p-6">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-500'}
          ${uploadMutation.isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <input
          type="file"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploadMutation.isPending}
        />
        <div className="space-y-4">
          <div className="flex justify-center">
            <svg
              className={`w-12 h-12 ${isDragging ? 'text-primary-500' : 'text-gray-400'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <div>
            <p className="text-lg font-medium text-gray-900">
              {uploadMutation.isPending ? 'Uploading...' : 'Upload a file or drag and drop'}
            </p>
            <p className="mt-1 text-sm text-gray-500">Any file up to 50MB</p>
          </div>
          {selectedFile && (
            <div className="mt-4">
              <p className="text-sm text-gray-500">Selected: {selectedFile.name}</p>
            </div>
          )}
        </div>
      </div>
      <button
        onClick={handleUpload}
        disabled={!selectedFile || uploadMutation.isPending}
        className={`mt-4 w-full px-4 py-3 border text-sm font-medium rounded-md shadow-sm transition-colors
          ${selectedFile 
            ? 'border-transparent text-white bg-primary-600 hover:bg-primary-700 focus:ring-2 focus:ring-offset-2 focus:ring-primary-500' 
            : 'border-gray-300 text-gray-500 bg-gray-100 cursor-not-allowed'
          } disabled:opacity-50`}
      >
        {uploadMutation.isPending ? 'Uploading...' : selectedFile ? 'Upload File' : 'Select a file to upload'}
      </button>
      <ToastContainer/>
    </div>
  );
}; 