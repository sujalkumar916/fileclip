/**
 * src/components/DropZone.jsx
 * Drag-and-drop / click-to-browse file picker.
 * Accepts up to 15 files, max 100 MB each.
 */
import React, { useRef, useState, useCallback } from "react";
import { UploadCloud, X, FileText, Image, Film, FileArchive, File } from "lucide-react";
import { formatFileSize } from "../utils/formatters";

const MAX_FILES = 15;
const MAX_SIZE = 100 * 1024 * 1024; // 100 MB

/** Returns an icon component that fits the file's MIME type. */
const FileIcon = ({ mimeType }) => {
  if (mimeType.startsWith("image/")) return <Image size={18} className="text-blue-400" />;
  if (mimeType.startsWith("video/")) return <Film size={18} className="text-purple-400" />;
  if (mimeType === "application/pdf" || mimeType.startsWith("text/"))
    return <FileText size={18} className="text-orange-400" />;
  if (mimeType.includes("zip") || mimeType.includes("tar") || mimeType.includes("gz"))
    return <FileArchive size={18} className="text-yellow-400" />;
  return <File size={18} className="text-gray-400" />;
};

const DropZone = ({ files, setFiles }) => {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  /** Validates and de-duplicates incoming files, then merges with existing. */
  const addFiles = useCallback(
    (incoming) => {
      setError("");
      const valid = [];

      for (const f of incoming) {
        if (files.length + valid.length >= MAX_FILES) {
          setError(`Maximum ${MAX_FILES} files allowed.`);
          break;
        }
        if (f.size > MAX_SIZE) {
          setError(`"${f.name}" exceeds the 100 MB limit and was skipped.`);
          continue;
        }
        // Skip duplicates by name+size
        const isDuplicate = files.some(
          (existing) => existing.name === f.name && existing.size === f.size
        );
        if (!isDuplicate) valid.push(f);
      }

      if (valid.length) setFiles((prev) => [...prev, ...valid]);
    },
    [files, setFiles]
  );

  // ── Drag handlers ────────────────────────────────────────────────────────────
  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);
  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  // ── Input change handler ──────────────────────────────────────────────────────
  const onInputChange = (e) => {
    addFiles(Array.from(e.target.files));
    e.target.value = ""; // Allow re-selecting same file
  };

  const removeFile = (index) =>
    setFiles((prev) => prev.filter((_, i) => i !== index));

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`
          relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer
          transition-all duration-200 group
          ${dragging
            ? "border-violet-500 bg-violet-500/10 scale-[1.01]"
            : "border-white/20 hover:border-violet-500/60 hover:bg-white/5"
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={onInputChange}
        />

        <div className="flex flex-col items-center gap-3 pointer-events-none">
          <div
            className={`p-4 rounded-full transition-colors ${
              dragging ? "bg-violet-500/20" : "bg-white/5 group-hover:bg-violet-500/10"
            }`}
          >
            <UploadCloud
              size={36}
              className={`transition-colors ${
                dragging ? "text-violet-400" : "text-gray-400 group-hover:text-violet-400"
              }`}
            />
          </div>
          <div>
            <p className="text-lg font-semibold text-white">
              {dragging ? "Drop files here" : "Drag & drop files here"}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              or{" "}
              <span className="text-violet-400 font-medium underline underline-offset-2">
                browse
              </span>{" "}
              to choose — up to {MAX_FILES} files, 100 MB each
            </p>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
          <X size={14} />
          {error}
        </div>
      )}

      {/* Selected files list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
            {files.length} file{files.length > 1 ? "s" : ""} selected
          </p>
          {files.map((file, i) => (
            <div
              key={i}
              className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 group"
            >
              <FileIcon mimeType={file.type} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{file.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-red-400 p-1 rounded-lg hover:bg-red-500/10"
                aria-label={`Remove ${file.name}`}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DropZone;

