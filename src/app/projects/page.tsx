import prisma from "@/lib/db";
import PageEdgeSwipeNavigator from "@/components/PageEdgeSwipeNavigator";

export const dynamic = "force-dynamic";

async function getProjects() {
  try {
    return await prisma.project.findMany({
      orderBy: [{ featured: "desc" }, { order: "asc" }, { createdAt: "desc" }],
    });
  } catch {
    return [];
  }
}

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <main className="projects-page">
      <div className="projects-page-bg" aria-hidden />
      <header className="projects-page-head">
        <h1>Projects Lab</h1>
        <p>Independent visual style for project exploration with card-lane motion.</p>
      </header>

      <section className="projects-grid">
        {projects.length === 0 && (
          <div className="projects-empty">
            No projects found. Add them from admin panel.
          </div>
        )}

        {projects.map((project, index) => (
          <article
            key={project.id}
            className="project-lane-card"
            style={{ animationDelay: `${Math.min(index * 70, 420)}ms` }}
          >
            <div className="project-lane-top">
              <h2>{project.title}</h2>
              {project.featured && <span>Featured</span>}
            </div>
            <p>{project.description}</p>
            <div className="project-tags">{project.tags}</div>
            <div className="project-links">
              {project.githubUrl && (
                <a href={project.githubUrl} target="_blank" rel="noreferrer">GitHub</a>
              )}
              {project.liveUrl && (
                <a href={project.liveUrl} target="_blank" rel="noreferrer">Live Demo</a>
              )}
            </div>
          </article>
        ))}
      </section>
      <PageEdgeSwipeNavigator direction="right" targetPath="/" hint="Swipe Right: Home" />
    </main>
  );
}
