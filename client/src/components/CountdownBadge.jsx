/**
 * src/components/CountdownBadge.jsx
 * Displays a live countdown to file expiry.
 */
import React, { useEffect, useState } from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { formatTimeLeft } from "../utils/formatters";

const CountdownBadge = ({ expiresAt }) => {
  const [secondsLeft, setSecondsLeft] = useState(
    Math.max(0, Math.floor((new Date(expiresAt) - Date.now()) / 1000))
  );

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  const isUrgent = secondsLeft < 3600; // < 1 hour remaining

  if (secondsLeft <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 rounded-full px-3 py-1">
        <AlertTriangle size={12} />
        Expired
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-3 py-1 border ${
        isUrgent
          ? "text-orange-400 bg-orange-500/10 border-orange-500/20"
          : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
      }`}
    >
      <Clock size={12} />
      Expires in {formatTimeLeft(secondsLeft)}
    </span>
  );
};

export default CountdownBadge;

