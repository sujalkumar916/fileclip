/**
 * src/pages/UploadPage.jsx
 * Home page — file picker, expiry selector, upload pipeline.
 *
 * Upload flow:
 *  1. User selects files + expiry → clicks Upload.
 *  2. POST /api/clips/presign  → get presigned PUT URLs from backend.
 *  3. PUT each file directly to S3 using its presigned URL (no server bandwidth).
 *  4. POST /api/clips          → confirm upload, create clip record.
 *  5. Show SuccessModal with clip code + QR code.
 */
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Zap, Lock, Search, ArrowRight } from "lucide-react";
import DropZone from "../components/DropZone";
import ExpirySelector from "../components/ExpirySelector";
import UploadProgress from "../components/UploadProgress";
import SuccessModal from "../components/SuccessModal";
import { requestPresignedUrls, uploadFileToS3, createClip } from "../api/clipApi";

// ── Upload phase constants ────────────────────────────────────────────────────
const PHASE = { IDLE: "idle", PRESIGNING: "presigning", UPLOADING: "uploading", DONE: "done" };

// ── Feature blurbs shown below the upload box ─────────────────────────────────
const FEATURES = [
  { icon: Lock,   title: "Private S3 Storage",  desc: "Files are never publicly accessible — only via signed, time-limited URLs." },
  { icon: Zap,    title: "Zero-Overhead Upload", desc: "Files go straight from your browser to S3. Server never touches the data." },
  { icon: Shield, title: "Auto-Purge",           desc: "Files and metadata are automatically deleted when they expire." },
];

const UploadPage = () => {
  const navigate = useNavigate();
  const [files, setFiles]       = useState([]);
  const [expiry, setExpiry]     = useState("24h");
  const [phase, setPhase]       = useState(PHASE.IDLE);
  const [progress, setProgress] = useState({});  // { [index]: 0-100 }
  const [error, setError]       = useState("");
  const [result, setResult]     = useState(null); // { code, shareUrl, expiresAt }
  const [retrieveCode, setRetrieveCode] = useState("");

  const handleRetrieveSubmit = (e) => {
    e.preventDefault();
    const clean = retrieveCode.trim().toUpperCase();
    if (clean.length === 6) {
      navigate(`/clip/${clean}`);
    }
  };

  const updateProgress = (index, pct) =>
    setProgress((prev) => ({ ...prev, [index]: pct }));

  const handleUpload = async () => {
    if (files.length === 0) {
      setError("Please select at least one file.");
      return;
    }
    setError("");
    setProgress({});

    try {
      // ── Step 1: Get presigned PUT URLs ───────────────────────────────────────
      setPhase(PHASE.PRESIGNING);
      const presignData = await requestPresignedUrls(
        files.map((f) => ({ name: f.name, mimeType: f.type || "application/octet-stream", size: f.size })),
        expiry
      );

      // ── Step 2: Upload each file to S3 ───────────────────────────────────────
      setPhase(PHASE.UPLOADING);
      await Promise.all(
        presignData.files.map((pf, i) =>
          uploadFileToS3(pf.uploadUrl, files[i], pf.mimeType, (pct) =>
            updateProgress(i, pct)
          )
        )
      );

      // ── Step 3: Confirm and create clip ──────────────────────────────────────
      const { code, shareUrl, expiresAt } = await createClip(
        presignData.files.map((pf) => ({
          originalName: pf.originalName,
          mimeType: pf.mimeType,
          size: pf.size,
          s3Key: pf.s3Key,
        })),
        expiry
      );

      setResult({ code, shareUrl, expiresAt });
      setPhase(PHASE.DONE);
    } catch (err) {
      setError(err.response?.data?.error || "Upload failed. Please try again.");
      setPhase(PHASE.IDLE);
    }
  };

  const resetForm = () => {
    setFiles([]);
    setExpiry("24h");
    setPhase(PHASE.IDLE);
    setProgress({});
    setError("");
    setResult(null);
  };

  const isUploading = phase === PHASE.PRESIGNING || phase === PHASE.UPLOADING;

  return (
    <div className="space-y-10">
      {/* ── Hero header ───────────────────────────────────────────────────────── */}
      <div className="text-center space-y-3 pt-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight">
          Share files{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
            instantly
          </span>
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
          No account needed. Drop your files, grab a 6-character code, share anywhere.
        </p>
      </div>

      {/* ── Upload card ───────────────────────────────────────────────────────── */}
      <div className="glass-card p-6 sm:p-8 space-y-6">
        {/* Show progress during upload, otherwise show the drop zone */}
        {isUploading ? (
          <UploadProgress files={files} progress={progress} />
        ) : (
          <>
            <DropZone files={files} setFiles={setFiles} />
            <ExpirySelector value={expiry} onChange={setExpiry} />
          </>
        )}

        {/* Global error */}
        {error && (
          <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* Upload button */}
        {!isUploading && (
          <button
            onClick={handleUpload}
            disabled={files.length === 0}
            className="w-full py-3.5 rounded-xl font-bold text-base bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white transition-all duration-200 shadow-lg shadow-violet-500/25 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {phase === PHASE.PRESIGNING
              ? "Preparing upload…"
              : `Upload ${files.length > 0 ? `${files.length} file${files.length > 1 ? "s" : ""}` : "files"}`}
          </button>
        )}
      </div>

      {/* ── Quick Retrieve Form ──────────────────────────────────────────────── */}
      {!isUploading && (
        <div className="glass-card p-6 border-dashed border-violet-500/30 bg-violet-950/20">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-base font-semibold text-white flex items-center gap-2">
                <Search size={18} className="text-violet-400" />
                Have a Clip Code?
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Enter your 6-character code to view and download shared files
              </p>
            </div>
            <form onSubmit={handleRetrieveSubmit} className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={retrieveCode}
                onChange={(e) =>
                  setRetrieveCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))
                }
                placeholder="e.g. MC9PQ1"
                maxLength={6}
                className="w-full sm:w-36 bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-center font-mono text-base tracking-widest text-violet-300 placeholder-gray-600 focus:border-violet-500 outline-none uppercase"
              />
              <button
                type="submit"
                disabled={retrieveCode.trim().length !== 6}
                className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-semibold text-sm text-white flex items-center gap-1.5 transition-all shrink-0"
              >
                Retrieve
                <ArrowRight size={15} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Feature blurbs ────────────────────────────────────────────────────── */}
      <div className="grid sm:grid-cols-3 gap-4">
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="glass-card p-5 space-y-2">
            <div className="p-2 w-fit rounded-lg bg-violet-500/10">
              <Icon size={18} className="text-violet-400" />
            </div>
            <p className="font-semibold text-white text-sm">{title}</p>
            <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {/* ── Success modal ─────────────────────────────────────────────────────── */}
      {phase === PHASE.DONE && result && (
        <SuccessModal
          code={result.code}
          shareUrl={result.shareUrl}
          expiresAt={result.expiresAt}
          onClose={resetForm}
        />
      )}
    </div>
  );
};

export default UploadPage;

