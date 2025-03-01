import multer from 'multer';
import path from 'path';
import { promises as fs } from 'fs';
import sharp from 'sharp';
import { exec } from 'child_process';

// Configure Multer to store files in a temp directory first
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const tempDir = path.join(__dirname, '../../uploads/temp');
    try {
      await fs.mkdir(tempDir, { recursive: true });
      cb(null, tempDir);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const originalFilename = file.originalname;
    const timestampedFilename = `${Date.now()}-${originalFilename}`;
    cb(null, timestampedFilename);
  }
});

// File filter for candidate documents
const fileFilter = (req, file, cb) => {
  // Define allowed file types based on document type
  const allowedTypes = {
    'transcript': ['application/pdf', 'image/jpeg', 'image/png'],
    'diploma': ['application/pdf', 'image/jpeg', 'image/png'],
    'cv': ['application/pdf'],
    'profilePicture': ['image/jpeg', 'image/png']
  };

  // Get document type from fieldname
  const documentType = file.fieldname.split('_')[0];
  
  if (!allowedTypes[documentType]) {
    return cb(new Error('Invalid document type'));
  }

  if (allowedTypes[documentType].includes(file.mimetype)) {
    return cb(null, true);
  }
  
  cb(new Error(`Invalid file type for ${documentType}. Allowed types: ${allowedTypes[documentType].join(', ')}`));
};

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: { 
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Function to create thumbnails for documents
async function createThumbnail(filePath, documentType) {
  const fileExt = path.extname(filePath).toLowerCase();
  const baseName = path.basename(filePath, fileExt);
  const outputDir = path.dirname(filePath);
  const thumbnailPath = path.join(outputDir, `${baseName}-thumbnail.png`);

  try {
    if (fileExt === '.pdf') {
      // For PDF files, convert first page to PNG
      const command = `pdftoppm -png -f 1 -singlefile "${filePath}" "${path.join(outputDir, baseName)}-thumbnail"`;
      await new Promise((resolve, reject) => {
        exec(command, (error ) => {
          if (error) {
            console.error(`Error executing pdftoppm: ${error}`);
            reject(error);
          }
          resolve();
        });
      });
    } else {
      // For images, create thumbnail with different sizes based on document type
      const dimensions = {
        profilePicture: { width: 150, height: 150 },
        transcript: { width: 300, height: 400 },
        diploma: { width: 300, height: 400 },
        cv: { width: 300, height: 400 }
      };

      const { width, height } = dimensions[documentType] || dimensions.transcript;

      await sharp(filePath)
        .resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true,
          position: 'center',
        })
        .toFile(thumbnailPath);
    }

    return path.basename(thumbnailPath);
  } catch (error) {
    console.error('Thumbnail creation error:', error);
    return null;
  }
}

// Helper function to move file to final destination
async function moveFile(tempPath, finalPath) {
  try {
    await fs.mkdir(path.dirname(finalPath), { recursive: true });
    await fs.rename(tempPath, finalPath);
    return finalPath;
  } catch (error) {
    throw new Error(`Error moving file: ${error.message}`);
  }
}

// Cleanup function for temporary files
async function cleanupFiles(files) {
  for (const file of files) {
    try {
      if (file.path) {
        await fs.access(file.path);
        await fs.unlink(file.path);
      }
      if (file.thumbnailPath) {
        await fs.access(file.thumbnailPath);
        await fs.unlink(file.thumbnailPath);
      }
    } catch (error) {
      console.error(`Error cleaning up file: ${error.message}`);
    }
  }
}

// Process uploaded files
async function processUploadedFiles(files, userId) {
  const processedFiles = [];
  const filesToCleanup = [];

  try {
    for (const [fieldname, fileArray] of Object.entries(files)) {
      for (const file of fileArray) {
        const documentType = fieldname.split('_')[0];
        const finalDir = path.join(__dirname, `../../uploads/${userId}/${documentType}s`);
        
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

        filesToCleanup.push({ path: file.path, thumbnailPath });
      }
    }

    return processedFiles;
  } catch (error) {
    await cleanupFiles(filesToCleanup);
    throw error;
  }
}

// Middleware for handling candidate document uploads
const uploadCandidateDocuments = () => {
  const fields = [
    { name: 'profilePicture', maxCount: 1 },
    { name: 'transcript', maxCount: 1 },
    { name: 'diploma', maxCount: 1 },
    { name: 'cv', maxCount: 1 }
  ];

  return async (req, res, next) => {
    upload.fields(fields)(req, res, async (err) => {
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

        // Process files with user ID (assuming it's available in the request)
        const userId = req.body.user?.id || 'temp';
        req.processedFiles = await processUploadedFiles(req.files, userId);
        next();
      } catch (error) {
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
  uploadMultipleDocuments,
  cleanupFiles
};
