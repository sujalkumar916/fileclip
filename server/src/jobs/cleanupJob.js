/**
 * src/jobs/cleanupJob.js
 * node-cron job that runs every 10 minutes to:
 *  1. Find all Clip documents whose expiresAt <= now.
 *  2. Delete every associated S3 object.
 *  3. Remove the MongoDB documents.
 *
 * NOTE: MongoDB's TTL index already handles document removal automatically,
 * but it can lag by up to 60 seconds. This cron job ensures S3 objects are
 * also cleaned up promptly and gives us explicit control over the process.
 */
const cron = require("node-cron");
const Clip = require("../models/Clip");
const { deleteObject } = require("../services/s3Service");

/**
 * Core cleanup logic — can also be invoked on-demand.
 */
const runCleanup = async () => {
  try {
    const now = new Date();

    // Find all expired clips
    const expiredClips = await Clip.find({ expiresAt: { $lte: now } });

    if (expiredClips.length === 0) {
      console.log(`[Cleanup] No expired clips found at ${now.toISOString()}`);
      return;
    }

    console.log(
      `[Cleanup] Found ${expiredClips.length} expired clip(s). Cleaning up…`
    );

    // Delete each file from S3 and then the DB record
    const deletePromises = expiredClips.map(async (clip) => {
      try {
        // Delete all S3 objects for this clip in parallel
        await Promise.all(
          clip.files.map((file) => deleteObject(file.s3Key))
        );

        await Clip.findByIdAndDelete(clip._id);

        console.log(
          `[Cleanup] ✅ Deleted clip "${clip.code}" (${clip.files.length} file(s))`
        );
      } catch (err) {
        // Log per-clip errors without stopping the rest of the cleanup
        console.error(
          `[Cleanup] ❌ Failed to fully clean clip "${clip.code}": ${err.message}`
        );
      }
    });

    await Promise.all(deletePromises);
    console.log(`[Cleanup] Cleanup round complete.`);
  } catch (err) {
    console.error(`[Cleanup] Fatal error during cleanup: ${err.message}`);
  }
};

/**
 * Registers the cron schedule.
 * Call this once at application startup.
 */
const startCleanupJob = () => {
  // Run every 10 minutes: "*/10 * * * *"
  cron.schedule("*/10 * * * *", runCleanup, {
    name: "fileclip-cleanup",
    timezone: "UTC",
  });

  console.log("🕐 Cleanup cron job registered (every 10 minutes).");

  // Also run once immediately on startup to clean any clips that expired
  // while the server was offline
  runCleanup();
};

module.exports = { startCleanupJob, runCleanup };

