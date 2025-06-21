// src/services/fileService.ts
import apiClient from "./apiClients";
import { 
  FileUploadResponse,
  UploadProgressEvent,
  ApiResponse
} from "../types/api";
import { 
  validateRequired,
  validateForm
} from "../utils/validators";
import { 
  sanitizeFileName,
  sanitizeUserContent,
  redactForLogging 
} from "../utils/sanitize";

const FILE_ENDPOINTS = {
  UPLOAD: '/files/upload',
  UPLOAD_MULTIPLE: '/files/upload-multiple',
  FILE_DETAIL: (id: string) => `/files/${id}`,
  DELETE_FILE: (id: string) => `/files/${id}`,
  DOWNLOAD: (id: string) => `/files/${id}/download`,
  GENERATE_PRESIGNED_URL: '/files/presigned-url',
  PROCESS_IMAGE: '/files/process-image',
  THUMBNAIL: (id: string) => `/files/${id}/thumbnail`,
} as const;

// File type configurations
const FILE_CONFIGS = {
  IMAGES: {
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 10,
  },
  DOCUMENTS: {
    allowedTypes: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    maxSize: 25 * 1024 * 1024, // 25MB
    maxFiles: 5,
  },
  VIDEOS: {
    allowedTypes: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
    maxSize: 100 * 1024 * 1024, // 100MB
    maxFiles: 3,
  },
  AVATAR: {
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    maxSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 1,
  },
} as const;

type FileCategory = keyof typeof FILE_CONFIGS;

interface UploadOptions {
  category?: FileCategory;
  compress?: boolean;
  generateThumbnail?: boolean;
  onProgress?: (event: UploadProgressEvent) => void;
  folder?: string;
  isPublic?: boolean;
}

class FileService {

  // File Validation
  private validateFile(file: File, category: FileCategory = 'IMAGES'): { isValid: boolean; errors: string[] } {
    const config = FILE_CONFIGS[category];
    const errors: string[] = [];

    // Check file size
    if (file.size > config.maxSize) {
      errors.push(`File size must be less than ${Math.round(config.maxSize / 1024 / 1024)}MB`);
    }

    // Check file type
    if (!config.allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed for ${category.toLowerCase()}`);
    }

    // Check filename
    if (!file.name || file.name.trim().length === 0) {
      errors.push('File must have a valid name');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private validateFiles(files: File[], category: FileCategory = 'IMAGES'): { isValid: boolean; errors: string[] } {
    const config = FILE_CONFIGS[category];
    const errors: string[] = [];

    // Check number of files
    if (files.length > config.maxFiles) {
      errors.push(`Maximum ${config.maxFiles} files allowed for ${category.toLowerCase()}`);
    }

    // Validate each file
    files.forEach((file, index) => {
      const fileValidation = this.validateFile(file, category);
      if (!fileValidation.isValid) {
        errors.push(`File ${index + 1}: ${fileValidation.errors.join(', ')}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Single File Upload
  async uploadFile(file: File, options: UploadOptions = {}): Promise<ApiResponse<FileUploadResponse>> {
    try {
      const category = options.category || 'IMAGES';

      // 1. Validate file
      const fileValidation = this.validateFile(file, category);
      if (!fileValidation.isValid) {
        return {
          success: false,
          error: 'File validation failed',
          message: fileValidation.errors.join(', ')
        };
      }

      // 2. Security checks disabled - rate limiting removed
      console.log('File upload security check bypassed');

      // 3. Prepare form data
      const formData = new FormData();
      formData.append('file', file, sanitizeFileName(file.name));
      formData.append('category', category);
      
      if (options.compress) formData.append('compress', 'true');
      if (options.generateThumbnail) formData.append('generateThumbnail', 'true');
      if (options.folder) formData.append('folder', sanitizeUserContent(options.folder));
      if (options.isPublic !== undefined) formData.append('isPublic', String(options.isPublic));

      // 4. Log upload attempt
      console.log('Uploading file:', redactForLogging({
        filename: file.name,
        size: file.size,
        type: file.type,
        category
      }));

      // 5. Make API request with progress tracking
      const response = await apiClient.post<ApiResponse<FileUploadResponse>>(
        FILE_ENDPOINTS.UPLOAD,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (options.onProgress && progressEvent.total) {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              options.onProgress({
                loaded: progressEvent.loaded,
                total: progressEvent.total,
                progress
              });
            }
          },
        }
      );

      if (response.data.success) {
        console.log('File uploaded successfully:', response.data.data?.id);
      }

      return response.data;

    } catch (error: any) {
      console.error('Upload file error:', error);
      
      if (error.response?.status === 413) {
        return {
          success: false,
          error: 'File too large',
          message: 'The file you are trying to upload is too large.'
        };
      }

      if (error.response?.status === 415) {
        return {
          success: false,
          error: 'Unsupported file type',
          message: 'The file type you are trying to upload is not supported.'
        };
      }

      return {
        success: false,
        error: 'Upload failed',
        message: 'Unable to upload file. Please try again.'
      };
    }
  }

  // Multiple File Upload
  async uploadFiles(files: File[], options: UploadOptions = {}): Promise<ApiResponse<FileUploadResponse[]>> {
    try {
      const category = options.category || 'IMAGES';

      // 1. Validate files
      const filesValidation = this.validateFiles(files, category);
      if (!filesValidation.isValid) {
        return {
          success: false,
          error: 'File validation failed',
          message: filesValidation.errors.join(', ')
        };
      }

      // 2. Security checks disabled - rate limiting removed
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      console.log('Multiple file upload security check bypassed');

      // 3. Prepare form data
      const formData = new FormData();
      
      files.forEach((file) => {
        formData.append('files', file, sanitizeFileName(file.name));
      });
      
      formData.append('category', category);
      if (options.compress) formData.append('compress', 'true');
      if (options.generateThumbnail) formData.append('generateThumbnail', 'true');
      if (options.folder) formData.append('folder', sanitizeUserContent(options.folder));
      if (options.isPublic !== undefined) formData.append('isPublic', String(options.isPublic));

      // 4. Log upload attempt
      console.log('Uploading files:', redactForLogging({
        fileCount: files.length,
        totalSize,
        category
      }));

      // 5. Make API request
      const response = await apiClient.post<ApiResponse<FileUploadResponse[]>>(
        FILE_ENDPOINTS.UPLOAD_MULTIPLE,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (options.onProgress && progressEvent.total) {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              options.onProgress({
                loaded: progressEvent.loaded,
                total: progressEvent.total,
                progress
              });
            }
          },
        }
      );

      if (response.data.success) {
        console.log('Files uploaded successfully:', response.data.data?.length);
      }

      return response.data;

    } catch (error: any) {
      console.error('Upload files error:', error);
      
      return {
        success: false,
        error: 'Upload failed',
        message: 'Unable to upload files. Please try again.'
      };
    }
  }

  // File Management
  async getFile(fileId: string): Promise<ApiResponse<FileUploadResponse>> {
    try {
      // 1. Validate required ID
      if (!fileId || fileId.trim().length === 0) {
        return {
          success: false,
          error: 'Invalid file ID',
          message: 'File ID is required.'
        };
      }

      // 2. Make API request
      const response = await apiClient.get<ApiResponse<FileUploadResponse>>(
        FILE_ENDPOINTS.FILE_DETAIL(fileId)
      );

      return response.data;

    } catch (error: any) {
      console.error('Get file error:', error);
      
      if (error.response?.status === 404) {
        return {
          success: false,
          error: 'File not found',
          message: 'The requested file could not be found.'
        };
      }

      return {
        success: false,
        error: 'Failed to get file',
        message: 'Unable to retrieve file details.'
      };
    }
  }

  async deleteFile(fileId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      // 1. Validate required ID
      if (!fileId || fileId.trim().length === 0) {
        return {
          success: false,
          error: 'Invalid file ID',
          message: 'File ID is required.'
        };
      }

      // 2. Security checks disabled - rate limiting removed
      console.log('File delete security check bypassed');

      // 3. Make API request
      const response = await apiClient.delete<ApiResponse<{ message: string }>>(
        FILE_ENDPOINTS.DELETE_FILE(fileId)
      );

      if (response.data.success) {
        console.log('File deleted successfully:', fileId);
      }

      return response.data;

    } catch (error: any) {
      console.error('Delete file error:', error);
      
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to delete file. Please try again.'
      };
    }
  }

  async generateDownloadUrl(fileId: string, expiresIn?: number): Promise<ApiResponse<{ url: string; expiresAt: string }>> {
    try {
      // 1. Validate required ID
      if (!fileId || fileId.trim().length === 0) {
        return {
          success: false,
          error: 'Invalid file ID',
          message: 'File ID is required.'
        };
      }

      // 2. Security checks disabled - rate limiting removed
      console.log('Download URL generation security check bypassed');

      // 3. Make API request
      const params = expiresIn ? { expiresIn } : {};
      const response = await apiClient.get<ApiResponse<{ url: string; expiresAt: string }>>(
        FILE_ENDPOINTS.DOWNLOAD(fileId),
        { params }
      );

      return response.data;

    } catch (error: any) {
      console.error('Generate download URL error:', error);
      
      return {
        success: false,
        error: 'Failed to generate download URL',
        message: 'Unable to generate download URL. Please try again.'
      };
    }
  }

  // Image Processing
  async processImage(fileId: string, options: {
    resize?: { width: number; height: number };
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp';
    crop?: { x: number; y: number; width: number; height: number };
  }): Promise<ApiResponse<FileUploadResponse>> {
    try {
      // 1. Validate required ID
      if (!fileId || fileId.trim().length === 0) {
        return {
          success: false,
          error: 'Invalid file ID',
          message: 'File ID is required.'
        };
      }

      // 2. Sanitize processing options
      const sanitizedOptions: any = {};
      
      if (options.resize) {
        sanitizedOptions.resize = {
          width: Math.max(1, Math.min(4000, options.resize.width)),
          height: Math.max(1, Math.min(4000, options.resize.height)),
        };
      }
      
      if (options.quality) {
        sanitizedOptions.quality = Math.max(1, Math.min(100, options.quality));
      }
      
      if (options.format) {
        sanitizedOptions.format = options.format;
      }
      
      if (options.crop) {
        sanitizedOptions.crop = {
          x: Math.max(0, options.crop.x),
          y: Math.max(0, options.crop.y),
          width: Math.max(1, options.crop.width),
          height: Math.max(1, options.crop.height),
        };
      }

      // 3. Security checks disabled - rate limiting removed
      console.log('Image processing security check bypassed');

      // 4. Make API request
      const response = await apiClient.post<ApiResponse<FileUploadResponse>>(
        FILE_ENDPOINTS.PROCESS_IMAGE,
        { fileId, options: sanitizedOptions }
      );

      if (response.data.success) {
        console.log('Image processed successfully:', fileId);
      }

      return response.data;

    } catch (error: any) {
      console.error('Process image error:', error);
      
      return {
        success: false,
        error: 'Image processing failed',
        message: 'Unable to process image. Please try again.'
      };
    }
  }

  async generateThumbnail(fileId: string, size: number = 200): Promise<ApiResponse<{ url: string }>> {
    try {
      // 1. Validate required ID
      if (!fileId || fileId.trim().length === 0) {
        return {
          success: false,
          error: 'Invalid file ID',
          message: 'File ID is required.'
        };
      }

      // 2. Validate size
      const thumbnailSize = Math.max(50, Math.min(500, size));

      // 3. Make API request
      const response = await apiClient.get<ApiResponse<{ url: string }>>(
        FILE_ENDPOINTS.THUMBNAIL(fileId),
        { params: { size: thumbnailSize } }
      );

      return response.data;

    } catch (error: any) {
      console.error('Generate thumbnail error:', error);
      
      return {
        success: false,
        error: 'Thumbnail generation failed',
        message: 'Unable to generate thumbnail. Please try again.'
      };
    }
  }

  // Presigned URL for Direct Upload
  async generatePresignedUrl(filename: string, contentType: string, category: FileCategory = 'IMAGES'): Promise<ApiResponse<{ 
    uploadUrl: string; 
    downloadUrl: string; 
    fileId: string;
    expiresAt: string;
  }>> {
    try {
      // 1. Validate input
      const validationRules = {
        filename: (name: string) => validateRequired(name, 'Filename'),
        contentType: (type: string) => validateRequired(type, 'Content type'),
      };

      const formValidation = await validateForm({ filename, contentType }, validationRules);
      if (!formValidation.isValid) {
        return {
          success: false,
          error: 'Validation failed',
          message: Object.values(formValidation.errors).flat().join(', ')
        };
      }

      // 2. Validate file type for category
      const config = FILE_CONFIGS[category];
      if (!config.allowedTypes.includes(contentType)) {
        return {
          success: false,
          error: 'Invalid file type',
          message: `File type ${contentType} is not allowed for ${category.toLowerCase()}`
        };
      }

      // 3. Sanitize input
      const sanitizedData = {
        filename: sanitizeFileName(filename),
        contentType: contentType.trim(),
        category,
      };

      // 4. Security checks disabled - rate limiting removed
      console.log('Presigned URL generation security check bypassed');

      // 5. Make API request
      const response = await apiClient.post<ApiResponse<{ 
        uploadUrl: string; 
        downloadUrl: string; 
        fileId: string;
        expiresAt: string;
      }>>(
        FILE_ENDPOINTS.GENERATE_PRESIGNED_URL,
        sanitizedData
      );

      if (response.data.success) {
        console.log('Presigned URL generated successfully');
      }

      return response.data;

    } catch (error: any) {
      console.error('Generate presigned URL error:', error);
      
      return {
        success: false,
        error: 'URL generation failed',
        message: 'Unable to generate upload URL. Please try again.'
      };
    }
  }
}

export default new FileService();