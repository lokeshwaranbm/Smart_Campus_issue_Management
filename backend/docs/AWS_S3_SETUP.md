# AWS S3 Image Storage Setup Guide

This guide explains how to set up AWS S3 for storing and serving images in the Smart Campus application.

## Prerequisites

- AWS Account (can sign up for [free tier](https://aws.amazon.com/free/))
- Node.js 16+ installed
- Netlify/production environment configured

## Step 1: Create an S3 Bucket

1. Go to [AWS S3 Console](https://console.aws.amazon.com/s3)
2. Click **Create bucket**
3. Enter bucket name: `smart-campus-images` (or your preferred name)
4. Choose region: `us-east-1` (or your preferred region)
5. **Block Public Access settings**: Uncheck "Block all public access" (images need to be publicly readable)
6. Click **Create bucket**

## Step 2: Enable Public Access

1. Go to your bucket → **Permissions** tab
2. **Bucket Policy**: Add the following policy (replace `smart-campus-images` with your bucket name):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::smart-campus-images/*"
    }
  ]
}
```

3. **Access Control List (ACL)**: Ensure "Everyone (public access)" has "Read" permission

## Step 3: Create IAM User with S3 Access

1. Go to [IAM Console](https://console.aws.amazon.com/iam)
2. Click **Users** → **Create user**
3. Enter username: `smart-campus-s3-user`
4. Click **Next**
5. Select **Attach policies directly**
6. Search and select: `AmazonS3FullAccess`
7. Click **Create user**

## Step 4: Generate Access Keys

1. Click the created user
2. Go to **Security credentials** tab
3. Under **Access keys**: Click **Create access key**
4. Select **Other** and click **Next**
5. Copy **Access Key** and **Secret Access Key** (save them securely!)
6. Click **Done**

## Step 5: Update Environment Variables

### Local Development (.env)

```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_S3_BUCKET=smart-campus-images
```

### Netlify Production

1. Go to Netlify site settings → **Environment**
2. Add these environment variables:
   - `AWS_REGION`: `us-east-1`
   - `AWS_ACCESS_KEY_ID`: Your IAM user's access key
   - `AWS_SECRET_ACCESS_KEY`: Your IAM user's secret key
   - `AWS_S3_BUCKET`: `smart-campus-images`

3. Redeploy your site

### Render Production (if using Render for backend)

1. Go to Render dashboard → Your backend service
2. Click **Environment**
3. Add the same AWS variables
4. Redeploy

## Step 6: Install Dependencies

```bash
cd backend
npm install
```

This installs:
- `@aws-sdk/client-s3` - AWS SDK for S3 operations
- `multer` - File upload middleware

## Step 7: Test the Upload

```bash
# Frontend
curl -F "image=@/path/to/image.jpg" \
     -F "issueId=123" \
     -F "uploadedByEmail=user@example.com" \
     http://localhost:5000/api/uploads/image
```

Expected response:
```json
{
  "message": "Image uploaded successfully",
  "attachment": {
    "attachmentId": "...",
    "fileName": "image.jpg",
    "url": "https://smart-campus-images.s3.us-east-1.amazonaws.com/issues/...",
    "storageProvider": "s3",
    "storageKey": "issues/...",
    "uploadedAt": "2026-04-12T..."
  },
  "imageUrl": "https://smart-campus-images.s3.us-east-1.amazonaws.com/issues/..."
}
```

## Available API Endpoints

### Upload Image
- **POST** `/api/uploads/image`
- Body: FormData with `image` file, `issueId`, `uploadedByEmail`
- Returns: Attachment object with S3 URL

### Get Issue Attachments
- **GET** `/api/uploads/issue/:issueId/attachments`
- Returns: Array of all attachments for issue

### Delete Attachment
- **DELETE** `/api/uploads/attachment/:attachmentId`
- Returns: Success message

## Frontend Usage

```javascript
import { uploadIssueImage, compressImage } from '@/utils/imageUpload';

// Upload image
const file = e.target.files[0];
const result = await uploadIssueImage(file, issueId, userEmail);
console.log('Image URL:', result.imageUrl);

// Optional: Compress before upload
const compressed = await compressImage(file, 1920, 1920, 0.8);
const result = await uploadIssueImage(compressed, issueId, userEmail);
```

## Troubleshooting

### "Access Denied" Error
- Check AWS credentials in .env
- Verify IAM user has `AmazonS3FullAccess` policy
- Check bucket permissions (should be public-read for images)

### Upload Fails with 413 Payload Too Large
- Increase express limit in server.js: `app.use(express.json({ limit: '50mb' }))`

### Images Don't Display
- Verify bucket is public (S3 bucket policy allows GetObject)
- Check image URL format: `https://BUCKET_NAME.s3.REGION.amazonaws.com/KEY`

### S3 Costs
- Free tier includes: 5GB storage, 20K GET requests/month
- Standard storage: ~$0.023 per GB/month
- Data transfer out: ~$0.09 per GB

## Security Best Practices

1. **Use IAM User, not root**: Create dedicated IAM user with S3-only permissions
2. **Rotate Access Keys**: Regenerate keys every 90 days
3. **Enable Versioning**: Go to bucket → **Versioning** → Enable (recover deleted files)
4. **Enable MFA Delete**: Additional protection for production
5. **Use presigned URLs**: For sensitive operations, use temporary URLs

## Next Steps

- Monitor S3 usage in AWS CloudWatch
- Set up S3 lifecycle policies to archive old images
- Consider Amazon CloudFront CDN for faster image delivery
- Implement image optimization (resize, format conversion)
