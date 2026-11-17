/**
 * src/services/localStorageService.js
 * Local filesystem storage — replaces S3/MinIO for development.
 * Files are stored in server/uploads/ and served via Express with signed tokens.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const UPLOADS_DIR = path.join(__dirname, "../../uploads");

// Ensure uploads dir exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// In-memory token store: { token: { key, disposition, originalName, expiresAt } }
const tokenStore = new Map();

// Clean expired tokens every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of tokenStore.entries()) {
    if (data.expiresAt < now) tokenStore.delete(token);
  }
}, 5 * 60 * 1000);

/**
 * Derives the public base URL of the backend.
 * Checks SERVER_URL, RENDER_EXTERNAL_URL, incoming request headers, or falls back to localhost.
 */
const getBaseUrl = (req) => {
  if (process.env.SERVER_URL && process.env.SERVER_URL.trim() !== "") {
    return process.env.SERVER_URL.replace(/\/$/, "");
  }
  if (process.env.RENDER_EXTERNAL_URL) {
    return process.env.RENDER_EXTERNAL_URL.replace(/\/$/, "");
  }
  if (req) {
    const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
    const host = req.get("host");
    return `${proto}://${host}`;
  }
  return `http://localhost:${process.env.PORT || 5000}`;
};

/**
 * "Presigned PUT" — returns a backend upload endpoint.
 */
const generatePresignedPutUrl = async (key, mimeType, expiresIn = 900, req = null) => {
  const token = crypto.randomBytes(32).toString("hex");
  tokenStore.set(token, {
    key,
    mimeType,
    type: "put",
    expiresAt: Date.now() + expiresIn * 1000,
  });
  const baseUrl = getBaseUrl(req);
  return `${baseUrl}/api/files/upload?token=${token}`;
};

/**
 * "Presigned GET" — returns a time-limited URL to serve the file.
 */
const generatePresignedGetUrl = async (
  key,
  disposition = "inline",
  originalName = "",
  expiresIn = 3600,
  req = null
) => {
  const token = crypto.randomBytes(32).toString("hex");
  tokenStore.set(token, {
    key,
    disposition,
    originalName,
    type: "get",
    expiresAt: Date.now() + expiresIn * 1000,
  });
  const baseUrl = getBaseUrl(req);
  return `${baseUrl}/api/files/serve?token=${token}`;
};

/**
 * Delete a file from disk.
 */
const deleteObject = async (key) => {
  const filePath = path.join(UPLOADS_DIR, key.replace(/\//g, path.sep));
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
};

/**
 * Read file into Buffer (for Gemini summarisation).
 */
const getObjectBuffer = async (key) => {
  const filePath = path.join(UPLOADS_DIR, key.replace(/\//g, path.sep));
  return fs.readFileSync(filePath);
};

/**
 * Save uploaded file buffer to disk.
 * Called by the /api/files/upload route.
 */
const saveFile = (key, buffer) => {
  const filePath = path.join(UPLOADS_DIR, key.replace(/\//g, path.sep));
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, buffer);
};

/**
 * Validate a token and return its metadata.
 */
const validateToken = (token) => {
  const data = tokenStore.get(token);
  if (!data) return null;
  if (data.expiresAt < Date.now()) {
    tokenStore.delete(token);
    return null;
  }
  return data;
};

module.exports = {
  generatePresignedPutUrl,
  generatePresignedGetUrl,
  deleteObject,
  getObjectBuffer,
  saveFile,
  validateToken,
};
