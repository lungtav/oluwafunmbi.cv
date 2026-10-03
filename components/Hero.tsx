import Link from "next/link";
import MusicStatus from "./MusicStatus";

export default function Hero() {
  return (
    <section className="hero">
      <p className="intro-name">hello, i&apos;m oluwafunmbi.</p>
      <p className="intro-summary">
        i&apos;m a software engineer passionate about architecting and building
        scalable systems.
      </p>
      <p>
        Outside of work: cinephile, basketballer and a chess player in a
        love/hate relationship with the game.
      </p>
      <MusicStatus />
      <Link className="project-cta" href="/projects">
        projects ↗
      </Link>
    </section>
  );
}
