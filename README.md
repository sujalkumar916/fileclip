# FileClip — Secure File Sharing Service

Anonymous, zero-account, temporary file sharing platform built with:
- **Frontend**: React 18 + Tailwind CSS + Lucide Icons
- **Backend**: Node.js + Express.js
- **Database**: MongoDB (Mongoose)
- **Storage**: AWS S3 / MinIO (presigned URL uploads)
- **AI**: Google Gemini (document summarisation)

## Quick Start

```bash
# 1. Start MongoDB + MinIO
docker compose up -d

# 2. Setup server
cd server
cp .env.example .env          # edit and add your GEMINI_API_KEY
npm install
npm run dev

# 3. Setup client (new terminal)
cd client
cp .env.example .env
npm install
npm start
```

See the detailed setup guide in the conversation artifact.

