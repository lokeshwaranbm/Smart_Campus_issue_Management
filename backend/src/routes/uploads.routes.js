import express from 'express';
import mongoose from 'mongoose';
import { body, param } from 'express-validator';
import { upload, handleUploadError } from '../middleware/fileUpload.js';
import { uploadImageAttachment, getIssueAttachments, deleteImageAttachment } from '../services/imageService.js';
import { Issue } from '../models/Issue.js';
import { IssueAttachment } from '../models/IssueAttachment.js';
import { requireAuth } from '../middleware/auth.js';
import { handleValidation } from '../middleware/validation.js';

const uploadRouter = express.Router();
uploadRouter.use(requireAuth);

/**
 * POST /api/uploads/image
 * Upload an image for an issue
 * Body: { issueId, uploadedByEmail }
 * File: image file via multipart/form-data
 */
uploadRouter.post(
  '/image',
  [
    body('issueId').notEmpty(),
    body('uploadedByEmail').isEmail(),
    handleValidation,
  ],
  upload.single('image'),
  handleUploadError,
  async (req, res) => {
  try {
    const { issueId, uploadedByEmail } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    if (!issueId || !uploadedByEmail) {
      return res.status(400).json({ message: 'Missing issueId or uploadedByEmail' });
    }

    if (String(uploadedByEmail).toLowerCase() !== String(req.user.email).toLowerCase()) {
      return res.status(403).json({ message: 'Cannot upload on behalf of another user.' });
    }

    // Verify issue exists
    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // IDOR prevention: students can only upload to their own issue.
    if (req.user.role === 'student' && String(issue.studentEmail).toLowerCase() !== String(req.user.email).toLowerCase()) {
      return res.status(403).json({ message: 'You can upload images only to your own issues.' });
    }

    // Upload image
    const attachment = await uploadImageAttachment({
      fileBuffer: req.file.buffer,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      issueId,
      uploadedByEmail,
    });

    // Update issue imageUrl (for backward compatibility)
    issue.imageUrl = attachment.url;
    issue.attachments = issue.attachments || [];
    if (!issue.attachments.includes(attachment.attachmentId)) {
      issue.attachments.push(attachment.attachmentId);
    }
    await issue.save();

    return res.status(201).json({
      message: 'Image uploaded successfully',
      attachment,
      imageUrl: attachment.url,
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return res.status(500).json({ message: error.message || 'Image upload failed' });
  }
  }
);

/**
 * GET /api/uploads/issue/:issueId/attachments
 * Get all attachments for an issue
 */
uploadRouter.get('/issue/:issueId/attachments', [param('issueId').notEmpty(), handleValidation], async (req, res) => {
  try {
    const { issueId } = req.params;

    // Verify issue exists
    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // IDOR prevention: students can only read their own issue attachments.
    if (req.user.role === 'student' && String(issue.studentEmail).toLowerCase() !== String(req.user.email).toLowerCase()) {
      return res.status(403).json({ message: 'You can view attachments only for your own issues.' });
    }

    const attachments = await getIssueAttachments(issueId);
    return res.status(200).json({
      ok: true,
      issueId,
      count: attachments.length,
      data: attachments,
    });
  } catch (error) {
    console.error('Get attachments error:', error);
    return res.status(500).json({ message: error.message || 'Failed to fetch attachments' });
  }
});

/**
 * DELETE /api/uploads/attachment/:attachmentId
 * Delete an attachment
 */
uploadRouter.delete('/attachment/:attachmentId', [param('attachmentId').notEmpty(), handleValidation], async (req, res) => {
  try {
    const { attachmentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(attachmentId)) {
      return res.status(400).json({ message: 'Invalid attachment id.' });
    }

    const attachment = await IssueAttachment.findById(attachmentId).lean();
    if (!attachment) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    if (req.user.role === 'student') {
      return res.status(403).json({ message: 'Students cannot delete attachments.' });
    }

    await deleteImageAttachment(attachmentId);

    return res.status(200).json({ message: 'Attachment deleted successfully' });
  } catch (error) {
    console.error('Delete attachment error:', error);
    return res.status(500).json({ message: error.message || 'Failed to delete attachment' });
  }
});

export default uploadRouter;
