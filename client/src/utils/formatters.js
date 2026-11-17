/**
 * src/utils/formatters.js
 * Shared formatting helpers used across components.
 */

/**
 * Converts bytes to a human-readable string (KB, MB, GB).
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

/**
 * Converts a number of seconds into a human-readable "expires in" string.
 */
export const formatTimeLeft = (seconds) => {
  if (seconds <= 0) return "Expired";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) {
    const h = Math.floor(seconds / 3600);
    return `${h} hour${h > 1 ? "s" : ""}`;
  }
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  return h > 0 ? `${d}d ${h}h` : `${d} day${d > 1 ? "s" : ""}`;
};

/**
 * Maps an expiry key to its display label.
 */
export const EXPIRY_OPTIONS = [
  { value: "1h",  label: "1 Hour" },
  { value: "24h", label: "24 Hours" },
  { value: "3d",  label: "3 Days" },
  { value: "7d",  label: "7 Days" },
];

/**
 * Returns a colour class for a progress bar based on percentage.
 */
export const progressColour = (pct) => {
  if (pct < 40) return "bg-blue-500";
  if (pct < 80) return "bg-indigo-500";
  return "bg-green-500";
};

