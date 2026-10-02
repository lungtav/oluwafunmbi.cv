import { ArrowUpRightIcon } from "@heroicons/react/24/outline";
import { SiGithub } from "react-icons/si";

const projects = [
  {
    name: "kivo",
    description: "realtime chat platform",
    liveUrl: "https://kivo-drab.vercel.app/",
    githubUrl: "https://github.com/lungtav/kivo",
    stack: ["react", "typeScript", "node.js", "socket.io"],
  },
  {
    name: "rally",
    description: "gym facility booking system",
    githubUrl: "https://github.com/lungtav/rally",
    stack: ["react", "typeScript", "postgreSQL"],
  },
];

export default function ProjectsPage() {
  const compactLayout = projects.length <= 2;

  return (
    <main
      className={`portfolio-shell projects-shell${
        compactLayout ? " projects-shell--compact" : ""
      }`}
    >
      <section className="projects-list">
        <header className="projects-page-header">
          <a className="back-link" href="/">
            ← back
          </a>
          <h1>projects</h1>
        </header>

        <div className="project-cards">
          {projects.map((project) => (
            <article className="project-card" key={project.name}>
              <div className="project-card-body">
                <div className="project-card-heading">
                  <h2>{project.name}</h2>
                  <div className="project-links">
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Visit ${project.name}`}
                        title="Visit live site"
                      >
                        <ArrowUpRightIcon aria-hidden />
                      </a>
                    )}
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`View ${project.name} on GitHub`}
                        title="View source on GitHub"
                      >
                        <SiGithub aria-hidden />
                      </a>
                    )}
                  </div>
                </div>

                <p className="project-description">{project.description}</p>
                <div
                  className="project-stack"
                  aria-label={`${project.name} technology stack`}
                >
                  {project.stack.map((technology) => (
                    <span key={technology}>{technology}</span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
