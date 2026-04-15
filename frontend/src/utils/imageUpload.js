import { apiFetch } from './apiConfig';

/**
 * Upload image for an issue
 * @param {File} imageFile - Image file from input
 * @param {string} issueId - Issue MongoDB ID
 * @param {string} uploadedByEmail - Email of uploader
 * @returns {Promise<{message, attachment, imageUrl}>}
 */
export const uploadIssueImage = async (imageFile, issueId, uploadedByEmail) => {
  try {
    if (!imageFile || !issueId || !uploadedByEmail) {
      throw new Error('Missing required parameters: imageFile, issueId, uploadedByEmail');
    }

    // Validate file is an image
    if (!imageFile.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    // Validate file size (10MB max)
    if (imageFile.size > 10 * 1024 * 1024) {
      throw new Error('Image size must be less than 10MB');
    }

    // Create FormData
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('issueId', issueId);
    formData.append('uploadedByEmail', uploadedByEmail);

    // Upload to backend through authenticated API wrapper.
    const response = await apiFetch('/api/uploads/image', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Upload failed');
    }

    return result;
  } catch (error) {
    console.error('Image upload error:', error);
    throw error;
  }
};

/**
 * Get all attachments for an issue
 * @param {string} issueId - Issue MongoDB ID
 * @returns {Promise<{issuId, count, data}>}
 */
export const getIssueAttachments = async (issueId) => {
  try {
    const response = await apiFetch(`/api/uploads/issue/${issueId}/attachments`);
    const result = await response.json();

    if (!result.ok) {
      throw new Error(result.message || 'Failed to fetch attachments');
    }

    return result;
  } catch (error) {
    console.error('Get attachments error:', error);
    throw error;
  }
};

/**
 * Delete an attachment
 * @param {string} attachmentId - Attachment MongoDB ID
 * @returns {Promise<{message}>}
 */
export const deleteAttachment = async (attachmentId) => {
  try {
    const response = await apiFetch(`/api/uploads/attachment/${attachmentId}`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to delete attachment');
    }

    return result;
  } catch (error) {
    console.error('Delete attachment error:', error);
    throw error;
  }
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string}
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes, k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Compress image before upload (optional, for optimization)
 * @param {File} file - Image file
 * @param {number} maxWidth - Max width in pixels
 * @param {number} maxHeight - Max height in pixels
 * @param {number} quality - Quality 0-1
 * @returns {Promise<File>}
 */
export const compressImage = async (file, maxWidth = 1920, maxHeight = 1920, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;

      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          file.type,
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
  });
};
