import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import "dotenv/config";
import fs from "node:fs/promises";

/* --------------------------------
   Configuration
--------------------------------- */

const {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  SPOTIFY_REDIRECT_URI,
  FRONTEND_URL,
} = process.env;

/** Primary frontend origin — also the OAuth post-login redirect target. */
const [primaryOrigin = "", ...restOrigins] = (FRONTEND_URL || "").split(",");
const FRONTEND_ORIGIN = primaryOrigin.trim();

/** Extra allowed origins (comma-separated list in FRONTEND_URL). */
const extraOrigins = restOrigins.map((origin) => origin.trim());

/**
 * Accepts any local or private-network origin, so Vite port drift,
 * `vite preview`, and phone-over-Wi-Fi access all work without
 * keeping FRONTEND_URL in sync.
 */
function isAllowedOrigin(origin: string) {
  if (extraOrigins.includes(origin)) return true;

  try {
    const { hostname } = new URL(origin);

    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
    );
  } catch {
    return false;
  }
}

const PORT = Number(process.env.PORT ?? 3001);

const LAST_TRACK_FILE = "./last-track.json";
const TOKEN_FILE = "./spotify-token.json";

const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API_URL = "https://api.spotify.com/v1";

const SCOPES = [
  "user-read-currently-playing",
  "user-read-recently-played",
].join(" ");

if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REDIRECT_URI) {
  throw new Error("Missing Spotify environment variables");
}

/* --------------------------------
   Types
--------------------------------- */

interface SpotifyTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
  scope?: string;
}

interface SpotifyArtist {
  name: string;
}

interface SpotifyImage {
  url: string;
}

interface SpotifyAlbum {
  name: string;
  images: SpotifyImage[];
}

interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  duration_ms: number;
  external_urls?: {
    spotify?: string;
  };
}

/** Track shape served to the frontend and persisted to disk. */
interface FormattedTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  image: string | null;
  url: string | null;
}

/* --------------------------------
   File storage
--------------------------------- */

async function saveTokens(tokens: SpotifyTokens) {
  await fs.writeFile(TOKEN_FILE, JSON.stringify(tokens, null, 2), "utf8");
}

async function getTokens(): Promise<SpotifyTokens | null> {
  try {
    const data = await fs.readFile(TOKEN_FILE, "utf8");

    return JSON.parse(data) as SpotifyTokens;
  } catch {
    return null;
  }
}

async function saveLastTrack(track: FormattedTrack) {
  await fs.writeFile(LAST_TRACK_FILE, JSON.stringify(track, null, 2), "utf8");
}

async function getLastTrack(): Promise<FormattedTrack | null> {
  try {
    const data = await fs.readFile(LAST_TRACK_FILE, "utf8");

    return JSON.parse(data) as FormattedTrack;
  } catch {
    return null;
  }
}

/* --------------------------------
   Spotify helpers
--------------------------------- */

function basicAuthHeader() {
  const credentials = Buffer.from(
    `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`,
  ).toString("base64");

  return `Basic ${credentials}`;
}

/** Maps a raw Spotify track to the shape the frontend expects. */
function formatTrack(track: SpotifyTrack): FormattedTrack {
  return {
    id: track.id,
    name: track.name,
    artist: track.artists.map((artist) => artist.name).join(", "),
    album: track.album.name,
    image: track.album.images?.[0]?.url ?? null,
    url: track.external_urls?.spotify ?? null,
  };
}

async function refreshAccessToken(): Promise<string> {
  const tokens = await getTokens();

  if (!tokens?.refresh_token) {
    throw new Error("No Spotify refresh token available");
  }

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: tokens.refresh_token,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Spotify refresh error:", data);

    throw new Error("Could not refresh Spotify token");
  }

  const updatedTokens: SpotifyTokens = {
    ...tokens,
    ...data,
    refresh_token: data.refresh_token || tokens.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
  };

  await saveTokens(updatedTokens);

  return updatedTokens.access_token;
}

/** Returns a valid access token, refreshing it if it is about to expire. */
async function getAccessToken(): Promise<string> {
  const tokens = await getTokens();

  if (!tokens?.refresh_token) {
    throw new Error("Spotify is not connected");
  }

  const isValid =
    tokens.access_token &&
    tokens.expires_at &&
    Date.now() < tokens.expires_at - 60_000;

  if (isValid) {
    return tokens.access_token;
  }

  return refreshAccessToken();
}

/**
 * Calls the Spotify API, retrying once with a fresh token on 401.
 * Returns the global fetch Response — not the Express `Response` imported above.
 */
async function spotifyRequest(endpoint: string): Promise<globalThis.Response> {
  let accessToken = await getAccessToken();

  let response = await fetch(`${SPOTIFY_API_URL}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 401) {
    accessToken = await refreshAccessToken();

    response = await fetch(`${SPOTIFY_API_URL}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  return response;
}

/* --------------------------------
   App
--------------------------------- */

const app = express();

app.use(
  cors({
    origin: (origin, callback) =>
      callback(null, !origin || isAllowedOrigin(origin)),
  }),
);

app.use(express.json());

/* Spotify Login */

app.get("/api/spotify/login", (_req: Request, res: Response) => {
  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: SPOTIFY_REDIRECT_URI,
    scope: SCOPES,
  });

  res.redirect(`${SPOTIFY_AUTH_URL}?${params.toString()}`);
});

/* Spotify Callback */

app.get("/api/spotify/callback", async (req: Request, res: Response) => {
  const { code, error } = req.query;

  if (error) {
    return res.status(400).send(`Spotify authorization failed: ${error}`);
  }

  if (typeof code !== "string") {
    return res.status(400).send("No authorization code received");
  }

  try {
    const response = await fetch(SPOTIFY_TOKEN_URL, {
      method: "POST",
      headers: {
        Authorization: basicAuthHeader(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: SPOTIFY_REDIRECT_URI,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Spotify token error:", data);

      return res.status(400).json(data);
    }

    const tokens: SpotifyTokens = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      token_type: data.token_type,
      expires_in: data.expires_in,
      expires_at: Date.now() + data.expires_in * 1000,
      scope: data.scope,
    };

    await saveTokens(tokens);

    res.redirect(FRONTEND_ORIGIN);
  } catch (error) {
    console.error(error);

    res.status(500).send("Spotify authentication failed");
  }
});

/* Connection status */

app.get("/api/spotify/status", async (_req: Request, res: Response) => {
  const tokens = await getTokens();

  res.json({
    connected: Boolean(tokens?.refresh_token),
  });
});

/* Currently playing */

app.get("/api/spotify/now-playing", async (_req: Request, res: Response) => {
  try {
    const response = await spotifyRequest("/me/player/currently-playing");

    // Nothing currently playing.
    if (response.status === 204) {
      return res.json({
        isPlaying: false,
        track: await getLastTrack(),
      });
    }

    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: "Spotify request failed" });
    }

    const data = await response.json();

    if (!data?.item) {
      return res.json({
        isPlaying: false,
        track: await getLastTrack(),
      });
    }

    const formattedTrack = formatTrack(data.item as SpotifyTrack);

    // Only update last played when Spotify says something is actively playing.
    if (data.is_playing) {
      await saveLastTrack(formattedTrack);
    }

    res.json({
      isPlaying: Boolean(data.is_playing),
      track: formattedTrack,
      progress: data.progress_ms ?? 0,
      duration: data.item.duration_ms,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/* Last played */

app.get("/api/spotify/last-played", async (_req: Request, res: Response) => {
  try {
    const response = await spotifyRequest("/me/player/recently-played?limit=1");

    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: "Spotify request failed" });
    }

    const data = await response.json();

    const track = data.items?.[0]?.track as SpotifyTrack | undefined;

    if (!track) {
      return res.json({ track: null });
    }

    res.json({ track: formatTrack(track) });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Spotify server running at http://127.0.0.1:${PORT}`);
});
