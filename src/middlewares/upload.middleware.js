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

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const tempDir = path.join(__dirname, '../../uploads/temp');
      console.log(`Creating temp directory at ${tempDir}`);
      await fs.mkdir(tempDir, { recursive: true });
      cb(null, tempDir);
    } catch (err) {
      console.error('Error creating temp directory:', err);
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const timestampedFilename = `${Date.now()}-${file.originalname}`;
    console.log(`Saving file as ${timestampedFilename}`);
    cb(null, timestampedFilename);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    'transcript': ['application/pdf', 'image/jpeg', 'image/png'],
    'diploma': ['application/pdf', 'image/jpeg', 'image/png'],
    'cv': ['application/pdf'],
    'profilePicture': ['image/jpeg', 'image/png'],
    'receipt': ['application/pdf', 'image/jpeg', 'image/png'] // ➕ Added receipt support
  };
  const documentType = file.fieldname.split('_')[0];

  console.log(`Validating file: ${file.originalname} as type: ${documentType}`);

  if (!allowedTypes[documentType]) {
    return cb(new Error('Invalid document type'));
  }

  if (allowedTypes[documentType].includes(file.mimetype)) {
    return cb(null, true);
  }

  cb(new Error(`Invalid file type for ${documentType}. Allowed types: ${allowedTypes[documentType].join(', ')}`));
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

async function createThumbnail(filePath, documentType) {
  const fileExt = path.extname(filePath).toLowerCase();
  const baseName = path.basename(filePath, fileExt);
  const outputDir = path.dirname(filePath);
  const thumbnailPath = path.join(outputDir, `${baseName}-thumbnail.png`);

  try {
    console.log(`Creating thumbnail for ${filePath}`);
    if (fileExt === '.pdf') {
      const command = `pdftoppm -png -f 1 -singlefile "${filePath}" "${path.join(outputDir, baseName)}-thumbnail"`;
      console.log(`Executing command: ${command}`);
      await new Promise((resolve, reject) => {
        exec(command, (error) => {
          if (error) {
            console.error(`pdftoppm error:`, error);
            return reject(error);
          }
          resolve();
        });
      });
    } else {
      const dimensions = {
        profilePicture: { width: 150, height: 150 },
        transcript: { width: 300, height: 400 },
        diploma: { width: 300, height: 400 },
        cv: { width: 300, height: 400 },
        receipt: { width: 300, height: 400 } // ➕ Added receipt dimensions
      };
      const { width, height } = dimensions[documentType] || dimensions.transcript;
      console.log(`Resizing image to ${width}x${height}`);
      await sharp(filePath)
        .resize(width, height)
        .toFile(thumbnailPath);
    }
    return path.basename(thumbnailPath);
  } catch (error) {
    console.error('Thumbnail creation error:', error);
    return null;
  }
}

async function moveFile(tempPath, finalPath) {
  console.log(`Moving file from ${tempPath} to ${finalPath}`);
  await fs.mkdir(path.dirname(finalPath), { recursive: true });
  await fs.rename(tempPath, finalPath);
  return finalPath;
}

async function cleanupFiles(files) {
  for (const file of files) {
    try {
      if (file.path) {
        console.log(`Deleting temp file: ${file.path}`);
        await fs.unlink(file.path);
      }
      if (file.thumbnailPath) {
        console.log(`Deleting temp thumbnail: ${file.thumbnailPath}`);
        await fs.unlink(file.thumbnailPath);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

async function processUploadedFiles(files, userId) {
  const processedFiles = [];
  const filesToCleanup = [];

  console.log('Processing uploaded files...');
  try {
    for (const [fieldname, fileArray] of Object.entries(files)) {
      for (const file of fileArray) {
        const documentType = fieldname.split('_')[0];
        const finalDir = path.join(__dirname, `../../uploads/${userId}/${documentType}s`);
        console.log(`Processing file: ${file.originalname} for ${documentType}`);

        const thumbnailFilename = await createThumbnail(file.path, documentType);
        const thumbnailPath = thumbnailFilename
          ? path.join(path.dirname(file.path), thumbnailFilename)
          : null;

        const finalPath = await moveFile(file.path, path.join(finalDir, file.filename));
        const finalThumbnailPath = thumbnailPath
          ? await moveFile(thumbnailPath, path.join(finalDir, 'thumbnails', thumbnailFilename))
          : null;

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

    console.log('Finished processing files.');
    return processedFiles;
  } catch (error) {
    console.error('Error processing files:', error);
    await cleanupFiles(filesToCleanup);
    throw error;
  }
}

const uploadCandidateDocuments = () => {
  const fields = [
    { name: 'profilePicture', maxCount: 1 },
    { name: 'transcript', maxCount: 1 },
    { name: 'diploma', maxCount: 1 },
    { name: 'cv', maxCount: 1 },
    { name: 'receipt', maxCount: 1 } // ➕ Added this line
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
