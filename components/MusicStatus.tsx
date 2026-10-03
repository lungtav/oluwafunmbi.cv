"use client";

import { useEffect, useState } from "react";

type Track = {
  id: string;
  name: string;
  artist: string;
  url: string | null;
};

type Status = "loading" | "ready" | "hidden";

const CACHE_KEY = "oluwafunmbi:last-track";
/** How often to ask Spotify "anything playing?" */
const POLL_MS = 3_000;

function readCachedTrack(): Track | null {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Track>;
    if (typeof parsed.name !== "string" || typeof parsed.artist !== "string") {
      return null;
    }
    return {
      id: typeof parsed.id === "string" ? parsed.id : "",
      name: parsed.name,
      artist: parsed.artist,
      url: typeof parsed.url === "string" ? parsed.url : null,
    };
  } catch {
    return null;
  }
}

function writeCachedTrack(track: Track) {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(track));
  } catch {
    // Storage unavailable — the live fetch still works.
  }
}

/**
 * A compact inline Spotify status that never shifts the layout: it paints
 * instantly from cache (stale-while-revalidate) and reserves its space
 * with a skeleton on first visit. Stays hidden when unavailable.
 *
 * Spotify offers no webhooks for playback changes, so this polls every few
 * seconds — but never while the tab is hidden.
 */
export default function MusicStatus() {
  const [track, setTrack] = useState<Track | null>(null);
  const [playing, setPlaying] = useState(false);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    let cancelled = false;
    let intervalId = 0;

    // Paint instantly from cache so the page never jumps; then revalidate.
    const cached = readCachedTrack();
    if (cached) {
      setTrack(cached);
      setPlaying(false);
      setStatus("ready");
    }

    function schedule() {
      window.clearInterval(intervalId);
      intervalId = 0;
      if (document.visibilityState === "hidden") return;
      intervalId = window.setInterval(() => {
        void poll(false);
      }, POLL_MS);
    }

    async function poll(isInitial: boolean) {
      if (document.visibilityState === "hidden") return;
      let isPlaying = false;
      let ok = false;
      try {
        const statusJson = await fetch("/api/spotify/status").then(
          (response) => response.json(),
        );

        if (cancelled || !statusJson.connected) return;

        const data = await fetch("/api/spotify/now-playing").then(
          (response) => response.json(),
        );

        if (cancelled) return;

        if (data.track) {
          setTrack(data.track);
          isPlaying = Boolean(data.isPlaying);
          setPlaying(isPlaying);
          setStatus("ready");
          writeCachedTrack(data.track);
          ok = true;
          return;
        }

        const recent = await fetch("/api/spotify/last-played").then(
          (response) => response.json(),
        );

        if (cancelled) return;

        if (recent.track) {
          setTrack(recent.track);
          setPlaying(false);
          setStatus("ready");
          writeCachedTrack(recent.track);
          ok = true;
        }
      } catch {
        // Keep the cache (or skeleton-free hidden state) on failure.
        ok = false;
      } finally {
        if (cancelled) return;
        if (isInitial && !ok && !cached) setStatus("hidden");
        schedule();
      }
    }

    function handleVisibility() {
      // Tab became visible again — refresh immediately instead of waiting
      // for the next tick.
      if (document.visibilityState === "visible") void poll(false);
    }

    document.addEventListener("visibilitychange", handleVisibility);
    void poll(true);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  if (status === "hidden") return null;

  if (!track) {
    return (
      <p className="music-status is-loading" aria-hidden="true">
        <span className="music-indicator" aria-hidden="true" />
        <span className="skeleton-bar skeleton-bar--short" />
        <span className="skeleton-bar skeleton-bar--long" />
      </p>
    );
  }

  const label = playing ? "now playing" : "last played";
  const trackLabel = `${track.name} — ${track.artist}`;

  return (
    <p className="music-status">
      <span
        className={`music-indicator${playing ? " is-playing" : ""}`}
        aria-hidden
      />
      <span className="music-label">{label}</span>
      {track.url ? (
        <a
          className="music-track"
          href={track.url}
          target="_blank"
          rel="noreferrer"
        >
          {trackLabel} ↗
        </a>
      ) : (
        <span className="music-track">{trackLabel}</span>
      )}
    </p>
  );
}
