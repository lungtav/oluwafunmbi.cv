import { useEffect, useRef, useState } from "react";
import {
  ClockIcon,
  MapPinIcon,
  MoonIcon,
  SunIcon,
} from "@heroicons/react/24/outline";
import Lenis from "lenis";
import type { IconType } from "react-icons";
import {
  SiDocker,
  SiExpress,
  SiNodedotjs,
  SiPostgresql,
  SiReact,
  SiRedis,
  SiTailwindcss,
  SiTypescript,
} from "react-icons/si";
import MusicStatus from "./components/MusicStatus";
import ProjectCard from "./components/ProjectCard";

type Theme = "light" | "dark";

const THEME_META_COLOR: Record<Theme, string> = {
  light: "#f7f7f4",
  dark: "#131512",
};

const FAVICON_HREF = (stroke: string) =>
  `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Ccircle cx='32' cy='32' r='24' fill='none' stroke='%23${stroke.slice(1)}' stroke-width='7'/%3E%3C/svg%3E`;

/** Reflects the chosen theme in the browser chrome (class, color, favicon). */
function applyThemeToDom(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", THEME_META_COLOR[theme]);
  document
    .querySelector('link[rel="icon"]')
    ?.setAttribute(
      "href",
      FAVICON_HREF(theme === "dark" ? "#e9ebe6" : "#0a0a0a"),
    );
}

type Project = {
  name: string;
  description: string;
  link: string;
  /** Shown as the link text; defaults to the link itself. */
  linkLabel?: string;
  /** Optional app screenshot, framed inside the card preview. */
  image?: string;
};

const projects: Project[] = [
  {
    name: "kivo",
    description:
      "Realtime chat platform — spaces, channels, direct messages, and profiles, in a black-and-white interface with light and dark modes.",
    link: "https://github.com/lungtav/kivo",
    linkLabel: "github.com/lungtav/kivo",
    image: "/kivo.png",
  },
  {
    name: "rally",
    description: "Gym facility booking system",
    link: "rally.com",
  },
];

const socials = ["GitHub", "LinkedIn", "Email"];

const stack: { name: string; Icon: IconType }[] = [
  { name: "Node.js", Icon: SiNodedotjs },
  { name: "TypeScript", Icon: SiTypescript },
  { name: "React", Icon: SiReact },
  { name: "Express", Icon: SiExpress },
  { name: "PostgreSQL", Icon: SiPostgresql },
  { name: "Redis", Icon: SiRedis },
  { name: "Docker", Icon: SiDocker },
  { name: "Tailwind CSS", Icon: SiTailwindcss },
];

/** Ticks every second so the header clock stays live. */
function useClock() {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);

    return () => clearInterval(timer);
  }, []);

  return time
    .toLocaleTimeString("en-NG", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    })
    .toUpperCase();
}

/** Small pulsing marker for "live" information. */
function LiveDot() {
  return (
    <span className="relative flex h-1.5 w-1.5" aria-hidden>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
    </span>
  );
}

/** Mono uppercase section label with the brand asterisk. */
function SectionLabel({ children, meta }: { children: string; meta?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-faint">
        <span className="mr-2 text-accent" aria-hidden>
          ✳
        </span>
        {children}
      </p>

      {meta && (
        <span className="font-mono text-[11px] text-fainter">{meta}</span>
      )}
    </div>
  );
}

export default function App() {
  const formattedTime = useClock();
  const lenisRef = useRef<Lenis | null>(null);
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.classList.contains("dark") ? "dark" : "light",
  );

  // Reflect theme changes (toggle, first paint, system change) in the DOM.
  useEffect(() => {
    applyThemeToDom(theme);
  }, [theme]);

  // Follow live system preference changes until an explicit choice is stored.
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const onChange = (event: MediaQueryListEvent) => {
      if (localStorage.getItem("theme")) return;
      setTheme(event.matches ? "dark" : "light");
    };

    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", next);
    setTheme(next);
  };

  // Silky wheel scrolling. Skipped for reduced-motion users,
  // who get native instant jumps instead.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ lerp: 0.1 });
    lenisRef.current = lenis;

    let frame = requestAnimationFrame(function raf(time) {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    });

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  const scrollToSection = (target: string) => {
    const lenis = lenisRef.current;

    if (lenis) {
      lenis.scrollTo(target, { offset: -24 });
    } else {
      document
        .querySelector(target)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const scrollToTop = () => {
    const lenis = lenisRef.current;

    if (lenis) {
      lenis.scrollTo(0);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div
      id="top"
      className="mx-auto w-full max-w-4xl px-5 pt-14 pb-6 sm:px-8 sm:pt-20 sm:pb-28"
    >
      <header className="reveal">
        {/* Name + navigation */}
        <div className="flex items-start justify-between gap-6 pb-8">
          <div>
            <h1 className="font-display text-5xl leading-[0.95] tracking-[-0.01em] text-ink sm:text-7xl">
              OLUWAFUNMBI<span className="text-accent">.</span>
            </h1>

            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.26em] text-muted">
              Software Engineer
            </p>
          </div>

          <nav className="hidden pt-3 sm:block">
            <div className="flex flex-col items-end gap-2.5 font-mono text-[11px] uppercase tracking-[0.18em]">
              <a href="/" className="link-underline text-ink">
                Home
              </a>

              <a
                href="#work"
                onClick={(event) => {
                  event.preventDefault();
                  scrollToSection("#work");
                }}
                className="text-faint transition-colors hover:text-ink"
              >
                Work
              </a>
            </div>
          </nav>
        </div>

        {/* Location + local time */}
        <div className="flex items-center justify-between border-y border-line py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
          <span className="flex items-center gap-1.5">
            <MapPinIcon className="h-3.5 w-3.5" />
            Nigeria
          </span>

          <span className="flex items-center gap-3">
            <span className="flex items-center gap-2 tabular-nums">
              <ClockIcon className="h-3.5 w-3.5" />
              {formattedTime}
              <LiveDot />
            </span>

            <span aria-hidden className="h-3 w-px bg-line" />

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
              }
              title={theme === "dark" ? "Light mode" : "Dark mode"}
              className="transition-colors hover:text-accent"
            >
              {theme === "dark" ? (
                <SunIcon className="h-3.5 w-3.5" />
              ) : (
                <MoonIcon className="h-3.5 w-3.5" />
              )}
            </button>
          </span>
        </div>
      </header>

      <main>
        {/* About */}
        <section className="reveal py-10 sm:py-14" style={{ animationDelay: "0.08s" }}>
          <SectionLabel>About</SectionLabel>

          <p className="mt-6 max-w-2xl font-display text-[26px] leading-[1.3] text-ink sm:text-[32px]">
            I’m a software engineer passionate about architecting and building{" "}
            <em className="text-accent-ink">scalable, reliable, and maintainable</em>{" "}
            systems from the ground up.
          </p>

          <p className="mt-6 max-w-2xl text-[15px] leading-7 text-body">
            I enjoy turning complex problems into well-structured solutions,
            thinking through everything from system architecture and APIs to
            databases, performance, and user experience. I’m driven by
            continuous learning and creating software that is thoughtfully
            designed, practical, and built to evolve.
          </p>

          {/* Stack */}
          <ul className="mt-8 flex max-w-2xl flex-wrap items-center gap-x-5 gap-y-3 text-muted">
            {stack.map((tool) => (
              <li key={tool.name}>
                <span
                  role="img"
                  aria-label={tool.name}
                  title={tool.name}
                  className="block transition-colors hover:text-accent"
                >
                  <tool.Icon aria-hidden className="h-[18px] w-[18px]" />
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Now playing — inline between about and work on mobile,
            floating card on desktop. Lives outside animated ancestors
            so its fixed positioning isn't captured on desktop. */}
        <MusicStatus />

        {/* Work */}
        <section
          id="work"
          className="reveal scroll-mt-14 py-10 sm:py-14"
          style={{ animationDelay: "0.24s" }}
        >
          <SectionLabel meta={`(0${projects.length})`}>Selected Work</SectionLabel>

          <p className="mt-4 max-w-lg text-[15px] leading-7 text-body">
            Products and ideas I’ve brought to life.
          </p>

          <div className="mt-10 grid gap-x-10 gap-y-12 sm:grid-cols-2">
            {projects.map((project, index) => (
              <ProjectCard key={project.name} index={index} {...project} />
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="reveal pt-4" style={{ animationDelay: "0.3s" }}>
        <div className="border-t border-line pt-12">
          <p className="max-w-xl font-display text-3xl leading-[1.15] text-ink sm:text-4xl">
            Have an idea worth building?{" "}
            <span className="italic text-muted">Let’s talk.</span>
          </p>

          <a
            href="#"
            className="link-underline mt-7 inline-block font-mono text-[11px] uppercase tracking-[0.22em] text-accent-ink"
          >
            Say hello →
          </a>
        </div>

        <div className="mt-16 flex flex-col justify-between gap-3 border-t border-line py-6 font-mono text-[10px] uppercase tracking-[0.18em] text-subtle sm:flex-row sm:items-center">
          <span>© MMXXVI Oluwafunmbi</span>

          <div className="flex items-center gap-6">
            {socials.map((social) => (
              <a
                key={social}
                href="#"
                className="transition-colors hover:text-accent-ink"
              >
                {social}
              </a>
            ))}

            <a
              href="#top"
              onClick={(event) => {
                event.preventDefault();
                scrollToTop();
              }}
              className="text-accent-ink transition-opacity hover:opacity-60"
            >
              Top ↑
            </a>
          </div>
        </div>

        {/* Ghost wordmark */}
        <div aria-hidden className="full-bleed select-none overflow-hidden">
          <p className="text-center font-display text-[16vw] leading-[0.9] text-ink/[0.045]">
            OLUWAFUNMBI
          </p>
        </div>
      </footer>
    </div>
  );
}
