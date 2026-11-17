/**
 * src/models/Clip.js
 * Mongoose schema for a FileClip "clip" – a bundle of files
 * shared via a unique 6-character code.
 */
const mongoose = require("mongoose");

// ── Sub-schema: individual file metadata ─────────────────────────────────────
const FileSchema = new mongoose.Schema(
  {
    /** Original file name uploaded by the user */
    originalName: { type: String, required: true },

    /** MIME type (e.g. "application/pdf", "image/png") */
    mimeType: { type: String, required: true },

    /** File size in bytes */
    size: { type: Number, required: true },

    /** Full S3 object key (path inside bucket) */
    s3Key: { type: String, required: true },
  },
  { _id: true }
);

// ── Main Clip schema ──────────────────────────────────────────────────────────
const ClipSchema = new mongoose.Schema(
  {
    /** Unique 6-character alphanumeric share code (e.g. "MC9PQ1") */
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 6,
      maxlength: 6,
      index: true,
    },

    /** Array of file metadata objects */
    files: { type: [FileSchema], required: true },

    /**
     * Absolute expiry timestamp.
     * MongoDB TTL index on this field automatically removes expired documents.
     */
    expiresAt: { type: Date, required: true, index: { expires: 0 } },

    /** Total number of downloads across all files in this clip */
    downloadCount: { type: Number, default: 0 },
  },
  {
    timestamps: true, // adds createdAt / updatedAt
  }
);

module.exports = mongoose.model("Clip", ClipSchema);

