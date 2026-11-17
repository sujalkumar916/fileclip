/**
 * src/services/geminiService.js
 * Google Gemini 2.5 Flash integration for document summarisation.
 * Supports PDF and plain-text files fetched directly from S3.
 */
const { GoogleGenAI } = require("@google/genai");
const { getObjectBuffer } = require("./s3Service");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// MIME types supported for inline document upload to Gemini
const SUPPORTED_MIME_TYPES = new Set([
  "application/pdf",
  "text/plain",
  "text/markdown",
  "text/html",
  "text/csv",
  "application/json",
]);

/**
 * Summarises a file stored in S3 using Gemini.
 *
 * @param {string} s3Key      S3 object key
 * @param {string} mimeType   MIME type of the file
 * @param {string} fileName   Original file name (used in the prompt)
 * @returns {Promise<string>} AI-generated summary text
 */
const summariseFile = async (s3Key, mimeType, fileName) => {
  // Normalise mimeType for text/* variants that might have charset suffix
  const baseMime = mimeType.split(";")[0].trim();

  if (!SUPPORTED_MIME_TYPES.has(baseMime)) {
    throw new Error(
      `Summarisation is only supported for PDF and text-based files. ` +
        `Received MIME type: ${baseMime}`
    );
  }

  // Fetch the file buffer from S3
  const fileBuffer = await getObjectBuffer(s3Key);
  const base64Data = fileBuffer.toString("base64");

  const model = "gemini-2.5-flash";

  const prompt = [
    {
      text:
        `You are a professional document analyst. Provide a concise, structured summary ` +
        `of the following document named "${fileName}".\n\n` +
        `Your summary should:\n` +
        `1. Start with a one-sentence overview of what the document is about.\n` +
        `2. List the 3-5 key points or topics covered.\n` +
        `3. End with any notable conclusions or action items if present.\n\n` +
        `Keep the summary under 250 words. Use clear, plain language.`,
    },
    {
      inlineData: {
        mimeType: baseMime,
        data: base64Data,
      },
    },
  ];

  const response = await ai.models.generateContent({
    model,
    contents: [{ role: "user", parts: prompt }],
  });

  return response.text;
};

module.exports = { summariseFile };

