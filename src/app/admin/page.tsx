import { Github, Linkedin, Mail, ExternalLink, Globe, MapPin, Award, BookOpen, UserCheck, Briefcase, GraduationCap, Code, Rocket, Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import Link from "next/link";
import prisma from "@/lib/db";
import DownloadPDFButton from "@/components/admin/DownloadPDFButton";

export const dynamic = "force-dynamic";

// ── TYPES ───────────────────────────────────────────────────────────────────
interface Profile {
    name: string;
    title: string;
    bio: string;
    aboutTitle?: string | null;
    address?: string | null;
    avatarUrl?: string | null;
    email?: string | null;
    socialLinks?: SocialLink[];
}

interface SocialLink {
    platform: string;
    url: string;
}

interface Education {
    id: string;
    school: string;
    degree: string;
    field?: string | null;
    passingYear: number;
    gradeType?: string | null;
    grade?: string | null;
    gradeScale?: string | null;
    current: boolean;
}

interface Experience {
    id: string;
    company: string;
    position: string;
    description?: string | null;
    startDate: Date;
    endDate?: Date | null;
    current: boolean;
}

interface Skill {
    id: string;
    name: string;
    level: number;
}

interface Certificate {
    id: string;
    title: string;
    issuer: string;
    issuedAt: Date | null;
}

interface Activity {
    id: string;
    title: string;
    role?: string | null;
    description?: string | null;
    startDate?: Date | null;
    endDate?: Date | null;
    current: boolean;
}

interface Publication {
    id: string;
    title: string;
    publisher?: string | null;
    date?: Date | null;
    submitted: boolean;
}

interface Reference {
    id: string;
    name: string;
    designation: string;
    company?: string | null;
    email?: string | null;
}

const SocialIcon = ({ platform }: { platform: string }) => {
    switch (platform.toLowerCase()) {
        case "github": return <Github size={14} />;
        case "linkedin": return <Linkedin size={14} />;
        case "twitter": return <Twitter size={14} />;
        case "facebook": return <Facebook size={14} />;
        case "instagram": return <Instagram size={14} />;
        case "youtube": return <Youtube size={14} />;
        case "portfolio": return <Globe size={14} />;
        default: return <ExternalLink size={14} />;
    }
};

// ── COMPONENT ──────────────────────────────────────────────────────────────
export default async function AdminDashboard() {
    // ── DATA FETCHING ────────────────────────────────────────────────────────
    let profile: Profile | null = null;
    let education: Education[] = [];
    let experience: Experience[] = [];
    let skills: Skill[] = [];
    let certificates: Certificate[] = [];
    let activities: Activity[] = [];
    let publications: Publication[] = [];
    let references: Reference[] = [];

    try {
        const profileData = await prisma.profile.findFirst({ include: { socialLinks: true } });
        profile = profileData as unknown as Profile | null;
    } catch {
        profile = null;
    }

    try {
        education = await (prisma as any).education.findMany({
            orderBy: [{ order: "asc" }, { current: "desc" }, { passingYear: "desc" }]
        }) as unknown as Education[];
    } catch {
        education = [];
    }

    try {
        experience = await (prisma as any).experience.findMany({
            orderBy: [{ order: "asc" }, { startDate: "desc" }]
        }) as unknown as Experience[];
    } catch {
        experience = [];
    }

    try {
        skills = await (prisma as any).skill.findMany({
            orderBy: [{ order: "asc" }, { level: "desc" }]
        }) as unknown as Skill[];
    } catch {
        skills = [];
    }

    try {
        certificates = await (prisma as any).certificate.findMany({
            orderBy: [{ order: "asc" }, { issuedAt: "desc" }],
            take: 6
        }) as unknown as Certificate[];
    } catch {
        certificates = [];
    }

    try {
        activities = await (prisma as any).activity.findMany({
            orderBy: [{ order: "asc" }, { startDate: "desc" }]
        }) as Activity[];
    } catch {
        activities = [];
    }

    try {
        publications = await (prisma as any).publication.findMany({
            orderBy: [{ order: "asc" }, { date: "desc" }]
        }) as Publication[];
    } catch {
        publications = [];
    }

    try {
        references = await (prisma as any).reference.findMany({
            orderBy: [{ order: "asc" }, { createdAt: "asc" }]
        }) as Reference[];
    } catch {
        references = [];
    }

    const adminCards = [
        { title: "About",        href: "/admin/profile",      icon: "👤" },
        { title: "Education",    href: "/admin/education",    icon: "🎓" },
        { title: "Experience",   href: "/admin/experience",   icon: "💼" },
        { title: "Skills",       href: "/admin/skills",       icon: "🧠" },
        { title: "Projects",     href: "/admin/projects",     icon: "🚀" },
        { title: "Certificates", href: "/admin/certificates", icon: "📜" },
        { title: "Activities",   href: "/admin/activities",   icon: "🏅" },
        { title: "Publications", href: "/admin/publications", icon: "📚" },
        { title: "References",   href: "/admin/references",   icon: "🤝" },
    ];

    return (
        <div style={{ maxWidth: 1100, margin: "0 auto", paddingBottom: 100 }}>
            <style>{`
                .cv-card { background: rgba(255,255,255,0.01); backdrop-filter: blur(24px); border: 1px solid var(--border); border-radius: 32px; overflow: hidden; box-shadow: 0 40px 100px rgba(0,0,0,0.3); }
                .cv-section-title { font-size: 11px; font-weight: 800; color: var(--accent); text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 24px; display: flex; align-items: center; gap: 12px; }
                .cv-section-title span { height: 1px; flex: 1; background: linear-gradient(to right, var(--accent), transparent); opacity: 0.3; }
                .quick-btn:hover { border-color: var(--accent) !important; background: rgba(108,99,255,0.08) !important; transform: translateY(-3px); }
                .skill-chip { font-size: 11px; font-weight: 700; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: "6px 14px"; border-radius: 50px; color: var(--text-primary); }

                @media print {
                    @page { size: A4 portrait; margin: 0; }
                    body { background: #0a0a0f !important; }
                    
                    /* Hide everything we don't need */
                    .hide-on-print { display: none !important; }
                    
                    /* Reset all paddings and margins that offset the print */
                    main { margin: 0 !important; padding: 0 !important; }
                    
                    /* Force the CV card to take the exact A4 dimensions */
                    #cv-card { 
                        width: 210mm !important;
                        height: 297mm !important; /* Fixed A4 height to prevent overflow/blank pages */
                        overflow: hidden !important; 
                        background: #0a0a0f !important; 
                        margin: 0 !important; 
                        border: none !important; 
                        border-radius: 0 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        box-shadow: none !important;
                    }
                    
                    /* Enforce text colors for links and labels to stay visible in PDF */
                    #cv-card * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
                    .gradient-text { background: none !important; color: #fff !important; -webkit-text-fill-color: initial !important; }
                }
            `}</style>
            
            <div className="hide-on-print" style={{ marginBottom: 40, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                    <p style={{ color: "var(--accent)", fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Live Portfolio Overview</p>
                    <h1 className="gradient-text" style={{ fontSize: "2.8rem", fontWeight: 900, letterSpacing: "-0.04em" }}>CV Preview</h1>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <DownloadPDFButton name={profile?.name} />
                    <div style={{ padding: "8px 16px", background: "rgba(108,99,255,0.1)", border: "1px solid rgba(108,99,255,0.3)", borderRadius: 50, color: "var(--accent)", fontSize: 11, fontWeight: 800 }}>
                        PORTFOLIO STATUS: ONLINE
                    </div>
                </div>
            </div>

            {/* ── HIGH-IMPACT CV PREVIEW ── */}
            <div id="cv-card" className="cv-card">

                {/* Header */}
                <div style={{ padding: "60px 48px", background: "linear-gradient(to bottom, rgba(255,255,255,0.02), transparent)", borderBottom: "1px solid var(--border)", display: "flex", gap: 40, alignItems: "center" }}>
                    <div style={{
                        width: 140, height: 140, borderRadius: "50%",
                        background: "linear-gradient(135deg, #6c63ff, #ff6584)", 
                        padding: 3, flexShrink: 0,
                        boxShadow: "0 0 50px rgba(108,99,255,0.3)",
                    }}>
                        <div style={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden", background: "var(--bg-primary)" }}>
                            {profile?.avatarUrl ? (
                                <img src={profile.avatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, fontWeight: 900, color: "var(--text-primary)" }}>MH</div>
                            )}
                        </div>
                    </div>
                    <div>
                        <h2 style={{ fontSize: "3rem", fontWeight: 900, marginBottom: 8, letterSpacing: "-0.02em" }}>{profile?.name || "Your Name"}</h2>
                        <p style={{ fontSize: "1.4rem", color: "var(--accent)", fontWeight: 700, marginBottom: 20 }}>{profile?.title || "Professional Title"}</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 14, color: "var(--text-muted)", fontSize: 13 }}>
                            {/* All social links in one row */}
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 24, marginBottom: 4 }}>
                                {profile?.socialLinks?.map((link, i) => (
                                    <a key={i} href={link.url} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "var(--text-primary)", fontWeight: 700 }}>
                                        <SocialIcon platform={link.platform} /> {link.platform}
                                    </a>
                                ))}
                            </div>

                            {/* Main Contact (Email & Address) */}
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 32, borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 14 }}>
                                {profile?.email && <span style={{ display: "flex", alignItems: "center", gap: 8 }}><Mail size={16} color="var(--accent)" /> {profile.email}</span>}
                                {profile?.address && <span style={{ display: "flex", alignItems: "center", gap: 8 }}><MapPin size={16} color="var(--accent)" /> {profile.address}</span>}
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 1, background: "var(--border)" }}>
                    {/* Main Column */}
                    <div style={{ background: "rgba(255,255,255,0.01)", padding: 48 }}>
                        
                        <section style={{ marginBottom: 48 }}>
                            <h3 className="cv-section-title"><UserCheck size={16} /> Profile Summary <span /></h3>
                            <p style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 16, color: "var(--text-primary)" }}>{profile?.aboutTitle ?? "Professional Summary"}</p>
                            <p style={{ lineHeight: 1.8, color: "var(--text-muted)", fontSize: 15 }}>{profile?.bio || "No biography added yet."}</p>
                        </section>

                        <section style={{ marginBottom: 48 }}>
                            <h3 className="cv-section-title"><Briefcase size={16} /> Professional Experience <span /></h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                                {experience.length > 0 ? experience.map(exp => (
                                    <div key={exp.id}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, marginBottom: 8 }}>
                                            <h4 style={{ fontWeight: 800, fontSize: 17, lineHeight: 1.3 }}>{exp.position}</h4>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)", whiteSpace: "nowrap", flexShrink: 0, marginTop: 3 }}>
                                                {new Date(exp.startDate).toLocaleDateString('en-GB')} — {exp.current ? "Present" : exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-GB') : ""}
                                            </span>
                                        </div>
                                        <p style={{ fontWeight: 700, color: "var(--text-muted)", marginBottom: 12, fontSize: 14 }}>{exp.company}</p>
                                        <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>{exp.description}</p>
                                    </div>
                                )) : <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Add your experience from the navigation below.</p>}
                            </div>
                        </section>

                        <section style={{ marginBottom: 48 }}>
                            <h3 className="cv-section-title"><GraduationCap size={16} /> Academic Background <span /></h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                                {education.length > 0 ? education.map(edu => (
                                    <div key={edu.id}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                            <h4 style={{ fontWeight: 800, fontSize: 16 }}>{edu.degree}</h4>
                                            <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 700 }}>{edu.current ? "Present" : (edu.passingYear || "Ongoing")}</span>
                                        </div>
                                        <p style={{ fontSize: 14, color: "var(--text-muted)", fontWeight: 600 }}>{edu.school}{edu.field ? ` • ${edu.field}` : ""}</p>
                                        {edu.grade && <p style={{ fontSize: 12, color: "var(--accent)", fontWeight: 700, marginTop: 4, letterSpacing: "0.02em" }}>{edu.gradeType}: {edu.grade} {edu.gradeScale ? `/ ${edu.gradeScale}` : ""}</p>}
                                    </div>
                                )) : <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Add your education from the navigation below.</p>}
                            </div>
                        </section>

                        {publications.length > 0 && (
                            <section>
                                <h3 className="cv-section-title"><BookOpen size={16} /> Publications <span /></h3>
                                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                                    {publications.map(pub => (
                                        <div key={pub.id}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                                                <h4 style={{ fontSize: 15, fontWeight: 800 }}>{pub.title}</h4>
                                                {pub.submitted && <span style={{ fontSize: 10, background: "rgba(255,100,0,0.1)", color: "#ff8c00", padding: "2px 8px", borderRadius: 4, border: "1px solid rgba(255,100,0,0.2)", fontWeight: 800 }}>SUBMITTED</span>}
                                            </div>
                                            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{pub.publisher} {pub.date && new Date(pub.date).getUTCFullYear() !== 1970 ? `• ${new Date(pub.date).toLocaleDateString('en-GB')}` : ""}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Sidebar Column */}
                    <div style={{ background: "rgba(255,255,255,0.02)", padding: 48 }}>
                        
                        {/* Skills Grouped */}
                        <section style={{ marginBottom: 45 }}>
                            <h3 className="cv-section-title"><Code size={16} /> Skills & Tech <span /></h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                                {Object.entries(
                                    skills.reduce((acc: any, skill: any) => {
                                        const cat = skill.category || "Other";
                                        if (!acc[cat]) acc[cat] = [];
                                        acc[cat].push(skill);
                                        return acc;
                                    }, {})
                                ).map(([category, items]: [string, any]) => (
                                    <div key={category}>
                                        <h4 style={{ fontSize: 11, fontWeight: 900, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>{category}</h4>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                            {items.map((skill: any) => (
                                                <span key={skill.id} className="skill-chip" style={{ padding: "6px 12px" }}>
                                                    {skill.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section style={{ marginBottom: 48 }}>
                            <h3 className="cv-section-title"><Award size={16} /> Certifications <span /></h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                                {certificates.map(cert => (
                                    <div key={cert.id}>
                                        <h4 style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.4 }}>{cert.title}</h4>
                                        <p style={{ fontSize: 12, color: "var(--accent)", fontWeight: 700 }}>{cert.issuer}</p>
                                        <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{cert.issuedAt && new Date(cert.issuedAt).getUTCFullYear() !== 1970 ? new Date(cert.issuedAt).toLocaleDateString('en-GB') : "Recent"}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {activities.length > 0 && (
                            <section style={{ marginBottom: 48 }}>
                                <h3 className="cv-section-title"><Rocket size={16} /> Activities <span /></h3>
                                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                                    {activities.slice(0, 4).map(act => (
                                        <div key={act.id}>
                                            <h4 style={{ fontSize: 13, fontWeight: 800 }}>{act.title}</h4>
                                            <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>{act.current ? act.role : `Former ${act.role}`}</p>
                                            <p style={{ fontSize: 11, color: "var(--accent)", fontWeight: 700 }}>
                                                {act.startDate ? new Date(act.startDate).toLocaleDateString('en-GB') : "N/A"} — {act.current ? "Present" : act.endDate ? new Date(act.endDate).toLocaleDateString('en-GB') : "N/A"}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}



                        {references.length > 0 && (
                            <section>
                                <h3 className="cv-section-title"><UserCheck size={16} /> References <span /></h3>
                                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                                    {references.slice(0, 2).map(ref => (
                                        <div key={ref.id}>
                                            <h4 style={{ fontSize: 14, fontWeight: 800 }}>{ref.name}</h4>
                                            <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>{ref.designation}<br />{ref.company}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>

            {/* ── MANAGE CV DATA ── */}
            <div className="hide-on-print" style={{ marginTop: 64 }}>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: 28, color: "var(--text-primary)" }}>Management Dashboard</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 20 }}>
                    {adminCards.map((card) => (
                        <Link key={card.href} href={card.href} style={{ textDecoration: "none" }}>
                            <div className="glass quick-btn" style={{
                                padding: "28px 20px", textAlign: "center",
                                border: "1px solid var(--border)", borderRadius: 20,
                                transition: "all 0.3s ease",
                            }}>
                                <div style={{ fontSize: 32, marginBottom: 12 }}>{card.icon}</div>
                                <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-primary)" }}>{card.title}</div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}


