/**
 * src/pages/NotFoundPage.jsx
 * 404 fallback page.
 */
import React from "react";
import { Link } from "react-router-dom";
import { Home, AlertCircle } from "lucide-react";

const NotFoundPage = () => (
  <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
    <div className="p-5 bg-red-500/10 rounded-full">
      <AlertCircle size={48} className="text-red-400" />
    </div>
    <div>
      <h1 className="text-5xl font-extrabold text-white">404</h1>
      <p className="text-gray-400 text-lg mt-2">Page not found.</p>
    </div>
    <Link
      to="/"
      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-colors"
    >
      <Home size={18} />
      Back to Home
    </Link>
  </div>
);

export default NotFoundPage;

