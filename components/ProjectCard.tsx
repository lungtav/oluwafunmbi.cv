import type { Project } from "@/data/projects";
import { ArrowUpRightIcon, GithubIcon } from "./icons";

export default function ProjectCard({
  project,
  index,
}: {
  project: Project;
  index: string;
}) {
  return (
    <article className="project-card">
      <div className="project-card-body">
        <div className="project-card-heading">
          <div className="project-title">
            <span className="project-index">{index}</span>
            <h2>{project.name}</h2>
          </div>
          <div className="project-links">
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={`Visit ${project.name}`}
                title="Visit live site"
              >
                <ArrowUpRightIcon />
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
                <GithubIcon />
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
  );
}
