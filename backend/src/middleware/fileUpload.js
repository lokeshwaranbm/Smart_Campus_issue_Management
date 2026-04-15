import multer from 'multer';

// Configure multer to store files in memory (we'll upload directly to S3)
const storage = multer.memoryStorage();

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

  const ext = file.originalname.toLowerCase().slice(-4);

  if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`), false);
  }
};

// Size limit: 10MB
const limits = {
  fileSize: 10 * 1024 * 1024,
};

export const upload = multer({
  storage,
  fileFilter,
  limits,
});

/**
 * Multer error handler middleware
 */
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({ message: 'File size exceeds 10MB limit' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: 'Only one file upload is allowed' });
    }
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  }

  if (err) {
    return res.status(400).json({ message: err.message || 'File upload failed' });
  }

  next();
};
