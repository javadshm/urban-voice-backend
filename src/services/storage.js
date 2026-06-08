const AWS = require('aws-sdk');
const fs = require('fs/promises');
const path = require('path');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const shouldUseS3 = () => {
  return Boolean(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_REGION &&
    process.env.AWS_S3_BUCKET
  );
};

const saveLocally = async (fileBuffer, fileName) => {
  const uploadsRoot = path.join(process.cwd(), 'uploads');
  const safeFileName = sanitizeFileName(fileName);
  const rootPath = path.resolve(uploadsRoot);
  const destination = path.resolve(rootPath, safeFileName);

  if (!destination.startsWith(`${rootPath}${path.sep}`)) {
    throw new Error('Invalid file path');
  }

  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, fileBuffer);
  return `/uploads/${safeFileName}`;
};

const sanitizeFileName = (fileName) => {
  return String(fileName || '')
    .replace(/\\/g, '/')
    .split('/')
    .filter(Boolean)
    .map((segment) => segment.replace(/[^a-zA-Z0-9._-]/g, '_'))
    .join('/');
};

const uploadToS3 = async (fileBuffer, fileName) => {
  if (!shouldUseS3()) {
    return saveLocally(fileBuffer, fileName);
  }

  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: fileName,
    Body: fileBuffer,
    ContentType: 'audio/wav' // Adjust based on file type
  };

  try {
    const result = await s3.upload(params).promise();
    return result.Location; // Returns S3 URL
  } catch (error) {
    console.error('S3 upload error:', error);
    throw new Error('File upload failed');
  }
};

const getFromS3 = async (fileName) => {
  if (!shouldUseS3()) {
    const localPath = path.resolve(process.cwd(), 'uploads', sanitizeFileName(fileName));
    return fs.readFile(localPath);
  }

  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: fileName
  };

  try {
    const result = await s3.getObject(params).promise();
    return result.Body;
  } catch (error) {
    console.error('S3 download error:', error);
    throw new Error('File download failed');
  }
};

module.exports = { uploadToS3, getFromS3 };
