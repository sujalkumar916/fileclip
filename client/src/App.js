import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import UploadPage from "./pages/UploadPage";
import ClipPage from "./pages/ClipPage";
import NotFoundPage from "./pages/NotFoundPage";
import Navbar from "./components/Navbar";

/**
 * Root application component.
 * Routes:
 *   /           → Upload page (home)
 *   /clip/:code → Retrieve & view files page
 *   *           → 404
 */
function App() {
  return (
    <BrowserRouter>
      <div className="gradient-bg min-h-screen text-white">
        <Navbar />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <Routes>
            <Route path="/" element={<UploadPage />} />
            <Route path="/retrieve" element={<ClipPage />} />
            <Route path="/clip" element={<ClipPage />} />
            <Route path="/clip/:code" element={<ClipPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;

