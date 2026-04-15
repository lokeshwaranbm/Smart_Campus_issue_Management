import { IssueAttachment } from '../models/IssueAttachment.js';
import { Issue } from '../models/Issue.js';
import { uploadToS3, deleteFromS3 } from '../config/s3.js';

/**
 * Upload and save image attachment
 * @param {Object} options
 * @returns {Promise<Object>}
 */
export const uploadImageAttachment = async ({
  fileBuffer,
  fileName,
  mimeType,
  issueId,
  uploadedByEmail,
  uploadedByUserId = null,
}) => {
  try {
    // Upload to S3
    const { key, url } = await uploadToS3(fileBuffer, fileName, mimeType, 'issues');

    // Create attachment record in database
    const attachment = new IssueAttachment({
      issueId,
      uploadedBy: uploadedByUserId,
      uploadedByEmail,
      fileName,
      mimeType,
      sizeBytes: fileBuffer.length,
      storageProvider: 's3',
      storageKey: key,
      publicUrl: url,
    });

    await attachment.save();

    return {
      attachmentId: attachment._id,
      fileName: attachment.fileName,
      url: attachment.publicUrl,
      storageProvider: attachment.storageProvider,
      storageKey: attachment.storageKey,
      uploadedAt: attachment.uploadedAt,
    };
  } catch (error) {
    console.error('Image attachment upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

/**
 * Get attachment by ID
 * @param {string} attachmentId - Attachment MongoDB ID
 * @returns {Promise<Object>}
 */
export const getAttachment = async (attachmentId) => {
  try {
    const attachment = await IssueAttachment.findById(attachmentId)
      .populate('issueId', 'id title')
      .populate('uploadedBy', 'email name')
      .lean();

    if (!attachment) {
      throw new Error('Attachment not found');
    }

    return attachment;
  } catch (error) {
    console.error('Get attachment error:', error);
    throw error;
  }
};

/**
 * Delete image attachment
 * @param {string} attachmentId - Attachment MongoDB ID
 * @returns {Promise<void>}
 */
export const deleteImageAttachment = async (attachmentId) => {
  try {
    const attachment = await IssueAttachment.findById(attachmentId);

    if (!attachment) {
      throw new Error('Attachment not found');
    }

    // Delete from S3
    if (attachment.storageProvider === 's3' && attachment.storageKey) {
      await deleteFromS3(attachment.storageKey);
    }

    // Delete from database
    await IssueAttachment.findByIdAndDelete(attachmentId);

    return { message: 'Attachment deleted successfully' };
  } catch (error) {
    console.error('Delete attachment error:', error);
    throw error;
  }
};

/**
 * Get all attachments for an issue
 * @param {string} issueId - Issue MongoDB ID
 * @returns {Promise<Array>}
 */
export const getIssueAttachments = async (issueId) => {
  try {
    const attachments = await IssueAttachment.find({ issueId })
      .sort({ uploadedAt: -1 })
      .lean();

    return attachments;
  } catch (error) {
    console.error('Get issue attachments error:', error);
    throw error;
  }
};

/**
 * Update issue imageUrl field (for backward compatibility)
 * @param {string} issueId - Issue MongoDB ID
 * @param {string} imageUrl - New image URL
 * @returns {Promise<void>}
 */
export const updateIssueImageUrl = async (issueId, imageUrl) => {
  try {
    await Issue.findByIdAndUpdate(issueId, { imageUrl }, { new: true });
  } catch (error) {
    console.error('Update issue image URL error:', error);
    throw error;
  }
};
