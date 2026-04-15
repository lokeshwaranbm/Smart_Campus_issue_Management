import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';

dotenv.config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'smart-campus-images';

/**
 * Upload file to S3
 * @param {Buffer} fileBuffer - File content
 * @param {string} fileName - Original file name
 * @param {string} mimeType - MIME type
 * @param {string} folder - S3 folder/prefix
 * @returns {Promise<{key: string, url: string}>}
 */
export const uploadToS3 = async (fileBuffer, fileName, mimeType, folder = 'issues') => {
  try {
    // Create unique key with timestamp and folder
    const timestamp = Date.now();
    const uniqueName = `${timestamp}-${fileName.replace(/\s+/g, '-')}`;
    const key = `${folder}/${uniqueName}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
      // Public read access to allow direct viewing
      ACL: 'public-read',
      // Cache images for 7 days
      CacheControl: 'max-age=604800',
      // Add metadata
      Metadata: {
        'uploaded-at': new Date().toISOString(),
      },
    });

    await s3Client.send(command);

    // Generate public URL
    const publicUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;

    return {
      key,
      url: publicUrl,
      bucket: BUCKET_NAME,
    };
  } catch (error) {
    console.error('S3 upload error:', error);
    throw new Error(`Failed to upload image to S3: ${error.message}`);
  }
};

/**
 * Generate presigned URL for temporary access (valid for 24 hours)
 * @param {string} key - S3 object key
 * @returns {Promise<string>}
 */
export const getPresignedUrl = async (key) => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    // URL valid for 24 hours
    const url = await getSignedUrl(s3Client, command, { expiresIn: 86400 });
    return url;
  } catch (error) {
    console.error('Presigned URL generation error:', error);
    throw new Error(`Failed to generate presigned URL: ${error.message}`);
  }
};

/**
 * Delete file from S3
 * @param {string} key - S3 object key
 * @returns {Promise<void>}
 */
export const deleteFromS3 = async (key) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    console.log(`Deleted S3 object: ${key}`);
  } catch (error) {
    console.error('S3 delete error:', error);
    throw new Error(`Failed to delete image from S3: ${error.message}`);
  }
};

export { s3Client, BUCKET_NAME };
