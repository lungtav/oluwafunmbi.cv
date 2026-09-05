import { useEffect, useState } from "react";

const API = import.meta.env.VITE_MUSIC_API_URL ?? "http://127.0.0.1:3001";

type Track = {
  id: string;
  name: string;
  artist: string;
  album: string;
  image: string | null;
  url: string | null;
};

/** Formats a duration in milliseconds as m:ss. */
function formatTime(milliseconds: number) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);

  return `${minutes}:${(seconds % 60).toString().padStart(2, "0")}`;
}

/** Three bouncing bars — animated while playing, dimmed when paused. */
function Equalizer({ playing }: { playing: boolean }) {
  return (
    <span
      role="img"
      aria-label={playing ? "Currently playing" : "Currently paused"}
      title={playing ? "Playing" : "Paused"}
      className="flex h-3 shrink-0 items-end gap-[2.5px]"
    >
      {[0, 1, 2].map((bar) => (
        <span
          key={bar}
          className={`w-[3px] rounded-full ${
            playing ? "eq-bar bg-accent" : "bg-faint opacity-50"
          }`}
          style={
            playing
              ? { height: "100%", animationDelay: `${bar * 0.18}s` }
              : { height: "40%" }
          }
        />
      ))}
    </span>
  );
}

export default function MusicStatus() {
  const [track, setTrack] = useState<Track | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  // Poll the music server for the current track.
  useEffect(() => {
    const getMusic = async () => {
      try {
        const status = await fetch(`${API}/api/spotify/status`).then((r) =>
          r.json(),
        );

        if (!status.connected) return;

        const data = await fetch(`${API}/api/spotify/now-playing`).then((r) =>
          r.json(),
        );

        setTrack(data.track);
        setPlaying(data.isPlaying);
        setProgress(data.progress ?? 0);
        setDuration(data.duration ?? 0);
      } catch {
        // Keep the player quiet if the music server is unavailable.
      }
    };

    getMusic();

    const interval = setInterval(getMusic, 5000);

    return () => clearInterval(interval);
  }, []);

  // Smoothly move the progress bar between API updates.
  useEffect(() => {
    if (!playing || !duration) return;

    const interval = setInterval(() => {
      setProgress((current) => Math.min(current + 1000, duration));
    }, 1000);

    return () => clearInterval(interval);
  }, [playing, duration]);

  if (!track) return null;

  const percentage = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <aside
      className="reveal fixed right-4 bottom-4 z-50 w-[calc(100%-2rem)] max-w-[320px] sm:right-5 sm:bottom-5"
      title={`${track.name} — ${track.artist} · ${formatTime(progress)} / ${formatTime(duration)}`}
    >
      <div className="relative overflow-hidden rounded-2xl border border-line bg-paper/90 shadow-[0_12px_36px_-10px_rgba(0,0,0,0.35)] backdrop-blur-md">
        <div className="flex items-center gap-3 p-2.5">
          <a
            href={track.url ?? "#"}
            target="_blank"
            rel="noreferrer"
            className="block h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-placeholder shadow-[0_2px_8px_rgba(35,38,35,0.10)]"
          >
            {track.image && (
              <img
                src={track.image}
                alt=""
                className="h-full w-full object-cover"
              />
            )}
          </a>

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-ink-soft">
              {track.name}
            </p>

            <p className="truncate text-[11px] text-faint">{track.artist}</p>
          </div>

          <Equalizer playing={playing} />
        </div>

        {/* Progress hugs the card's bottom edge. */}
        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-ink/[0.05]">
          <div
            className="h-full bg-accent transition-[width] duration-1000 ease-linear"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </aside>
  );
}
