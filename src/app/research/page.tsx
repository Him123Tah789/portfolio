import prisma from "@/lib/db";
import PageEdgeSwipeNavigator from "@/components/PageEdgeSwipeNavigator";

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

  const published = publications.filter((pub: any) => classifyPublication(pub) === "published");
  const working = publications.filter((pub: any) => classifyPublication(pub) === "working");
  const submitting = publications.filter((pub: any) => classifyPublication(pub) === "submitting");
  const reviewing = publications.filter((pub: any) => classifyPublication(pub) === "reviewing");

  return (
    <main className="research-page">
      <div className="research-lab-bg" />
      <header className="research-page-head">
        <h1>Research Corner</h1>
        <p>Separate editorial style focused on publication status and academic trail.</p>
      </header>

      <section className="research-columns">
        <div className="research-panel">
          <h2>Published</h2>
          {published.length === 0 && <p className="research-empty">No published items found.</p>}
          {published.map((pub: any, idx: number) => (
            <article key={pub.id} className="research-entry" style={{ animationDelay: `${Math.min(idx * 90, 500)}ms` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
                <h3 style={{ flex: 1 }}>{pub.title}</h3>
                {isAccepted(pub) && (
                  <span className="research-badge-accepted">Accepted</span>
                )}
              </div>
              <p className="research-meta">Journal/Conference: {getVenue(pub)}{formatYear(pub.date) ? ` • ${formatYear(pub.date)}` : ""}</p>
              {pub.description && <p>{pub.description}</p>}
              {pub.url && (
                <a href={pub.url} target="_blank" rel="noreferrer">Read Publication</a>
              )}
            </article>
          ))}
        </div>

        <div className="research-panel">
          <h2>Working</h2>
          {working.length === 0 && <p className="research-empty">No working-paper entries found.</p>}
          {working.map((pub: any, idx: number) => (
            <article key={pub.id} className="research-entry" style={{ animationDelay: `${Math.min(idx * 90, 500)}ms` }}>
              <h3>{pub.title}</h3>
              <p className="research-meta">Journal/Conference: {getVenue(pub)}</p>
              {pub.description && <p>{pub.description}</p>}
            </article>
          ))}
        </div>

        <div className="research-panel">
          <h2>Submitting Journal/Conference</h2>
          {submitting.length === 0 && <p className="research-empty">No currently submitting entries found.</p>}
          {submitting.map((pub: any, idx: number) => (
            <article key={pub.id} className="research-entry" style={{ animationDelay: `${Math.min(idx * 90, 500)}ms` }}>
              <h3>{pub.title}</h3>
              <p className="research-meta">Journal/Conference: {getVenue(pub)}</p>
              {pub.description && <p>{pub.description}</p>}
            </article>
          ))}
        </div>

        <div className="research-panel research-timeline">
          <h2>Reviewing</h2>
          {reviewing.length === 0 && <p className="research-empty">No reviewing entries found.</p>}
          {reviewing.map((pub: any, idx: number) => (
            <article key={pub.id} className="research-entry" style={{ animationDelay: `${Math.min(idx * 90, 500)}ms` }}>
              <h3>{pub.title}</h3>
              <p className="research-meta">Journal/Conference: {getVenue(pub)}</p>
              {pub.description && <p>{pub.description}</p>}
            </article>
          ))}
        </div>
      </section>

      <PageEdgeSwipeNavigator direction="left" targetPath="/" hint="Swipe Left: Home" />
    </main>
  );
}
