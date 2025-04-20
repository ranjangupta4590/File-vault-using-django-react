import axios from 'axios';
import { FileType } from '../types/file';

export interface File {
  id: string;
  original_filename: string;
  file_type: string;
  size: number;
  uploaded_at: string;
  file: string;
  reference_count: number;
}

interface FilterOptions {
  fileType?: string;
  minSize?: number;
  maxSize?: number;
  startDate?: string;
  endDate?: string;
}

const API_BASE_URL = 'http://localhost:8000/api';

export const getFiles = async (searchQuery: string = '', filters: FilterOptions = {}) => {
  const params = new URLSearchParams();
  
  if (searchQuery) {
    params.append('search', searchQuery);
  }
  
  if (filters.fileType) {
    params.append('file_type', filters.fileType);
  }
  
  if (filters.minSize !== undefined) {
    params.append('min_size', filters.minSize.toString());
  }
  
  if (filters.maxSize !== undefined) {
    params.append('max_size', filters.maxSize.toString());
  }
  
  if (filters.startDate) {
    params.append('start_date', filters.startDate);
  }
  
  if (filters.endDate) {
    params.append('end_date', filters.endDate);
  }

  const response = await axios.get(`${API_BASE_URL}/files?${params.toString()}`);
  return response.data;
};

export const deleteFile = async (fileId: string) => {
  await axios.delete(`${API_BASE_URL}/files/${fileId}`);
};

export const downloadFile = async (fileId: string) => {
  const response = await axios.get(`${API_BASE_URL}/files/${fileId}/download`, {
    responseType: 'blob'
  });
  
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', response.headers['content-disposition'].split('filename=')[1]);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const fileService = {
  async getFiles(searchQuery?: string, filters?: FilterOptions): Promise<FileType[]> {
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (filters) {
      if (filters.fileType) params.append('file_type', filters.fileType);
      if (filters.minSize) params.append('min_size', filters.minSize.toString());
      if (filters.maxSize) params.append('max_size', filters.maxSize.toString());
      if (filters.startDate) params.append('start_date', filters.startDate);
      if (filters.endDate) params.append('end_date', filters.endDate);
    }

    const response = await fetch(`${API_BASE_URL}/files?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch files');
    return response.json();
  },

  async deleteFile(fileId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/files/${fileId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete file');
  },

  async downloadFile(fileId: string): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/files/${fileId}/download`);
    if (!response.ok) throw new Error('Failed to download file');
    return response.blob();
  },

  async uploadFile(file: Blob): Promise<FileType> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/files/`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if it's a duplicate file response (status 200 with reference_count > 1)
        if (response.status === 200 && data.reference_count > 1) {
          return data; // Return the data to indicate it's an existing file
        }
        
        // Check for specific error messages from the backend
        if (response.status === 409 || (data.error && data.error.includes('already exists'))) {
          throw new Error('File already exists');
        }
        
        throw new Error(data.error || 'Failed to upload file');
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to upload file');
    }
  },
};