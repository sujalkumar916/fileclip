/**
 * src/components/SuccessModal.jsx
 * Shown after a successful upload — displays the clip code, share URL,
 * copy buttons, and a QR code.
 */
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Check, ExternalLink, QrCode, X } from "lucide-react";
import QRCode from "qrcode";

const SuccessModal = ({ code, shareUrl, expiresAt, onClose }) => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // ── Generate QR code onto the canvas ────────────────────────────────────────
  useEffect(() => {
    if (canvasRef.current && shareUrl) {
      QRCode.toCanvas(canvasRef.current, shareUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: "#ffffff",
          light: "#00000000", // transparent background
        },
      });
    }
  }, [shareUrl]);

  // ── Copy helpers ─────────────────────────────────────────────────────────────
  const copy = async (text, setCopied) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const expiryLabel = expiresAt
    ? new Date(expiresAt).toLocaleString()
    : "soon";

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass-card w-full max-w-md p-6 space-y-6 relative animate-in fade-in zoom-in duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="text-center space-y-1">
          <div className="text-4xl">🎉</div>
          <h2 className="text-2xl font-bold text-white">Files Shared!</h2>
          <p className="text-sm text-gray-400">
            Share your clip code or URL. Files expire{" "}
            <span className="text-violet-400">{expiryLabel}</span>.
          </p>
        </div>

        {/* Clip code */}
        <div className="text-center space-y-1">
          <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">
            Your Clip Code
          </p>
          <div className="flex items-center justify-center gap-3">
            <span className="clip-code text-5xl font-extrabold text-violet-400 tracking-[0.4em]">
              {code}
            </span>
            <button
              onClick={() => copy(code, setCopiedCode)}
              className="p-2 rounded-xl bg-white/5 hover:bg-violet-500/20 border border-white/10 hover:border-violet-500/40 transition-all"
              aria-label="Copy code"
            >
              {copiedCode ? (
                <Check size={18} className="text-green-400" />
              ) : (
                <Copy size={18} className="text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* QR Code */}
        <div className="flex justify-center">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <canvas ref={canvasRef} className="block" />
            <p className="text-xs text-center text-gray-500 mt-1 flex items-center justify-center gap-1">
              <QrCode size={12} /> Scan to open on another device
            </p>
          </div>
        </div>

        {/* Share URL */}
        <div className="flex items-center gap-2 bg-black/30 rounded-xl border border-white/10 px-3 py-2">
          <span className="text-xs text-gray-400 truncate flex-1">{shareUrl}</span>
          <button
            onClick={() => copy(shareUrl, setCopiedUrl)}
            className="shrink-0 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Copy URL"
          >
            {copiedUrl ? (
              <Check size={15} className="text-green-400" />
            ) : (
              <Copy size={15} className="text-gray-400" />
            )}
          </button>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate(`/clip/${code}`)}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-colors"
          >
            <ExternalLink size={15} />
            View Files
          </button>
          <button
            onClick={onClose}
            className="py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-semibold text-sm transition-colors"
          >
            Upload More
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;

