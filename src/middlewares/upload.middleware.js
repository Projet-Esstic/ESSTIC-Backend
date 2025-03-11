import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Initializing multer setup...');

// Define storage configuration with relative paths
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    // Create relative paths from project root
    const baseDir = './uploads';
    const userDir = path.join(baseDir, req.body.user?.id || 'temp');
    const documentType = file.fieldname;
    const finalPath = path.join(userDir, documentType);

    try {
      // Create directories if they don't exist
      await fs.mkdir(finalPath, { recursive: true });
      cb(null, finalPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    'profileImage': ['image/jpeg', 'image/png'],
    'transcript': ['application/pdf', 'image/jpeg', 'image/png'],
    'diploma': ['application/pdf', 'image/jpeg', 'image/png'],
    'cv': ['application/pdf'],
    'receipt': ['application/pdf', 'image/jpeg', 'image/png']
  };

  // Debug logs
  console.log('File details:', {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype
  });

  // Use the fieldname directly without splitting
  const documentType = file.fieldname;

  console.log(`Validating file: ${file.originalname} as type: ${documentType}`);
  console.log('Allowed types:', allowedTypes);
  console.log('Document type exists:', !!allowedTypes[documentType]);

  if (!allowedTypes[documentType]) {
    console.error(`Invalid document type: ${documentType}`);
    return cb(new Error(`Invalid document type: ${documentType}`));
  }

  if (allowedTypes[documentType].includes(file.mimetype)) {
    console.log(`File type ${file.mimetype} is allowed for ${documentType}`);
    return cb(null, true);
  }

  console.error(`Invalid file type ${file.mimetype} for ${documentType}`);
  cb(new Error(`Invalid file type for ${documentType}. Allowed types: ${allowedTypes[documentType].join(', ')}`));
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Create thumbnail with relative path
async function createThumbnail(filePath, documentType) {
  if (!['profileImage', 'transcript', 'diploma', 'receipt'].includes(documentType)) {
    return null;
  }

  const thumbnailDir = path.join(path.dirname(filePath), 'thumbnails');
  await fs.mkdir(thumbnailDir, { recursive: true });

  const thumbnailPath = path.join(
    thumbnailDir,
    'thumb-' + path.basename(filePath)
  );

  await sharp(filePath)
    .resize(200, 200, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .toFile(thumbnailPath);

  return thumbnailPath;
}

async function moveFile(tempPath, finalPath) {
  console.log(`Moving file from ${tempPath} to ${finalPath}`);
  await fs.mkdir(path.dirname(finalPath), { recursive: true });
  await fs.rename(tempPath, finalPath);
  return finalPath;
}

// Process uploaded files with relative paths
async function processUploadedFiles(files, userId) {
  const processedFiles = [];

  for (const [documentType, fileArray] of Object.entries(files)) {
    for (const file of fileArray) {
      const thumbnailPath = await createThumbnail(file.path, documentType);
      
      processedFiles.push({
        documentType,
        path: path.relative('.', file.path), // Convert to relative path
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        uploadedAt: new Date(),
        thumbnailPath: thumbnailPath ? path.relative('.', thumbnailPath) : null // Convert to relative path
      });
    }
  }

  return processedFiles;
}

// Cleanup files using relative paths
async function cleanupFiles(files) {
  for (const file of files) {
    try {
      if (file.path) {
        await fs.unlink(file.path);
        
        // Try to remove thumbnail if it exists
        const thumbnailPath = path.join(
          path.dirname(file.path),
          'thumbnails',
          'thumb-' + path.basename(file.path)
        );
        await fs.unlink(thumbnailPath).catch(() => {}); // Ignore if thumbnail doesn't exist
      }
    } catch (error) {
      console.error(`Error cleaning up file ${file.path}:`, error);
    }
  }
}

const uploadCandidateDocuments = () => {
  const fields = [
    { name: 'profileImage', maxCount: 1 },
    { name: 'transcript', maxCount: 1 },
    { name: 'diploma', maxCount: 1 },
    { name: 'cv', maxCount: 1 },
    { name: 'receipt', maxCount: 1 }
  ];

  return async (req, res, next) => {
    console.log('Starting upload...');
    upload.fields(fields)(req, res, async (err) => {
      if (err) {
        console.error('Multer error:', err);
        return res.status(400).json({ status: 'error', message: err.message });
      }

      if (!req.files || Object.keys(req.files).length === 0) {
        console.log('No files uploaded.');
        return next();
      }

      try {
        const userId = req.body.user?.id || 'temp';
        console.log(`Processing files for user: ${userId}`);
        req.processedFiles = await processUploadedFiles(req.files, userId);
        next();
      } catch (error) {
        console.error('Error after upload:', error);
        await cleanupFiles(
          Object.values(req.files).flat().map(file => ({ path: file.path }))
        );
        next(error);
      }
    });
  };
};

// Middleware for handling multiple document types
const uploadMultipleDocuments = (fieldConfig) => {
  // fieldConfig example:
  // [
  //   { name: 'documents', maxCount: 5 },
  //   { name: 'images', maxCount: 3 }
  // ]

  return async (req, res, next) => {
    upload.fields(fieldConfig)(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ 
          status: 'error',
          message: err.message 
        });
      }

      try {
        if (!req.files || Object.keys(req.files).length === 0) {
          return next();
        }

        // Group files by their document type
        const groupedFiles = {};
        for (const [files] of Object.entries(req.files)) {
          for (const file of files) {
            const documentType = file.originalname.split('_')[0]; // Get type from filename prefix
            if (!groupedFiles[documentType]) {
              groupedFiles[documentType] = [];
            }
            groupedFiles[documentType].push(file);
          }
        }

        // Process each group of files
        const userId = req.body.user?.id || 'temp';
        const processedGroups = {};

        for (const [documentType, files] of Object.entries(groupedFiles)) {
          const finalDir = path.join(__dirname, `../../uploads/${userId}/${documentType}s`);
          const processedFiles = [];

          for (const file of files) {
            // Create thumbnail
            const thumbnailFilename = await createThumbnail(file.path, documentType);
            const thumbnailPath = thumbnailFilename ? 
              path.join(path.dirname(file.path), thumbnailFilename) : null;

            // Move files to final destination
            const finalPath = await moveFile(file.path, path.join(finalDir, file.filename));
            const finalThumbnailPath = thumbnailPath ? 
              await moveFile(thumbnailPath, path.join(finalDir, 'thumbnails', thumbnailFilename)) : null;

            processedFiles.push({
              documentType,
              originalName: file.originalname,
              filename: file.filename,
              path: finalPath,
              thumbnailPath: finalThumbnailPath,
              mimeType: file.mimetype,
              size: file.size,
              uploadedAt: new Date()
            });
          }

          processedGroups[documentType] = processedFiles;
        }

        req.processedFiles = processedGroups;
        next();
      } catch (error) {
        // Cleanup on error
        if (req.files) {
          const filesToCleanup = Object.values(req.files)
            .flat()
            .map(file => ({ path: file.path }));
          await cleanupFiles(filesToCleanup);
        }
        next(error);
      }
    });
  };
};

export {
  uploadCandidateDocuments,
  cleanupFiles
};
