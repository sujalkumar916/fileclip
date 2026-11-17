/**
 * src/services/s3Service.js
 * Storage abstraction layer.
 * - If STORAGE_MODE=local  → uses localStorageService (disk-based, no S3 needed)
 * - If STORAGE_MODE=s3     → uses AWS S3 / MinIO via presigned URLs
 *
 * Default: local (for easy development without S3/MinIO setup)
 */

const mode = (process.env.STORAGE_MODE || "local").toLowerCase();

let storageService;

if (mode === "s3") {
  // ── S3 / MinIO mode ─────────────────────────────────────────────────────────
  const {
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
  } = require("@aws-sdk/client-s3");
  const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
  const s3Client = require("../config/s3");
  const BUCKET = process.env.S3_BUCKET;

  storageService = {
    generatePresignedPutUrl: async (key, mimeType, expiresIn = 900) => {
      const command = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: mimeType });
      return getSignedUrl(s3Client, command, { expiresIn });
    },

    generatePresignedGetUrl: async (key, disposition = "inline", originalName = "", expiresIn = 3600) => {
      const responseContentDisposition =
        disposition === "attachment" && originalName
          ? `attachment; filename="${encodeURIComponent(originalName)}"`
          : "inline";
      const command = new GetObjectCommand({
        Bucket: BUCKET, Key: key, ResponseContentDisposition: responseContentDisposition,
      });
      return getSignedUrl(s3Client, command, { expiresIn });
    },

    deleteObject: async (key) => {
      const command = new DeleteObjectCommand({ Bucket: BUCKET, Key: key });
      await s3Client.send(command);
    },

    getObjectBuffer: async (key) => {
      const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
      const response = await s3Client.send(command);
      const chunks = [];
      for await (const chunk of response.Body) chunks.push(chunk);
      return Buffer.concat(chunks);
    },
  };

  console.log("📦 Storage mode: S3 / MinIO");
} else {
  // ── Local filesystem mode (default) ─────────────────────────────────────────
  storageService = require("./localStorageService");
  console.log("📁 Storage mode: Local filesystem (uploads/)");
}

module.exports = storageService;
