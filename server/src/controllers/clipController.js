/**
 * src/controllers/clipController.js
 * All business logic for clip operations:
 *  - requestPresignedUrls  → POST /api/clips/presign
 *  - createClip            → POST /api/clips
 *  - getClip               → GET  /api/clips/:code
 *  - getPresignedGetUrl    → GET  /api/clips/:code/files/:fileId/url
 *  - summariseFile         → POST /api/clips/:code/files/:fileId/summarise
 */
const { nanoid } = require("nanoid");
const Clip = require("../models/Clip");
const { generatePresignedPutUrl, generatePresignedGetUrl } = require("../services/s3Service");
const { summariseFile } = require("../services/geminiService");
const { asyncHandler } = require("../middleware/errorHandler");

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Generates a unique 6-character uppercase alphanumeric code. */
const generateClipCode = () => nanoid(6).toUpperCase();

/** Maps user-selected expiry label to milliseconds. */
const EXPIRY_MAP = {
  "1h":  1 * 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "3d":  3 * 24 * 60 * 60 * 1000,
  "7d":  7 * 24 * 60 * 60 * 1000,
};

// ── Controller: Request Presigned PUT URLs ────────────────────────────────────
/**
 * POST /api/clips/presign
 * Body: { files: [{ name, mimeType, size }], expiry: "1h"|"24h"|"3d"|"7d" }
 * Returns presigned PUT URLs + the S3 keys so the client can upload directly.
 */
const requestPresignedUrls = asyncHandler(async (req, res) => {
  const { files, expiry } = req.body;

  // Validate expiry
  if (!EXPIRY_MAP[expiry]) {
    return res.status(400).json({
      success: false,
      error: `Invalid expiry. Choose one of: ${Object.keys(EXPIRY_MAP).join(", ")}`,
    });
  }

  // Validate files array
  if (!Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ success: false, error: "No files provided." });
  }
  if (files.length > 15) {
    return res.status(400).json({ success: false, error: "Maximum 15 files per clip." });
  }

  const MAX_SIZE = 100 * 1024 * 1024; // 100 MB
  for (const file of files) {
    if (!file.name || !file.mimeType) {
      return res.status(400).json({ success: false, error: "Each file must have a name and mimeType." });
    }
    if (file.size > MAX_SIZE) {
      return res.status(400).json({
        success: false,
        error: `File "${file.name}" exceeds the 100 MB limit.`,
      });
    }
  }

  // Generate presigned PUT URLs (valid for 15 minutes each)
  const presignedFiles = await Promise.all(
    files.map(async (file) => {
      // Build an S3 key scoped to a temporary "pending/" prefix
      const ext = file.name.includes(".") ? file.name.split(".").pop() : "";
      const s3Key = `clips/pending/${nanoid(16)}${ext ? "." + ext : ""}`;
      const uploadUrl = await generatePresignedPutUrl(s3Key, file.mimeType, 900, req);

      return {
        originalName: file.name,
        mimeType: file.mimeType,
        size: file.size,
        s3Key,
        uploadUrl,
      };
    })
  );

  res.json({ success: true, files: presignedFiles, expiry });
});

// ── Controller: Confirm Upload & Create Clip ──────────────────────────────────
/**
 * POST /api/clips
 * Body: { files: [{ originalName, mimeType, size, s3Key }], expiry }
 * Called AFTER the client has finished uploading all files to S3.
 * Creates the Clip record in MongoDB and returns the generated code.
 */
const createClip = asyncHandler(async (req, res) => {
  const { files, expiry } = req.body;

  if (!EXPIRY_MAP[expiry]) {
    return res.status(400).json({ success: false, error: "Invalid expiry." });
  }
  if (!Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ success: false, error: "No files provided." });
  }

  // Calculate absolute expiry timestamp
  const expiresAt = new Date(Date.now() + EXPIRY_MAP[expiry]);

  // Generate a unique clip code (retry on collision — extremely rare with nanoid)
  let code;
  let attempts = 0;
  do {
    code = generateClipCode();
    attempts++;
    if (attempts > 10) {
      throw new Error("Failed to generate unique clip code after 10 attempts.");
    }
  } while (await Clip.exists({ code }));

  // Move S3 files from "pending/" prefix to "clips/<code>/" for organisation
  // (We reuse the same key here for simplicity; renaming in S3 requires copy+delete)
  const clip = await Clip.create({
    code,
    files: files.map((f) => ({
      originalName: f.originalName,
      mimeType: f.mimeType,
      size: f.size,
      s3Key: f.s3Key,
    })),
    expiresAt,
  });

  const clientBase = (process.env.CLIENT_URL && process.env.CLIENT_URL !== "*")
    ? process.env.CLIENT_URL.split(",")[0].trim()
    : (req.headers.origin || "http://localhost:3000");

  const shareUrl = `${clientBase.replace(/\/$/, "")}/clip/${code}`;

  res.status(201).json({
    success: true,
    code: clip.code,
    shareUrl,
    expiresAt: clip.expiresAt,
  });
});

// ── Controller: Get Clip Metadata ─────────────────────────────────────────────
/**
 * GET /api/clips/:code
 * Returns clip metadata including file list (no URLs — those are fetched separately).
 */
const getClip = asyncHandler(async (req, res) => {
  const clip = await Clip.findOne({ code: req.params.code.toUpperCase() });

  if (!clip) {
    return res.status(404).json({ success: false, error: "Clip not found or expired." });
  }

  // Calculate remaining time
  const msLeft = clip.expiresAt.getTime() - Date.now();
  const secondsLeft = Math.max(0, Math.floor(msLeft / 1000));

  res.json({
    success: true,
    clip: {
      code: clip.code,
      expiresAt: clip.expiresAt,
      secondsLeft,
      downloadCount: clip.downloadCount,
      files: clip.files.map((f) => ({
        id: f._id,
        originalName: f.originalName,
        mimeType: f.mimeType,
        size: f.size,
      })),
    },
  });
});

// ── Controller: Get Presigned GET URL for a File ──────────────────────────────
/**
 * GET /api/clips/:code/files/:fileId/url?disposition=inline|attachment
 * Returns a short-lived presigned GET URL for viewing or downloading a file.
 */
const getPresignedGetUrl = asyncHandler(async (req, res) => {
  const { code, fileId } = req.params;
  const disposition = req.query.disposition === "attachment" ? "attachment" : "inline";

  const clip = await Clip.findOne({ code: code.toUpperCase() });
  if (!clip) {
    return res.status(404).json({ success: false, error: "Clip not found or expired." });
  }

  const file = clip.files.id(fileId);
  if (!file) {
    return res.status(404).json({ success: false, error: "File not found in this clip." });
  }

  // Presigned GET URL valid for 1 hour
  const url = await generatePresignedGetUrl(file.s3Key, disposition, file.originalName, 3600, req);

  // Increment download counter only for actual downloads
  if (disposition === "attachment") {
    await Clip.findByIdAndUpdate(clip._id, { $inc: { downloadCount: 1 } });
  }

  res.json({ success: true, url, expiresIn: 3600 });
});

// ── Controller: AI Summarise File ─────────────────────────────────────────────
/**
 * POST /api/clips/:code/files/:fileId/summarise
 * Reads the file from S3 and passes it to Gemini for summarisation.
 */
const summariseFileHandler = asyncHandler(async (req, res) => {
  const { code, fileId } = req.params;

  const clip = await Clip.findOne({ code: code.toUpperCase() });
  if (!clip) {
    return res.status(404).json({ success: false, error: "Clip not found or expired." });
  }

  const file = clip.files.id(fileId);
  if (!file) {
    return res.status(404).json({ success: false, error: "File not found in this clip." });
  }

  const summary = await summariseFile(file.s3Key, file.mimeType, file.originalName);

  res.json({ success: true, summary });
});

module.exports = {
  requestPresignedUrls,
  createClip,
  getClip,
  getPresignedGetUrl,
  summariseFileHandler,
};

