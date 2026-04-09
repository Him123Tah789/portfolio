import Link from "next/link";
import prisma from "@/lib/db";
import ClientInteractivity from "@/components/ClientInteractivity";
import ThemeToggle from "@/components/ThemeToggle";
import ProjectCarousel from "@/components/ProjectCarousel";
import SkillsTicker from "@/components/SkillsTicker";
import HomeSwipeNavigator from "@/components/HomeSwipeNavigator";

export const dynamic = "force-dynamic";

async function getProfile() {
  try {
    return await prisma.profile.findFirst({ include: { socialLinks: true } });
  } catch {
    return null;
  }
}

async function getProjects() {
  try {
    return await prisma.project.findMany({
      where: { featured: true },
      // @ts-ignore
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      take: 6,
    });
  } catch {
    return [];
  }
}

async function getSkills() {
  try {
    return await prisma.skill.findMany({
      // @ts-ignore
      orderBy: [{ order: "asc" }, { level: "desc" }],
    });
  } catch {
    return [];
  }
}

async function getCertificates() {
  try {
    return await prisma.certificate.findMany({
      // @ts-ignore
      orderBy: [{ order: "asc" }, { issuedAt: "desc" }],
    });
  } catch {
    return [];
  }
}

async function getActivities() {
  try {
    return await (prisma as any).activity.findMany({ orderBy: [{ order: "asc" }, { startDate: "desc" }] });
  } catch {
    return [];
  }
}
async function getPublications() {
  try {
    return await (prisma as any).publication.findMany({ orderBy: [{ order: "asc" }, { date: "desc" }] });
  } catch {
    return [];
  }
}
async function getReferences() {
  try {
    return await (prisma as any).reference.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
  } catch {
    return [];
  }
}

async function getEducation() {
  try {
    return await prisma.education.findMany({
      // @ts-ignore
      orderBy: [{ order: "asc" }, { current: "desc" }, { passingYear: "desc" }],
    });
  } catch {
    return [];
  }
}

async function getExperience() {
  try {
    return await prisma.experience.findMany({
      // @ts-ignore
      orderBy: [{ order: "asc" }, { startDate: "desc" }],
    });
  } catch {
    return [];
  }
}

async function getPosts() {
  try {
    return await prisma.post.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    });
  } catch {
    return [];
  }
}

function toValidDate(value: unknown): Date | null {
  if (!value) return null;
  const parsed = new Date(value as any);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatMonthYear(value: unknown): string {
  const parsed = toValidDate(value);
  if (!parsed) return "";
  return new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(parsed);
}

function formatYear(value: unknown): string {
  const parsed = toValidDate(value);
  return parsed ? String(parsed.getFullYear()) : "";
}

function formatDateGB(value: unknown): string {
  const parsed = toValidDate(value);
  return parsed ? parsed.toLocaleDateString("en-GB") : "";
}

const CV_PLATFORM = {
  academic: "CV_ACADEMIC",
  industry: "CV_INDUSTRY",
} as const;

export default async function HomePage() {
  const profile = await getProfile();
  const projects = await getProjects();
  const skills = await getSkills();
  const certificates = await getCertificates();
  const activities = await getActivities();
  const publications = await getPublications();
  const references = await getReferences();
  const education = await getEducation();
  const experience = await getExperience();
  const posts = await getPosts();
  const primaryPosts = posts.slice(0, 3);
  const secondaryPosts = posts.slice(3, 8);
  const profileSocialLinks = ((profile as any)?.socialLinks || []) as Array<{ id?: string; platform: string; url: string }>;
  const academicCvUrl = profileSocialLinks.find((link) => link.platform === CV_PLATFORM.academic)?.url || "";
  const industryCvUrl = profileSocialLinks.find((link) => link.platform === CV_PLATFORM.industry)?.url || "";
  const legacyResumeUrl = (profile as any)?.resumeUrl || "";
  const academicDownloadUrl = academicCvUrl || legacyResumeUrl;
  const industryDownloadUrl = industryCvUrl || legacyResumeUrl;
  const visibleSocialLinks = profileSocialLinks.filter(
    (link) => link.platform !== CV_PLATFORM.academic && link.platform !== CV_PLATFORM.industry
  );

  // Group skills by category
  const skillsByCategory = skills.reduce((acc: any, skill: any) => {
    if (!acc[skill.category]) acc[skill.category] = [];
    acc[skill.category].push(skill);
    return acc;
  }, {});


  return (
    <main suppressHydrationWarning>
      {/* ── NAV ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        padding: "0 5%",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid transparent",
        background: "transparent",
        backdropFilter: "none",
      }}>
        <Link href="/" style={{ fontWeight: 700, fontSize: "1.1rem", textDecoration: "none", color: "inherit" }}>
          {profile?.name ?? "Portfolio"}
        </Link>

        <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
          <a href="#about" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>About</a>
          <a href="#cv" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>CV</a>
          <a href="#education" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Education</a>
          <a href="#experience" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Experience</a>
          <a href="#skills" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Skills</a>
          <a href="#projects" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Projects</a>
          <a href="#blog" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Blog</a>
          <a href="#contact" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Contact</a>
          <ThemeToggle />
          <Link href="/login" className="admin-nav-link" style={{
            fontSize: 12, fontWeight: 700, color: "var(--text-muted)",
            textDecoration: "none", letterSpacing: "0.06em",
            padding: "6px 14px", border: "1px solid var(--border)",
            borderRadius: 8, transition: "all 0.2s",
          }}>⚙ Admin</Link>
        </div>

      </nav>

      {/* ── HERO ── */}
      <section className="space-scene" style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "0 5%",
        overflow: "hidden",
      }}>
        <div className="animate-in" style={{ maxWidth: 760, position: "relative", zIndex: 2 }}>
          {/* Avatar */}
          {profile?.avatarUrl && (
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
              <div style={{
                width: 120, height: 120, borderRadius: "50%",
                background: "linear-gradient(135deg, #6c63ff, #ff6584)",
                padding: 3, boxShadow: "0 0 60px rgba(108,99,255,0.5)",
              }}>
                <div style={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden", background: "var(--avatar-bg)" }}>
                  <img src={profile.avatarUrl} alt={profile.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              </div>
            </div>
          )}
          <div style={{
            display: "inline-block",
            padding: "6px 18px",
            borderRadius: 50,
            background: "rgba(108,99,255,0.15)",
            border: "1px solid rgba(108,99,255,0.35)",
            fontSize: 13,
            fontWeight: 500,
            color: "var(--accent)",
            marginBottom: 28,
            letterSpacing: "0.02em",
          }}>
            Available for new opportunities
          </div>
          <h1 style={{ fontSize: "clamp(3rem, 8vw, 6rem)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.04em", marginBottom: 24 }}>
            Hi, I'm <span className="gradient-text" style={{ whiteSpace: "nowrap", display: "inline-block" }}>{profile?.name ?? "Faishal Uddin Himel"}</span>
          </h1>
          <p style={{ fontSize: "clamp(1.1rem, 2.5vw, 1.4rem)", color: "var(--text-muted)", lineHeight: 2.08, marginBottom: 56, maxWidth: "74ch", margin: "0 auto 56px" }}>
            {profile?.bio ?? "Full Stack Developer crafting clean, scalable, and beautiful web applications with a passion for great user experience."}
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/projects" className="btn-glow">Projects</Link>
            <Link href="/research" className="btn-outline">Research</Link>
            <a href="#projects" className="btn-glow">View My Work</a>
            <a href="#contact" className="btn-outline">Get in Touch</a>
            {(academicCvUrl || industryCvUrl) && (
              <a href="#about" className="btn-outline" title="CV download options are in About section">
                Download CV (About)
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ── CV DOWNLOAD ── */}
      <section id="cv" style={{ padding: "72px 5% 24px" }}>
        <div className="reveal" style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="glass" style={{ padding: 32, border: "1px solid var(--border)" }}>
            <p style={{ color: "var(--accent)", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
              Download CV
            </p>
            <h2 className="section-title" style={{ marginBottom: 12 }}>Choose the CV that matches your needs</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>
              Two versions are available: one for academic/research roles and one for industry/professional roles.
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {academicDownloadUrl ? (
                <a href={academicDownloadUrl} download="Academic_CV" className="btn-glow" style={{ fontSize: 14 }}>
                  Download Academic CV
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="btn-glow"
                  style={{ fontSize: 14, opacity: 0.55, cursor: "not-allowed" }}
                  title="Academic CV not uploaded yet"
                >
                  Download Academic CV
                </button>
              )}

              {industryDownloadUrl ? (
                <a href={industryDownloadUrl} download="Industry_CV" className="btn-outline" style={{ fontSize: 14 }}>
                  Download Industry CV
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="btn-outline"
                  style={{ fontSize: 14, opacity: 0.55, cursor: "not-allowed" }}
                  title="Industry CV not uploaded yet"
                >
                  Download Industry CV
                </button>
              )}
            </div>

            {!academicDownloadUrl && !industryDownloadUrl && (
              <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 14 }}>
                Upload the files from Admin Panel to enable both download buttons.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section id="about" style={{ padding: "100px 5%" }}>
        <div className="reveal" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center", maxWidth: 1100, margin: "0 auto" }}>
          <div>
            <p style={{ color: "var(--accent)", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>About Me</p>
            <h2 className="section-title" style={{ marginBottom: 24 }}>{(profile as any)?.aboutTitle ?? "Passionate about building things that matter"}</h2>
            <p style={{ color: "var(--text-muted)", lineHeight: 1.8, marginBottom: 16 }}>
              {profile?.bio ?? "I'm a full stack developer with experience building production-ready applications. I love clean code, great design, and solving hard problems."}
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 32, flexWrap: "wrap" }}>
              {visibleSocialLinks.map((link: any) => (
                <a key={link.id} href={link.url} className="btn-outline" target="_blank" rel="noreferrer" style={{ fontSize: 14 }}>{link.platform}</a>
              ))}
            </div>
          </div>
          <div className="glass hover-card" style={{ padding: 40 }}>
            {/* Avatar in about card */}
            {profile?.avatarUrl && (
              <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 32, paddingBottom: 28, borderBottom: "1px solid var(--border)" }}>
                <div style={{
                  width: 72, height: 72, borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg, #6c63ff, #ff6584)", padding: 2,
                  boxShadow: "0 0 24px rgba(108,99,255,0.4)",
                }}>
                  <div style={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden", background: "var(--avatar-bg)" }}>
                    <img src={profile.avatarUrl} alt={profile.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)" }}>{profile.name}</p>
                  <p style={{ fontSize: 13, color: "var(--accent)", fontWeight: 600 }}>{profile.title}</p>
                </div>
              </div>
            )}
            <div style={{ marginBottom: 24 }}>
              <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 4 }}>Role</p>
              <p style={{ fontWeight: 600 }}>{profile?.title ?? "Full Stack Developer"}</p>
            </div>
            {(profile as any)?.address && (
              <div style={{ marginBottom: 24 }}>
                <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 4 }}>Address</p>
                <p style={{ fontWeight: 600 }}>{(profile as any).address}</p>
              </div>
            )}
            <div>
              <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 4 }}>Email</p>
              <p style={{ fontWeight: 600 }}>{profile?.email ?? "hello@example.com"}</p>
            </div>
            {(academicCvUrl || industryCvUrl) && (
              <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 10 }}>
                <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 2 }}>Download CV</p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {academicCvUrl && (
                    <a
                      href={academicCvUrl}
                      download
                      className="btn-outline"
                      style={{ fontSize: 13, padding: "8px 14px" }}
                    >
                      Academic CV
                    </a>
                  )}
                  {industryCvUrl && (
                    <a
                      href={industryCvUrl}
                      download
                      className="btn-outline"
                      style={{ fontSize: 13, padding: "8px 14px" }}
                    >
                      Industry CV
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── EDUCATION ── */}
      {education.length > 0 && (
        <section id="education" className="reveal" style={{ padding: "100px 5%", background: "linear-gradient(to bottom, transparent, var(--bg-section), transparent)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <p style={{ color: "var(--accent)", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>{(profile as any)?.educationSubtitle ?? "Education"}</p>
            <h2 className="section-title" style={{ marginBottom: 60 }}>{(profile as any)?.educationTitle ?? "Academic Background"}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 40, position: "relative", paddingLeft: 20 }}>
              {/* Staircase Connector (Railing) */}
              <div style={{
                position: "absolute", top: 40, left: 10, bottom: 40, width: 2,
                background: "linear-gradient(to bottom, var(--accent), var(--accent-2), transparent)",
                opacity: 0.2, borderRadius: 2
              }} />

              {(() => {
                const getOrdinal = (n: number) => {
                  const s = ["th", "st", "nd", "rd"];
                  const v = n % 100;
                  return n + (s[(v - 20) % 10] || s[v] || s[0]);
                };
                return education.map((edu: any, idx: number) => (
                  <div key={edu.id} className="glass hover-card" style={{
                    padding: 32,
                    width: "min(650px, 100%)",
                    marginLeft: `clamp(0px, ${idx * 8}%, 300px)`, // Dynamic staggered index
                    position: "relative",
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
                  }}>
                    {/* Big Ordinal Number on the Right */}
                    <div style={{
                      position: "absolute", right: -130, top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: "3.2rem", fontWeight: 900,
                      color: "var(--accent)", opacity: 0.3,
                      fontFamily: "var(--font-heading)",
                      userSelect: "none", pointerEvents: "none",
                      whiteSpace: "nowrap",
                      textShadow: "0 0 10px rgba(108,99,255,0.2)"
                    }}>
                      {getOrdinal(idx + 1)}
                    </div>




                    {/* Staircase Step Indicator */}
                    <div style={{
                      position: "absolute", left: -10, top: 40, width: 20, height: 2,
                      background: "var(--accent)", opacity: 0.5
                    }} />

                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, alignItems: "flex-start" }}>
                      <div>
                        <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>{edu.degree}</h3>
                        <p style={{ color: "var(--accent)", fontSize: 15, fontWeight: 700 }}>{edu.school}</p>
                      </div>
                      <span style={{
                        fontSize: 12, fontWeight: 800, color: "var(--accent)",
                        padding: "4px 12px", background: "rgba(108,99,255,0.1)",
                        borderRadius: 50, border: "1px solid rgba(108,99,255,0.2)"
                      }}>
                        {edu.current ? (edu.passingYear && edu.passingYear > 0 ? `Ongoing (${edu.passingYear})` : "Present") : (edu.passingYear || "")}
                      </span>
                    </div>

                    {edu.field && <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 20, fontWeight: 500 }}>{edu.field}</p>}

                    {edu.grade && (
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", fontWeight: 700 }}>{edu.gradeType}</span>
                        <span style={{ padding: "4px 12px", background: "rgba(255,101,132,0.1)", border: "1px solid rgba(255,101,132,0.2)", borderRadius: 8, fontSize: 13, fontWeight: 800, color: "var(--accent-2)" }}>{edu.grade}</span>
                      </div>
                    )}
                  </div>
                ));
              })()}

            </div>

          </div>
        </section>
      )}

      {/* ── EXPERIENCE ── */}
      {experience.length > 0 && (
        <section id="experience" className="reveal" style={{ padding: "100px 5%", maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ color: "var(--accent)", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>{(profile as any)?.experienceSubtitle ?? "Career Path"}</p>
          <h2 className="section-title" style={{ marginBottom: 60 }}>{(profile as any)?.experienceTitle ?? "Professional Experience"}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {experience.map((exp: any) => (
              <div key={exp.id} className="glass hover-card" style={{ padding: 40 }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: "1.3rem", fontWeight: 800, marginBottom: 4 }}>{exp.position}</h3>
                    <p style={{ fontSize: "1.1rem", color: "var(--accent)", fontWeight: 700 }}>{exp.company}</p>
                  </div>
                  <div style={{ color: "var(--text-muted)", fontWeight: 700, fontSize: 14 }}>
                    {formatMonthYear(exp.startDate)} — {exp.current ? "Present" : formatMonthYear(exp.endDate)}
                  </div>
                </div>
                <p style={{ color: "var(--text-muted)", lineHeight: 1.8, fontSize: 15 }}>{exp.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── SKILLS (Core Expertise) ── */}
      {skills.length > 0 && (
        <section id="skills" className="reveal" style={{ padding: "100px 5%", background: "linear-gradient(to bottom, transparent, var(--bg-section), transparent)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <p style={{ color: "var(--accent)", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>{(profile as any)?.skillsSubtitle ?? "Technical Stack"}</p>
            <h2 className="section-title" style={{ marginBottom: 60 }}>{(profile as any)?.skillsTitle ?? "Core Expertise"}</h2>
            <SkillsTicker skillsByCategory={skillsByCategory} />
          </div>
        </section>
      )}

      {/* ── PROJECTS ── */}
      <section id="projects" className="reveal home-projects-section" style={{ padding: "100px 5%", background: "linear-gradient(to bottom, transparent, var(--bg-section), transparent)", position: "relative", overflow: "hidden" }}>
        <div className="home-projects-bg" aria-hidden />
        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <p style={{ color: "var(--accent)", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>{(profile as any)?.projectsSubtitle ?? "Portfolio"}</p>
          <h2 className="section-title" style={{ marginBottom: 60 }}>{(profile as any)?.projectsTitle ?? "Featured Projects"}</h2>
          {projects.length === 0 ? (
            <div className="glass" style={{ padding: 60, textAlign: "center" }}>
              <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>No projects yet — add them from the <a href="/admin/projects" style={{ color: "var(--accent)" }}>admin dashboard</a>.</p>
            </div>
          ) : (
            <ProjectCarousel projects={projects} />
          )}
        </div>
      </section>

      {/* ── CERTIFICATES ── */}
      {certificates.length > 0 && (
        <section className="reveal" style={{ padding: "100px 5%", maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ color: "var(--accent)", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>{(profile as any)?.certificatesSubtitle ?? "Recognition"}</p>
          <h2 className="section-title" style={{ marginBottom: 60 }}>{(profile as any)?.certificatesTitle ?? "Certifications"}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
            {certificates.map((cert: any) => (
              <div key={cert.id} className="glass hover-card" style={{ padding: 24 }}>
                {cert.imageUrl && (
                  <div style={{ marginBottom: 14, borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)", background: "var(--bg-section)" }}>
                    {/(\.png|\.jpg|\.jpeg|\.webp|\.gif)$/i.test(cert.imageUrl) ? (
                      <img src={cert.imageUrl} alt={`${cert.title} certificate`} style={{ width: "100%", height: 150, objectFit: "cover", display: "block" }} />
                    ) : (
                      <div style={{ height: 70, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 13, fontWeight: 600 }}>
                        Certificate proof attached
                      </div>
                    )}
                  </div>
                )}
                <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 8 }}>{cert.title}</h3>
                <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 12 }}>{cert.issuer}</p>
                {cert.credentialId && (
                  <p style={{ color: "var(--text-muted)", fontSize: 12, marginBottom: 10 }}>
                    ID: <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{cert.credentialId}</span>
                  </p>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{formatYear(cert.issuedAt) === "1970" ? "" : formatYear(cert.issuedAt)}</span>
                  {cert.imageUrl && (
                    <a href={cert.imageUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none", fontWeight: 700 }}>
                      View Certificate ↗
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── PUBLICATIONS ── */}
      {publications.length > 0 && (
        <section className="reveal" style={{ padding: "100px 5%", background: "linear-gradient(to bottom, transparent, var(--bg-section), transparent)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <p style={{ color: "var(--accent)", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>{(profile as any)?.publicationsSubtitle ?? "Academic Work"}</p>
            <h2 className="section-title" style={{ marginBottom: 60 }}>{(profile as any)?.publicationsTitle ?? "Research & Publications"}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {publications.map((pub: any) => (
                <div key={pub.id} className="glass hover-card" style={{ padding: 32 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: 700 }}>{pub.title}</h3>
                    {pub.submitted && <span style={{ background: "rgba(255,179,71,0.15)", color: "#ffb347", fontSize: 12, fontWeight: 800, padding: "2px 10px", borderRadius: 50, border: "1px solid rgba(255,179,71,0.3)" }}>Submitted</span>}
                  </div>
                  {!pub.submitted && (
                    <p style={{ color: "var(--accent)", fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
                      {pub.publisher} • {formatYear(pub.date)}
                    </p>
                  )}
                  {pub.submitted && <p style={{ color: "var(--text-muted)", fontSize: 14, fontWeight: 600, marginBottom: 16, fontStyle: "italic" }}>Currently under review</p>}

                  {pub.description && <p style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>{pub.description}</p>}
                  {!pub.submitted && pub.url && <a href={pub.url} target="_blank" rel="noreferrer" className="btn-outline" style={{ padding: "8px 20px", fontSize: 13 }}>Read Publication ↗</a>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── EXTRA-CURRICULAR ACTIVITIES ── */}
      {activities.length > 0 && (
        <section className="reveal" style={{ padding: "100px 5%", maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ color: "var(--accent)", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>{(profile as any)?.activitiesSubtitle ?? "Involvement"}</p>
          <h2 className="section-title" style={{ marginBottom: 60 }}>{(profile as any)?.activitiesTitle ?? "Extra-Curricular Activities"}</h2>
          <div style={{ position: "relative", borderLeft: "2px solid var(--border)", paddingLeft: 32, display: "flex", flexDirection: "column", gap: 48 }}>
            {(() => {
              const grouped: any[] = [];
              activities.forEach((act: any) => {
                const existing = grouped.find(g => g.title === act.title);
                if (existing) existing.roles.push(act);
                else grouped.push({ id: act.id, title: act.title, roles: [act] });
              });
              return grouped.map((group) => (
                <div key={group.id} style={{ position: "relative" }}>
                  {/* Main Timeline dot */}
                  <span style={{ position: "absolute", left: -41, top: 4, width: 16, height: 16, borderRadius: "50%", background: "var(--bg-primary)", border: "4px solid var(--accent)", boxShadow: "0 0 12px rgba(108,99,255,0.6)" }} />
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: group.roles.length > 1 ? 24 : 4 }}>{group.title}</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: group.roles.length > 1 ? 32 : 12 }}>
                    {group.roles.map((act: any, idx: number) => (
                      <div key={act.id} style={{ position: "relative" }}>
                        {group.roles.length > 1 && (
                          <span style={{ position: "absolute", left: -37, top: 6, width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", boxShadow: "0 0 8px rgba(108,99,255,0.4)" }} />
                        )}
                        <p style={{ fontSize: 14, color: "var(--accent)", fontWeight: 600, marginBottom: 8 }}>{act.endDate && !act.current ? `Former ${act.role}` : act.role}</p>
                        {(act.startDate || act.endDate || act.current) && (
                          <p style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 700, marginBottom: 12 }}>
                            {formatYear(act.startDate)}
                            {" — "}
                            {act.current ? "Present" : formatYear(act.endDate)}
                          </p>
                        )}
                        {act.description && <p style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.6 }}>{act.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ));
            })()}
          </div>
        </section>
      )}

      {/* ── REFERENCES ── */}
      {references.length > 0 && (
        <section className="reveal" style={{ padding: "100px 5%", background: "linear-gradient(to bottom, transparent, var(--bg-section), transparent)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <p style={{ color: "var(--accent)", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>{(profile as any)?.referencesSubtitle ?? "Endorsements"}</p>
            <h2 className="section-title" style={{ marginBottom: 60 }}>{(profile as any)?.referencesTitle ?? "References"}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
              {references.map((ref: any) => (
                <div key={ref.id} className="glass hover-card" style={{ padding: 28, borderTop: "4px solid var(--accent)" }}>
                  <div style={{ fontSize: 40, color: "var(--border)", marginBottom: 12, lineHeight: 1 }}>❝</div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 4 }}>{ref.name}</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 16 }}>{ref.designation} {ref.company && `at ${ref.company}`}</p>
                  {ref.email && <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>📧 {ref.email}</p>}
                  {ref.phone && <p style={{ fontSize: 13, color: "var(--text-muted)" }}>📞 {ref.phone}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── BLOG SECTION ── */}
      {posts.length > 0 && (
        <section id="blog" className="reveal" style={{ padding: "100px 5%", maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ color: "var(--accent)", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>{(profile as any)?.blogSubtitle ?? "Journal"}</p>
          <h2 className="section-title" style={{ marginBottom: 60 }}>{(profile as any)?.blogTitle ?? "Latest Writing"}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 32 }}>
            {primaryPosts.map((post: any) => (
              <div key={post.id} className="glass hover-card" style={{ padding: 32 }}>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12, fontWeight: 700 }}>
                  {formatDateGB(post.createdAt)}
                </p>
                <Link href={`/blog/${post.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <h3 className="blog-card-title">{post.title}</h3>
                </Link>
                <p style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.6, marginBottom: 24, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {post.content.replace(/[#*`]/g, '').slice(0, 150)}...
                </p>
                <Link href={`/blog/${post.slug}`} style={{ color: "var(--accent)", textDecoration: "none", fontSize: 13, fontWeight: 700 }}>Read Article →</Link>
              </div>
            ))}
          </div>

          {secondaryPosts.length > 0 && (
            <div className="blog-alt-wrap">
              <h3>Different Blogs</h3>
              <div className="blog-alt-list">
                {secondaryPosts.map((post: any) => (
                  <Link key={`alt-${post.id}`} href={`/blog/${post.slug}`} className="blog-alt-item">
                    <span>{formatDateGB(post.createdAt)}</span>
                    <strong>{post.title}</strong>
                    <em>{post.content.replace(/[#*`]/g, '').slice(0, 110)}...</em>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      )}


      {/* ── CONTACT ── */}
      <section id="contact" className="reveal" style={{ padding: "100px 5%", textAlign: "center" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <p style={{ color: "var(--accent)", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Contact</p>
          <h2 className="section-title" style={{ marginBottom: 20 }}>Let's work together</h2>
          <p style={{ color: "var(--text-muted)", lineHeight: 1.8, marginBottom: 40 }}>
            Whether you have a project in mind, a question, or just want to say hi — my inbox is always open.
          </p>
          <a href={`mailto:${profile?.email ?? "hello@example.com"}`} className="btn-glow" style={{ fontSize: "1rem" }}>
            Send me an Email
          </a>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "32px 5%", textAlign: "center" }}>
        <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 12 }}>
          © {new Date().getFullYear()} {profile?.name ?? "Portfolio"}. Built with Next.js &amp; Prisma.
        </p>
        <Link href="/login" className="admin-footer-link" style={{
          fontSize: 12, color: "var(--text-muted)", textDecoration: "none",
          transition: "color 0.2s", letterSpacing: "0.04em",
        }}>Admin Login →</Link>
      </footer>
      <HomeSwipeNavigator />
      <ClientInteractivity />
    </main>
  );
}
