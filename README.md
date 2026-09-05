# oluwafunmbi.cv

Personal portfolio site with a live "now playing" widget, powered by Spotify.
Light and dark themes follow the system preference automatically.

## Structure

```
├── index.html              # Vite entry point
├── src/                    # Frontend (React + TypeScript + Tailwind CSS 4)
│   ├── App.tsx             # Page layout: header, about, work, footer
│   ├── main.tsx            # React bootstrap
│   ├── index.css           # Fonts, design tokens, base styles
│   └── components/
│       ├── MusicStatus.tsx # Floating Spotify now-playing widget
│       └── ProjectCard.tsx # Work section card
└── server/                 # Spotify now-playing API (Express + TypeScript)
    ├── server.ts           # Auth flow, token refresh, now-playing endpoints
    └── .env                # Spotify credentials (never committed)
```

## Getting started

### Frontend

```bash
npm install
npm run dev       # http://localhost:5173
```

Other scripts: `npm run build` (typecheck + production build), `npm run lint`, `npm run preview`.

### Music server

```bash
cd server
npm install
cp .env.example .env   # then fill in your Spotify credentials
npm run dev            # http://127.0.0.1:3001
```

Then visit [/api/spotify/login](http://127.0.0.1:3001/api/spotify/login) once to
connect Spotify. Tokens are cached in `server/spotify-token.json` and refreshed
automatically.

#### Environment variables (server/.env)

| Variable                | Description                                      |
| ----------------------- | ------------------------------------------------ |
| `SPOTIFY_CLIENT_ID`     | Spotify app client ID                            |
| `SPOTIFY_CLIENT_SECRET` | Spotify app client secret                        |
| `SPOTIFY_REDIRECT_URI`  | Spotify app redirect URI (e.g. the login URL)    |
| `FRONTEND_URL`          | Allowed CORS origin (default `http://localhost:5173`) |
| `PORT`                  | Server port (default `3001`)                     |

The frontend targets the music server at `http://127.0.0.1:3001` by default;
override it with `VITE_MUSIC_API_URL` in a `.env` file at the repo root.

## API

| Endpoint                     | Description                                    |
| ---------------------------- | ---------------------------------------------- |
| `GET /api/spotify/login`     | Starts the Spotify OAuth flow                  |
| `GET /api/spotify/callback`  | OAuth callback, stores tokens                  |
| `GET /api/spotify/status`    | `{ connected: boolean }`                       |
| `GET /api/spotify/now-playing` | Current track, progress, and playing state   |
| `GET /api/spotify/last-played` | Most recently played track                   |

## Deployment

The site (Vercel/Netlify/…) and the music server (Render/Railway/…) are
deployed separately. The widget only appears on the deployed site once the
server is live and the two are wired together.

### 1. Deploy the music server (Render)

This repo ships a [render.yaml](render.yaml) blueprint.

1. In [Render](https://dashboard.render.com): **New → Blueprint** → pick this
   repo (or **New → Web Service** with root directory `server`, build
   `npm install && npm run build`, start `npm start`).
2. Fill in the env vars:
   - `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET`
   - `SPOTIFY_REDIRECT_URI` — e.g. `https://oluwafunmbi-music.onrender.com/api/spotify/callback`
   - `FRONTEND_URL` — your deployed site origin (comma-separated list is OK)
3. In the [Spotify dashboard](https://developer.spotify.com/dashboard), add the
   same redirect URI to your app's allow-list.
4. Deploy, then visit `https://<your-server>/api/spotify/login` once and
   authorize. The server logs the refresh token — copy it into the
   `SPOTIFY_REFRESH_TOKEN` env var so the connection survives restarts on
   free tiers (their disks are ephemeral).

### 2. Wire the frontend to it

In your frontend host's project settings, add the build-time env var:

```
VITE_MUSIC_API_URL=https://oluwafunmbi-music.onrender.com
```

then redeploy — Vite bakes the value in at build time. The server also needs
your site's origin in `FRONTEND_URL` (CORS).

Note: free tiers spin down after inactivity, so the first track load after a
while can take ~30s while the server wakes up.
