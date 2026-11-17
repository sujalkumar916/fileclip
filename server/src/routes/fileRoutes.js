/**
 * src/routes/fileRoutes.js
 * Local filesystem upload/serve endpoints — only used in LOCAL_STORAGE mode.
 * These act as the "S3" layer when no S3/MinIO is available.
 */
const express = require("express");
const router = express.Router();
const { saveFile, validateToken } = require("../services/localStorageService");
const path = require("path");
const fs = require("fs");

const UPLOADS_DIR = path.join(__dirname, "../../uploads");

// ── Upload endpoint (replaces S3 PUT) ────────────────────────────────────────
router.put("/upload", express.raw({ type: "*/*", limit: "110mb" }), (req, res) => {
  const { token } = req.query;
  const data = validateToken(token);

  if (!data || data.type !== "put") {
    return res.status(401).json({ error: "Invalid or expired upload token." });
  }

  try {
    saveFile(data.key, req.body);
    res.status(200).send("OK");
  } catch (err) {
    console.error("[LocalStorage] Upload error:", err.message);
    res.status(500).json({ error: "File save failed." });
  }
});

// ── Serve endpoint (replaces S3 GET) ─────────────────────────────────────────
router.get("/serve", (req, res) => {
  const { token } = req.query;
  const data = validateToken(token);

  if (!data || data.type !== "get") {
    return res.status(401).json({ error: "Invalid or expired file token." });
  }

  const filePath = path.join(UPLOADS_DIR, data.key.replace(/\//g, path.sep));

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found." });
  }

  if (data.disposition === "attachment" && data.originalName) {
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(data.originalName)}"`
    );
  } else {
    res.setHeader("Content-Disposition", "inline");
  }

  res.sendFile(filePath);
});

module.exports = router;
