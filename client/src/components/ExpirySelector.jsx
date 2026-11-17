/**
 * src/components/ExpirySelector.jsx
 * Segmented control for choosing file expiry duration.
 */
import React from "react";
import { Clock } from "lucide-react";
import { EXPIRY_OPTIONS } from "../utils/formatters";

const ExpirySelector = ({ value, onChange }) => (
  <div className="space-y-2">
    <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
      <Clock size={15} className="text-violet-400" />
      Files expire after
    </label>
    <div className="grid grid-cols-4 gap-2">
      {EXPIRY_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`
            py-2.5 px-3 rounded-xl text-sm font-semibold border transition-all duration-150
            ${value === opt.value
              ? "bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/25"
              : "bg-white/5 border-white/10 text-gray-400 hover:border-violet-500/50 hover:text-white"
            }
          `}
        >
          {opt.label}
        </button>
      ))}
    </div>
  </div>
);

export default ExpirySelector;

