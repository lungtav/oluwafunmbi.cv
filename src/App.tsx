import ProjectsPage from "./ProjectsPage";
import MusicStatus from "./components/MusicStatus";
const socials = [
  { name: "github", href: "https://github.com/lungtav" },
  { name: "linkedin", href: "https://www.linkedin.com/in/oluwafunmbi" },
  { name: "email", href: "mailto:oluwafunmbi10@gmail.com" },
];

export default function App() {
  if (window.location.pathname === "/projects") {
    return <ProjectsPage />;
  } 

  return (
    <main className="portfolio-shell home-shell">
      <section className="hero">
        <p className="intro-name">hello, i&apos;m oluwafunmbi.</p>
        <p className="intro-summary">
          i'm a software engineer passionate about architecting and building
          scalable systems.
        </p>
        <p>
          Outside of work: cinephile, basketball player and a chess player in a
          love/hate relationship with the game.
        </p>
        <MusicStatus />
        <a className="project-cta" href="/projects">
          projects ↗
        </a>
      </section>

      <section className="contact-section">
        <p className="eyebrow">get in touch</p>
        <div className="social-links">
          {socials.map((social, index) => (
            <span key={social.name}>
              <a
                href={social.href}
                {...(social.href.startsWith("http")
                  ? { target: "_blank", rel: "noreferrer" }
                  : {})}
              >
                {social.name}
              </a>
              {index < socials.length - 1 && <span aria-hidden> / </span>}
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}
