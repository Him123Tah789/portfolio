import prisma from "@/lib/db";
import PageEdgeSwipeNavigator from "@/components/PageEdgeSwipeNavigator";
import ProjectCarousel from "@/components/ProjectCarousel";

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
      <div className="projects-page-orb projects-page-orb-a" aria-hidden />
      <div className="projects-page-orb projects-page-orb-b" aria-hidden />
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

        {projects.length > 0 && <ProjectCarousel projects={projects} />}
      </section>

      {projects.length > 0 && (
        <section className="projects-details-wrap">
          <div className="projects-details-bg" aria-hidden />
          <div className="projects-details-head">
            <h2>All Project Details</h2>
            <p>Complete list of projects with summary, stack, and links.</p>
          </div>

          <div className="projects-details-list">
            {projects.map((project, index) => {
              const tags = project.tags
                ? project.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
                : [];

              return (
                <article
                  key={`detail-${project.id}`}
                  className="project-detail-card"
                  style={{ animationDelay: `${Math.min(index * 90, 630)}ms` }}
                >
                  <div className="project-detail-top">
                    <div>
                      <p className="project-detail-index">Project {String(index + 1).padStart(2, "0")}</p>
                      <h3>{project.title}</h3>
                    </div>
                    <div className="project-detail-status">
                      {project.featured && <span className="project-detail-badge">Featured</span>}
                    </div>
                  </div>

                  <p className="project-detail-description">{project.description}</p>

                  {tags.length > 0 && (
                    <div className="project-detail-tags">
                      {tags.map((tag) => (
                        <span key={`${project.id}-${tag}`}>{tag}</span>
                      ))}
                    </div>
                  )}

                  <div className="project-detail-links">
                    {project.githubUrl ? (
                      <a href={project.githubUrl} target="_blank" rel="noreferrer">GitHub</a>
                    ) : (
                      <span className="project-link-disabled">GitHub not provided</span>
                    )}

                    {project.liveUrl ? (
                      <a href={project.liveUrl} target="_blank" rel="noreferrer">Live Demo</a>
                    ) : (
                      <span className="project-link-disabled">Live demo not provided</span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
      <PageEdgeSwipeNavigator direction="right" targetPath="/" hint="Swipe Right: Home" />
    </main>
  );
}
