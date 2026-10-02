import { useEffect, useState } from "react";

const API = import.meta.env.VITE_MUSIC_API_URL ?? "http://127.0.0.1:3001";

type Track = {
  id: string;
  name: string;
  artist: string;
  url: string | null;
};

/** A compact inline Spotify status that remains hidden when unavailable. */
export default function MusicStatus() {
  const [track, setTrack] = useState<Track | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const getMusic = async () => {
      try {
        const status = await fetch(`${API}/api/spotify/status`).then((response) =>
          response.json(),
        );

        if (!status.connected) return;

        const data = await fetch(`${API}/api/spotify/now-playing`).then((response) =>
          response.json(),
        );

        if (data.track) {
          setTrack(data.track);
          setPlaying(Boolean(data.isPlaying));
          return;
        }

        const recent = await fetch(`${API}/api/spotify/last-played`).then(
          (response) => response.json(),
        );

        setTrack(recent.track ?? null);
        setPlaying(false);
      } catch {
        // Keep the status out of the way if the music service is offline.
      }
    };

    getMusic();
    const interval = window.setInterval(getMusic, 15_000);

    return () => window.clearInterval(interval);
  }, []);

  if (!track) return null;

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
        <a className="music-track" href={track.url} target="_blank" rel="noreferrer">
          {trackLabel} ↗
        </a>
      ) : (
        <span className="music-track">{trackLabel}</span>
      )}
    </p>
  );
}
