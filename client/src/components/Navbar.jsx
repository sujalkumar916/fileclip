/**
 * src/components/Navbar.jsx
 * Top navigation bar — minimal, dark-themed.
 */
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Paperclip, Upload, Download } from "lucide-react";

const Navbar = () => {
  const location = useLocation();
  const isRetrieve = location.pathname.startsWith("/retrieve") || location.pathname.startsWith("/clip");

  return (
    <nav className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-4xl flex items-center justify-between h-16">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 text-white font-bold text-xl hover:text-violet-400 transition-colors"
        >
          <div className="p-1.5 bg-violet-600 rounded-lg">
            <Paperclip size={18} />
          </div>
          <span>
            File<span className="text-violet-400">Clip</span>
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            to="/"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              !isRetrieve
                ? "bg-violet-600/20 text-violet-300 border border-violet-500/30"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Upload size={15} />
            <span>Upload</span>
          </Link>

          <Link
            to="/retrieve"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isRetrieve
                ? "bg-violet-600/20 text-violet-300 border border-violet-500/30"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Download size={15} />
            <span>Retrieve Files</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

