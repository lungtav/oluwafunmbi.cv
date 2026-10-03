import type { Metadata } from "next";
import Link from "next/link";
import ProjectCard from "@/components/ProjectCard";
import { projects } from "@/data/projects";

export const metadata: Metadata = {
  title: "projects | Oluwafunmbi",
};

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
          <Link className="back-link" href="/">
            ← back
          </Link>
          <h1>projects</h1>
        </header>

        <div className="project-cards">
          {projects.map((project, i) => (
            <ProjectCard
              key={project.name}
              project={project}
              index={String(i + 1).padStart(2, "0")}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
