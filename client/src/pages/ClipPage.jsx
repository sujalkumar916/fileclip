/**
 * src/pages/ClipPage.jsx
 * Retrieve & view files page — /clip/:code
 * Also serves as the "enter a clip code" page when accessed via /clip (no code),
 * or via a direct retrieval form on this same page.
 */
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Search, Loader2, AlertCircle, Download } from "lucide-react";
import FileCard from "../components/FileCard";
import CountdownBadge from "../components/CountdownBadge";
import { getClip } from "../api/clipApi";

// ── Code-entry form ───────────────────────────────────────────────────────────
const CodeEntryForm = ({ onSubmit, defaultValue = "" }) => {
  const [input, setInput] = useState(defaultValue.toUpperCase());

  const handleSubmit = (e) => {
    e.preventDefault();
    const clean = input.trim().toUpperCase();
    if (clean.length === 6) onSubmit(clean);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <input
        value={input}
        onChange={(e) =>
          setInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))
        }
        placeholder="Enter clip code…"
        maxLength={6}
        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 font-mono text-xl tracking-widest text-center uppercase focus:border-violet-500 outline-none transition-colors"
        autoFocus
        spellCheck={false}
      />
      <button
        type="submit"
        disabled={input.trim().length !== 6}
        className="px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
      >
        <Search size={18} />
        Retrieve
      </button>
    </form>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const ClipPage = () => {
  const { code } = useParams();
  const navigate = useNavigate();

  const [clip, setClip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /** Fetches clip metadata from the backend */
  const fetchClip = useCallback(async (clipCode) => {
    setLoading(true);
    setError("");
    setClip(null);
    try {
      const { clip: data } = await getClip(clipCode);
      setClip(data);
      // Update URL without re-mounting
      if (code !== clipCode) navigate(`/clip/${clipCode}`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || "Clip not found or expired.");
    } finally {
      setLoading(false);
    }
  }, [code, navigate]);

  // Auto-fetch if a code is in the URL
  useEffect(() => {
    if (code) fetchClip(code.toUpperCase());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  return (
    <div className="space-y-8">
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className="text-center space-y-2 pt-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
          Retrieve{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
            your files
          </span>
        </h1>
        <p className="text-gray-400">Enter a 6-character clip code to access shared files.</p>
      </div>

      {/* ── Code entry ────────────────────────────────────────────────────────── */}
      <div className="glass-card p-6">
        <CodeEntryForm
          onSubmit={fetchClip}
          defaultValue={code || ""}
        />
      </div>

      {/* ── Loading state ──────────────────────────────────────────────────────── */}
      {loading && (
        <div className="flex flex-col items-center gap-3 py-12">
          <Loader2 size={36} className="text-violet-400 animate-spin" />
          <p className="text-gray-400">Looking up clip…</p>
        </div>
      )}

      {/* ── Error state ───────────────────────────────────────────────────────── */}
      {error && !loading && (
        <div className="glass-card p-6 flex items-start gap-4 border-red-500/20">
          <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={22} />
          <div>
            <p className="font-semibold text-red-400">Clip Not Found</p>
            <p className="text-sm text-gray-400 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* ── Clip details & file cards ─────────────────────────────────────────── */}
      {clip && !loading && (
        <div className="space-y-5">
          {/* Clip header */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Clip Code</p>
              <p className="clip-code text-3xl font-extrabold text-violet-400 tracking-[0.4em]">
                {clip.code}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <CountdownBadge expiresAt={clip.expiresAt} />
              <p className="text-xs text-gray-600 flex items-center gap-1">
                <Download size={11} />
                {clip.downloadCount} download{clip.downloadCount !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* File list */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              {clip.files.length} file{clip.files.length > 1 ? "s" : ""} in this clip
            </p>
            {clip.files.map((file) => (
              <FileCard key={file.id} clipCode={clip.code} file={file} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClipPage;

