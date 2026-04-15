# Image Storage System - Implementation Summary

## Overview

The Smart Campus application now has a complete **AWS S3-based image storage system** for handling issue photos globally. This replaces direct URL storage with a secure, scalable cloud storage solution.

## Architecture

```
Frontend (Upload)
    ↓
Express Backend (multer middleware)
    ↓
AWS S3 Bucket
    ↓
MongoDB (IssueAttachment record)
    ↓
Frontend (Display from S3 URL)
```

## Components

### Backend Files

1. **`backend/src/config/s3.js`**
   - AWS S3 client configuration
   - Upload, download, delete operations
   - Public URL generation

2. **`backend/src/middleware/fileUpload.js`**
   - Multer configuration for image uploads
   - File size limit: 10MB
   - Supported formats: JPEG, PNG, GIF, WebP
   - Error handling

3. **`backend/src/services/imageService.js`**
   - High-level image management functions
   - Upload attachment to S3 and save metadata
   - Retrieve attachments
   - Delete attachments

4. **`backend/src/routes/uploads.routes.js`**
   - API endpoints:
     - `POST /api/uploads/image` - Upload image
     - `GET /api/uploads/issue/:issueId/attachments` - Get all attachments
     - `DELETE /api/uploads/attachment/:attachmentId` - Delete attachment

5. **`backend/src/server.js`** (Updated)
   - Integrated uploadRouter
   - New route: `/api/uploads`

### Frontend Files

1. **`frontend/src/utils/imageUpload.js`**
   - `uploadIssueImage()` - Upload single image
   - `getIssueAttachments()` - Fetch all issue attachments
   - `deleteAttachment()` - Delete attachment
   - `compressImage()` - Optional image compression
   - `formatFileSize()` - Display file sizes

### Database Model

**IssueAttachment** (existing, now fully utilized):
```javascript
{
  issueId: ObjectId,           // Reference to Issue
  uploadedBy: ObjectId,        // Reference to User
  uploadedByEmail: String,     // Email of uploader
  fileName: String,            // Original filename
  mimeType: String,            // e.g., "image/jpeg"
  sizeBytes: Number,           // File size
  storageProvider: String,     // "s3" (or "local", "azure_blob", "gcs")
  storageKey: String,          // S3 object key: "issues/timestamp-filename"
  publicUrl: String,           // https://bucket.s3.region.amazonaws.com/...
  uploadedAt: Date             // Timestamp
}
```

## Configuration

### Environment Variables Required

```bash
# AWS S3
AWS_REGION=us-east-1                          # AWS region
AWS_ACCESS_KEY_ID=xxx                         # IAM user access key
AWS_SECRET_ACCESS_KEY=xxx                     # IAM user secret key
AWS_S3_BUCKET=smart-campus-images             # S3 bucket name
```

See `backend/docs/AWS_S3_SETUP.md` for complete setup instructions.

## Usage Examples

### Backend - Upload
```javascript
// POST /api/uploads/image
const formData = new FormData();
formData.append('image', fileObject);
formData.append('issueId', 'mongodb_id');
formData.append('uploadedByEmail', 'user@example.com');

const response = await fetch('/api/uploads/image', {
  method: 'POST',
  body: formData
});

// Returns:
{
  message: "Image uploaded successfully",
  attachment: {
    attachmentId: "...",
    fileName: "photo.jpg",
    url: "https://...",
    storageProvider: "s3",
    uploadedAt: "..."
  },
  imageUrl: "https://..."
}
```

### Frontend - Upload
```javascript
import { uploadIssueImage } from '@/utils/imageUpload';

const file = inputElement.files[0];
const result = await uploadIssueImage(
  file,
  issueId,
  session.email
);

console.log('Image stored at:', result.imageUrl);
```

### Frontend - Get Attachments
```javascript
import { getIssueAttachments } from '@/utils/imageUpload';

const { data: attachments } = await getIssueAttachments(issueId);
attachments.forEach(att => {
  console.log(att.publicUrl);  // Direct S3 URL
});
```

### Frontend - Delete
```javascript
import { deleteAttachment } from '@/utils/imageUpload';

await deleteAttachment(attachmentId);
```

## Features

✅ **Multi-Provider Support** - Architecture supports AWS S3, Google Cloud Storage, Azure Blob (ready for future expansion)

✅ **Public URL Generation** - Automatic public URLs for quick image display

✅ **File Validation** - Size limit (10MB), format validation (image only)

✅ **Metadata Storage** - Track uploader, timestamp, file details in MongoDB

✅ **Error Handling** - Comprehensive error messages and logging

✅ **Optional Compression** - Frontend utility to compress before upload

✅ **Security** - AWS IAM permissions, public read-only access, secure credential management

## File Size Limits

- **Upload limit**: 10MB per image
- **Free tier** (AWS): 5GB total, 20,000 GET requests/month
- **Pricing**: ~$0.023/GB/month for standard storage

## Image Display

Images are served directly from S3 with:
- CDN-like performance (S3 is globally distributed)
- Cache headers (7-day browser cache)
- Public read access (no authentication needed for viewing)

Example URL:
```
https://smart-campus-images.s3.us-east-1.amazonaws.com/issues/1712973600000-photo.jpg
```

## Next Steps

1. **Deploy backend changes**:
   ```bash
   npm install
   npm run build  # if applicable
   npm start
   ```

2. **Configure AWS credentials** in production environments (Netlify, Render)

3. **Test the upload endpoint**:
   ```bash
   curl -F "image=@test.jpg" \
        -F "issueId=..." \
        -F "uploadedByEmail=user@example.com" \
        http://localhost:5000/api/uploads/image
   ```

4. **Integrate into UI** - Update issue detail pages to use new upload endpoint

## Monitoring & Maintenance

- **AWS CloudWatch** - Monitor S3 storage, request counts
- **Lifecycle Policies** - Archive old images after 1 year
- **CloudFront CDN** - Optional, for faster global delivery
- **Cost Analysis** - Regular review of S3 usage and charges

## Support

For setup help, see: `backend/docs/AWS_S3_SETUP.md`

For API details, see: `backend/src/routes/uploads.routes.js`
