/**
 * src/config/s3.js
 * AWS S3 / MinIO client configuration
 * Supports both AWS S3 (no endpoint) and MinIO (with endpoint).
 */
const { S3Client } = require("@aws-sdk/client-s3");

const s3Client = new S3Client({
  region: process.env.S3_REGION || "us-east-1",

  // Set endpoint for MinIO or any S3-compatible service.
  // For real AWS S3 leave S3_ENDPOINT blank/unset.
  ...(process.env.S3_ENDPOINT && {
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: true, // Required for MinIO
  }),

  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
});

module.exports = s3Client;

