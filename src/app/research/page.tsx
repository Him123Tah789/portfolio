import prisma from "@/lib/db";
import PageEdgeSwipeNavigator from "@/components/PageEdgeSwipeNavigator";
import ProjectCarousel from "@/components/ProjectCarousel";

export const dynamic = "force-dynamic";

async function getPublications() {
  try {
    return await (prisma as any).publication.findMany({
      orderBy: [{ submitted: "asc" }, { date: "desc" }, { order: "asc" }],
    });
  } catch {
    return [];
  }
}

async function getActivities() {
  try {
    return await (prisma as any).activity.findMany({
      orderBy: [{ current: "desc" }, { startDate: "desc" }, { order: "asc" }],
      take: 6,
    });
  } catch {
    return [];
  }
}

function formatYear(value: unknown): string {
  if (!value) return "";
  const parsed = new Date(value as any);
  return Number.isNaN(parsed.getTime()) ? "" : String(parsed.getFullYear());
}

function normalizeText(value: string) {
  return value.toLowerCase();
}

function classifyPublication(pub: any): "published" | "working" | "submitting" | "reviewing" {
  const text = normalizeText(`${pub.title || ""} ${pub.description || ""} ${pub.publisher || ""}`);

  if (text.includes("review") || text.includes("under review") || text.includes("revision")) {
    return "reviewing";
  }
  if (text.includes("working") || text.includes("in progress") || text.includes("wip") || text.includes("draft")) {
    return "working";
  }
  if (pub.submitted) {
    return "submitting";
  }
  return "published";
}

function getVenue(pub: any) {
  return pub.publisher || "Journal/Conference not specified";
}

function isAccepted(pub: any): boolean {
  const text = normalizeText(`${pub.title || ""} ${pub.description || ""} ${pub.publisher || ""}`);
  return text.includes("accepted");
}

export default async function ResearchPage() {
  const publications = await getPublications();
  const activities = await getActivities();

  const floatingObjects = [
    { token: "TS", label: "TypeScript", logo: "<>", icon: "🧩" },
    { token: "PY", label: "Python", logo: "Py", icon: "🐍" },
    { token: "GO", label: "Go", logo: "Go", icon: "⚡" },
    { token: "RS", label: "Rust", logo: "Rs", icon: "🦀" },
    { token: "JS", label: "JavaScript", logo: "Js", icon: "✨" },
    { token: "SQL", label: "PostgreSQL", logo: "DB", icon: "🗄" },
    { token: "NN", label: "TensorFlow", logo: "TF", icon: "🧠" },
    { token: "PT", label: "PyTorch", logo: "PT", icon: "🔥" },
    { token: "AI", label: "Scikit-learn", logo: "AI", icon: "📊" },
    { token: "FH", label: "Faishal Uddin Himel", logo: "FH", icon: "👤" },
  ];

  const published = publications.filter((pub: any) => classifyPublication(pub) === "published");
  const working = publications.filter((pub: any) => classifyPublication(pub) === "working");

  const toCarouselProjects = (items: any[], bucket: "published" | "working") =>
    items.map((pub: any) => {
      const status = bucket === "published" ? (isAccepted(pub) ? "Accepted" : "Published") : "Working";
      const venue = getVenue(pub);
      const year = formatYear(pub.date);

      return {
        id: pub.id,
        title: pub.title,
        description: pub.description || `Research paper in ${status.toLowerCase()} stage.`,
        tags: [status, venue, year || "Ongoing"].filter(Boolean).join(", "),
        githubUrl: null,
        liveUrl: pub.url || null,
      };
    });

  const publishedCards = toCarouselProjects(published, "published");
  const workingCards = toCarouselProjects(working, "working");

  return (
    <main className="research-page research-page-synced">
      <div className="projects-page-bg research-sync-bg" aria-hidden />
      <div className="projects-page-orb projects-page-orb-a" aria-hidden />
      <div className="projects-page-orb projects-page-orb-b" aria-hidden />
      <div className="research-floating-objects" aria-hidden>
        {floatingObjects.map((obj, idx) => (
          <div
            key={`${obj.token}-${idx}`}
            className="research-drop"
            style={{
              left: `${8 + (idx % 5) * 18}%`,
              top: `${-18 - (idx % 4) * 10}%`,
              animationDelay: `${idx * 1.1}s`,
              animationDuration: `${9 + (idx % 4) * 1.7}s`,
            }}
          >
            <div className="research-floating-chip">
              <i>{obj.icon}</i>
              <b>{obj.logo}</b>
              <span>{obj.token}</span>
              <small>{obj.label}</small>
            </div>
          </div>
        ))}
      </div>
      <header className="research-page-head">
        <h1>Research Corner</h1>
        <p>Project-style motion and visual system for research, publications, and academic trail.</p>
      </header>

      <section className="research-columns research-columns-synced">
        <div className="research-panel research-panel-wide">
          <h2>Published / Accepted Papers</h2>
          {publishedCards.length === 0 ? (
            <p className="research-empty">No published or accepted papers found.</p>
          ) : (
            <ProjectCarousel projects={publishedCards} />
          )}
        </div>

        <div className="research-panel research-panel-wide">
          <h2>Working Papers</h2>
          {workingCards.length === 0 ? (
            <p className="research-empty">No working papers found.</p>
          ) : (
            <ProjectCarousel projects={workingCards} />
          )}
        </div>
      </section>

      {activities.length > 0 && (
        <section className="research-activity-wrap">
          <div className="projects-details-head" style={{ marginBottom: 18 }}>
            <h2>Research Activities</h2>
            <p>Labs, initiatives, and academic contributions supporting ongoing research work.</p>
          </div>

          <div className="projects-details-list">
            {activities.map((activity: any, idx: number) => (
              <article
                key={activity.id}
                className="project-detail-card"
                style={{ animationDelay: `${Math.min(idx * 90, 500)}ms` }}
              >
                <div className="project-detail-top">
                  <div>
                    <p className="project-detail-index">Activity {String(idx + 1).padStart(2, "0")}</p>
                    <h3>{activity.title}</h3>
                  </div>
                  {activity.current && <span className="project-detail-badge">Current</span>}
                </div>

                {activity.role && <p className="research-meta">Role: {activity.role}</p>}
                {activity.description && <p className="project-detail-description">{activity.description}</p>}
              </article>
            ))}
          </div>
        </section>
      )}

      <PageEdgeSwipeNavigator direction="left" targetPath="/" hint="Swipe Left: Home" />
    </main>
  );
}
