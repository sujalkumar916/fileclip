/**
 * src/api/clipApi.js
 * Centralised Axios-based API client for communicating with the FileClip backend.
 */
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

// ── Clip API ─────────────────────────────────────────────────────────────────

/**
 * Step 1: Request presigned PUT URLs from the backend.
 * @param {Array<{name:string, mimeType:string, size:number}>} files
 * @param {string} expiry  "1h" | "24h" | "3d" | "7d"
 */
export const requestPresignedUrls = async (files, expiry) => {
  const { data } = await api.post("/clips/presign", { files, expiry });
  return data; // { files: [{originalName, mimeType, size, s3Key, uploadUrl}], expiry }
};

/**
 * Step 2: Upload a single file directly to the storage backend.
 * - In S3/MinIO mode: PUT to presigned S3 URL with Content-Type header.
 * - In local mode:    PUT to backend /api/files/upload with raw body.
 * @param {string}   uploadUrl   Presigned/local upload URL
 * @param {File}     file        Browser File object
 * @param {string}   mimeType    Content-Type to send
 * @param {Function} onProgress  Progress callback (0–100)
 */
export const uploadFileToS3 = async (uploadUrl, file, mimeType, onProgress) => {
  await axios.put(uploadUrl, file, {
    headers: { "Content-Type": mimeType },
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) {
        onProgress(Math.round((evt.loaded * 100) / evt.total));
      }
    },
  });
};

/**
 * Step 3: Confirm upload completion → create clip record in MongoDB.
 * @param {Array<{originalName, mimeType, size, s3Key}>} files
 * @param {string} expiry
 */
export const createClip = async (files, expiry) => {
  const { data } = await api.post("/clips", { files, expiry });
  return data; // { code, shareUrl, expiresAt }
};

/**
 * Fetch clip metadata by code.
 * @param {string} code  6-character clip code
 */
export const getClip = async (code) => {
  const { data } = await api.get(`/clips/${code}`);
  return data; // { clip: { code, files, expiresAt, secondsLeft } }
};

/**
 * Get a presigned GET URL for a specific file.
 * @param {string} code
 * @param {string} fileId
 * @param {"inline"|"attachment"} disposition
 */
export const getPresignedGetUrl = async (code, fileId, disposition = "inline") => {
  const { data } = await api.get(`/clips/${code}/files/${fileId}/url`, {
    params: { disposition },
  });
  return data; // { url, expiresIn }
};

/**
 * Request an AI summary for a file.
 * @param {string} code
 * @param {string} fileId
 */
export const summariseFile = async (code, fileId) => {
  const { data } = await api.post(`/clips/${code}/files/${fileId}/summarise`);
  return data; // { summary }
};

