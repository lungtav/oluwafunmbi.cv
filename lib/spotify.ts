import fs from "node:fs/promises";
import path from "node:path";

/* --------------------------------
   Configuration
--------------------------------- */

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} environment variable`);
  return value;
}

/** Writable location for token/track persistence.
 *  Serverless hosts (Vercel) only allow writes to /tmp. */
const DATA_DIR = process.env.VERCEL ? "/tmp" : process.cwd();
const LAST_TRACK_FILE = path.join(DATA_DIR, "last-track.json");
const TOKEN_FILE = path.join(DATA_DIR, "spotify-token.json");

const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API_URL = "https://api.spotify.com/v1";

const SCOPES = [
  "user-read-currently-playing",
  "user-read-recently-played",
].join(" ");

/* --------------------------------
   Types
--------------------------------- */

export interface SpotifyTokens {
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
export interface FormattedTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  image: string | null;
  url: string | null;
}

/* --------------------------------
   File storage (with in-memory cache for serverless)
--------------------------------- */

let cachedTokens: SpotifyTokens | null = null;
let cachedLastTrack: FormattedTrack | null = null;

async function saveTokens(tokens: SpotifyTokens) {
  cachedTokens = tokens;
  try {
    await fs.writeFile(TOKEN_FILE, JSON.stringify(tokens, null, 2), "utf8");
  } catch {
    // Ephemeral filesystems may reject writes — memory cache still works.
  }
}

async function getTokens(): Promise<SpotifyTokens | null> {
  if (cachedTokens?.refresh_token) return cachedTokens;
  try {
    const data = await fs.readFile(TOKEN_FILE, "utf8");
    cachedTokens = JSON.parse(data) as SpotifyTokens;
    return cachedTokens;
  } catch {
    // Ephemeral hosts wipe the disk on restart — re-seed
    // from a long-lived refresh token provided via env.
    const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;
    if (!refreshToken) return null;
    cachedTokens = {
      access_token: "",
      refresh_token: refreshToken,
      token_type: "Bearer",
      expires_in: 0,
      expires_at: 0,
    };
    return cachedTokens;
  }
}

async function saveLastTrack(track: FormattedTrack) {
  cachedLastTrack = track;
  try {
    await fs.writeFile(LAST_TRACK_FILE, JSON.stringify(track, null, 2), "utf8");
  } catch {
    // Ignore — memory cache still works.
  }
}

async function getLastTrack(): Promise<FormattedTrack | null> {
  if (cachedLastTrack) return cachedLastTrack;
  try {
    const data = await fs.readFile(LAST_TRACK_FILE, "utf8");
    cachedLastTrack = JSON.parse(data) as FormattedTrack;
    return cachedLastTrack;
  } catch {
    return null;
  }
}

/* --------------------------------
   Spotify helpers
--------------------------------- */

function basicAuthHeader() {
  const credentials = Buffer.from(
    `${getEnv("SPOTIFY_CLIENT_ID")}:${getEnv("SPOTIFY_CLIENT_SECRET")}`,
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
  if (isValid) return tokens.access_token;
  return refreshAccessToken();
}

/** Calls the Spotify API, retrying once with a fresh token on 401. */
async function spotifyRequest(endpoint: string): Promise<Response> {
  let accessToken = await getAccessToken();
  let response = await fetch(`${SPOTIFY_API_URL}${endpoint}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (response.status === 401) {
    accessToken = await refreshAccessToken();
    response = await fetch(`${SPOTIFY_API_URL}${endpoint}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }
  return response;
}

/* --------------------------------
   Public API used by route handlers
--------------------------------- */

export async function isConnected(): Promise<boolean> {
  const tokens = await getTokens();
  return Boolean(tokens?.refresh_token);
}

export function getLoginUrl(): string {
  const params = new URLSearchParams({
    client_id: getEnv("SPOTIFY_CLIENT_ID"),
    response_type: "code",
    redirect_uri: getEnv("SPOTIFY_REDIRECT_URI"),
    scope: SCOPES,
  });
  return `${SPOTIFY_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string): Promise<void> {
  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: getEnv("SPOTIFY_REDIRECT_URI"),
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    console.error("Spotify token error:", data);
    throw new Error("Spotify token exchange failed");
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
  // Free-tier hosts wipe the disk on restart — surface the refresh token
  // once so it can be copied into the SPOTIFY_REFRESH_TOKEN env var.
  console.log(
    "Spotify refresh token — store me in SPOTIFY_REFRESH_TOKEN:",
    tokens.refresh_token,
  );
}

export type NowPlayingResult =
  | { isPlaying: false; track: FormattedTrack | null }
  | {
      isPlaying: boolean;
      track: FormattedTrack;
      progress: number;
      duration: number;
    };

export async function getNowPlaying(): Promise<NowPlayingResult> {
  const response = await spotifyRequest("/me/player/currently-playing");
  // Nothing currently playing.
  if (response.status === 204) {
    return { isPlaying: false, track: await getLastTrack() };
  }
  if (!response.ok) {
    throw new Error(`Spotify request failed: ${response.status}`);
  }
  const data = await response.json();
  if (!data?.item) {
    return { isPlaying: false, track: await getLastTrack() };
  }
  const formattedTrack = formatTrack(data.item as SpotifyTrack);
  // Only update last played when Spotify says something is actively playing.
  if (data.is_playing) {
    await saveLastTrack(formattedTrack);
  }
  return {
    isPlaying: Boolean(data.is_playing),
    track: formattedTrack,
    progress: data.progress_ms ?? 0,
    duration: data.item.duration_ms,
  };
}

export async function getLastPlayed(): Promise<{
  track: FormattedTrack | null;
}> {
  const response = await spotifyRequest("/me/player/recently-played?limit=1");
  if (!response.ok) {
    throw new Error(`Spotify request failed: ${response.status}`);
  }
  const data = await response.json();
  const track = data.items?.[0]?.track as SpotifyTrack | undefined;
  if (!track) return { track: null };
  return { track: formatTrack(track) };
}
