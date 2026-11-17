/**
 * src/components/FileCard.jsx
 * A card for a single file on the Retrieve/View page.
 * Shows file info and provides View, Download, and Summarise actions.
 */
import React, { useState } from "react";
import {
  Eye, Download, Sparkles, FileText, Image, Film,
  FileArchive, File, Loader2, ChevronDown, ChevronUp, X
} from "lucide-react";
import { formatFileSize } from "../utils/formatters";
import { getPresignedGetUrl, summariseFile } from "../api/clipApi";

/** Returns a coloured icon based on MIME type */
const FileTypeIcon = ({ mimeType, size = 22 }) => {
  if (mimeType?.startsWith("image/")) return <Image size={size} className="text-blue-400" />;
  if (mimeType?.startsWith("video/")) return <Film size={size} className="text-purple-400" />;
  if (mimeType === "application/pdf" || mimeType?.startsWith("text/"))
    return <FileText size={size} className="text-orange-400" />;
  if (mimeType?.includes("zip") || mimeType?.includes("tar"))
    return <FileArchive size={size} className="text-yellow-400" />;
  return <File size={size} className="text-gray-400" />;
};

/** Checks if a file can be summarised by Gemini */
const isSummarisable = (mimeType) => {
  const supported = [
    "application/pdf", "text/plain", "text/markdown",
    "text/html", "text/csv", "application/json",
  ];
  return supported.includes(mimeType?.split(";")[0].trim());
};

const FileCard = ({ clipCode, file }) => {
  const [loading, setLoading] = useState(null); // "view" | "download" | "summarise" | null
  const [summary, setSummary] = useState(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [error, setError] = useState("");

  const handleAction = async (disposition) => {
    setLoading(disposition === "inline" ? "view" : "download");
    setError("");
    try {
      const { url } = await getPresignedGetUrl(clipCode, file.id, disposition);
      const link = document.createElement("a");
      link.href = url;
      if (disposition === "attachment") {
        link.download = file.originalName;
      } else {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      }
      link.click();
    } catch {
      setError("Failed to get file URL. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const handleSummarise = async () => {
    setLoading("summarise");
    setError("");
    setSummary(null);
    try {
      const { summary: text } = await summariseFile(clipCode, file.id);
      setSummary(text);
      setSummaryOpen(true);
    } catch (err) {
      setError(err.response?.data?.error || "Summarisation failed. Check the file type.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="glass-card p-5 space-y-4 hover:border-white/20 transition-colors">
      {/* File info row */}
      <div className="flex items-start gap-4">
        <div className="p-2.5 bg-white/5 rounded-xl shrink-0">
          <FileTypeIcon mimeType={file.mimeType} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white truncate" title={file.originalName}>
            {file.originalName}
          </p>
          <p className="text-sm text-gray-500 mt-0.5">
            {formatFileSize(file.size)} · {file.mimeType}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          <X size={12} />
          {error}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {/* View */}
        <button
          onClick={() => handleAction("inline")}
          disabled={!!loading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 text-sm font-medium transition-colors disabled:opacity-50"
        >
          {loading === "view" ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Eye size={14} />
          )}
          View
        </button>

        {/* Download */}
        <button
          onClick={() => handleAction("attachment")}
          disabled={!!loading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-400 text-sm font-medium transition-colors disabled:opacity-50"
        >
          {loading === "download" ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Download size={14} />
          )}
          Download
        </button>

        {/* Summarise — only for supported file types */}
        {isSummarisable(file.mimeType) && (
          <button
            onClick={handleSummarise}
            disabled={!!loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-400 text-sm font-medium transition-colors disabled:opacity-50 ml-auto"
          >
            {loading === "summarise" ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Sparkles size={14} />
            )}
            AI Summary
          </button>
        )}
      </div>

      {/* AI Summary panel */}
      {summary && (
        <div className="border border-violet-500/20 bg-violet-500/5 rounded-xl overflow-hidden">
          <button
            onClick={() => setSummaryOpen((o) => !o)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-violet-300 hover:bg-violet-500/10 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Sparkles size={14} />
              AI Summary
            </span>
            {summaryOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {summaryOpen && (
            <div className="px-4 pb-4 text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
              {summary}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileCard;

