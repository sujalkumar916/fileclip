/**
 * src/routes/clipRoutes.js
 * All clip-related API routes mounted under /api/clips
 */
const express = require("express");
const rateLimit = require("express-rate-limit");
const {
  requestPresignedUrls,
  createClip,
  getClip,
  getPresignedGetUrl,
  summariseFileHandler,
} = require("../controllers/clipController");

const router = express.Router();

// ── Rate limiters ─────────────────────────────────────────────────────────────

/** Limit upload initiation: 30 new clips per IP per hour */
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: { success: false, error: "Too many upload requests. Try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Limit summarise calls: 20 per IP per 15 minutes (Gemini API cost control) */
const summariseLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, error: "Too many summarise requests. Try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Routes ────────────────────────────────────────────────────────────────────

// Step 1: Client requests presigned PUT URLs before uploading
router.post("/presign", uploadLimiter, requestPresignedUrls);

// Step 2: Client confirms all files are uploaded → create clip record
router.post("/", uploadLimiter, createClip);

// Retrieve clip metadata by code
router.get("/:code", getClip);

// Get a presigned GET URL for viewing or downloading a specific file
router.get("/:code/files/:fileId/url", getPresignedGetUrl);

// AI summarisation of a specific file
router.post("/:code/files/:fileId/summarise", summariseLimiter, summariseFileHandler);

module.exports = router;

