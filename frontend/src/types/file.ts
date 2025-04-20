export interface FileData {
  id: string;
  original_filename: string;
  file_type: string;
  size: number;
  uploaded_at: string;
  file: string;
  file_hash?: string;
  reference_count: number;
}

export interface FileType {
  id: string;
  original_filename: string;
  file_type: string;
  size: number;
  uploaded_at: string;
  file: string;
  file_hash?: string;
  reference_count: number;
} 