/**
 * src/components/UploadProgress.jsx
 * Shows per-file upload progress bars during the S3 upload phase.
 */
import React from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { formatFileSize, progressColour } from "../utils/formatters";

const UploadProgress = ({ files, progress }) => (
  <div className="space-y-3">
    <p className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
      Uploading files…
    </p>
    {files.map((file, i) => {
      const pct = progress[i] ?? 0;
      const done = pct >= 100;

      return (
        <div key={i} className="glass-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white truncate flex-1 mr-2">{file.name}</span>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-gray-400">{formatFileSize(file.size)}</span>
              {done ? (
                <CheckCircle2 size={16} className="text-green-400" />
              ) : (
                <Loader2 size={16} className="text-violet-400 animate-spin" />
              )}
            </div>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${progressColour(pct)}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 text-right">
            {done ? "Complete" : `${pct}%`}
          </p>
        </div>
      );
    })}
  </div>
);

export default UploadProgress;

