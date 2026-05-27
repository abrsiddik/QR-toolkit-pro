# QR Toolkit Pro

A full-stack web app to **create**, **customize**, and **scan** QR codes. The UI runs in the browser; QR images and history are handled by a Node.js API with JSON file storage.

## Features

- **Create** — URL, WiFi, contact (vCard), email, and plain text QR codes
- **Scan** — camera-based QR reader (browser; no upload to server)
- **Customize** — colors, size (200–1000px), optional center logo (max 2 MB)
- **Validation** — URL, email, and phone checks before generation
- **History** — last 20 codes per browser session (stored on the server)
- **Themes** — Nebula, Cyber, Sunset, Arctic + dark mode

## Project structure

```
QR-toolkit-pro-main/
├── client/                 # Frontend (HTML + ES modules)
│   ├── index.html
│   └── src/
│       ├── main.js         # Entry + global handlers
│       ├── app.js          # UI logic
│       ├── api.js          # REST client
│       ├── config.js
│       ├── payload.js
│       ├── validation.js
│       └── styles.css
├── server/                 # Express API
│   ├── index.js
│   ├── db.js
│   ├── routes/
│   └── services/
├── netlify/
│   ├── functions/api.mjs   # Serverless API on Netlify
│   └── utils/
├── netlify.toml            # Netlify deploy config
├── package.json
└── README.md
```

## Requirements

- [Node.js](https://nodejs.org/) 18 or newer
- npm
- Camera permission (for Scan mode; HTTPS or localhost)

## Quick start

```bash
cd QR-toolkit-pro-main
npm install
npm start
```

Open **http://localhost:3000**

Development with auto-restart:

```bash
npm run dev
```

## API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/qr/generate` | Generate QR PNG (base64 data URL) |
| `GET` | `/api/history` | List session history |
| `POST` | `/api/history` | Add history entry `{ type, data }` |
| `DELETE` | `/api/history` | Clear session history |

### Generate QR

```http
POST /api/qr/generate
Content-Type: application/json

{
  "type": "url",
  "data": { "url": "https://example.com" },
  "size": 300,
  "color": "000000",
  "bgcolor": "ffffff",
  "hasLogo": false
}
```

Response:

```json
{
  "image": "data:image/png;base64,...",
  "payload": "https://example.com",
  "size": 300
}
```

History uses an HTTP-only session cookie (`qr_session`).

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |

History file: `server/data/history.json` (created automatically).

## Privacy

- QR **scanning** runs entirely in the browser; camera frames are not sent to the server.
- **Generation** sends encoded payload and style options to your server (no third-party QR API).
- **History** is tied to a session cookie on your instance.

## Deploy on Netlify (via GitHub)

This repo is ready for [Netlify](https://www.netlify.com/) with **static frontend** + **serverless API** (no separate server).

### 1. Push to GitHub

Ensure `main` (or your deploy branch) includes:

- `client/` — site files
- `netlify.toml` — build settings
- `netlify/functions/` — API
- `package.json` — function dependencies (`qrcode`, `@netlify/blobs`)

### 2. Connect Netlify to GitHub

1. Log in at [app.netlify.com](https://app.netlify.com/)
2. **Add new site** → **Import an existing project** → **GitHub**
3. Authorize Netlify and select **`QR-toolkit-pro`** (or your repo name)
4. Branch: **`main`**
5. Netlify reads **`netlify.toml`** automatically:
   - **Publish directory:** `client`
   - **Functions:** `netlify/functions`
   - **Build command:** (leave empty — none required)
6. Click **Deploy site**

### 3. After deploy

- Site URL: `https://<your-site>.netlify.app`
- API: same origin (`/api/qr/generate`, `/api/history`, …)
- **Scan** mode needs HTTPS — Netlify provides this by default
- History is stored in **Netlify Blobs** (per session cookie)

### 4. Optional: local Netlify preview

```bash
npm install
npm run netlify:dev
```

Opens the app with functions at `http://localhost:8888`.

### Netlify vs local Express

| | Local `npm start` | Netlify |
|--|-------------------|---------|
| Frontend | `client/` | `client/` |
| API | Express (`server/`) | Serverless (`netlify/functions/api.mjs`) |
| History | `server/data/history.json` | Netlify Blobs |

## Legacy single-file version

The original all-in-one `index.html` at the repo root is kept as a redirect stub. Use `npm start` or Netlify for the full app.

## License

MIT
