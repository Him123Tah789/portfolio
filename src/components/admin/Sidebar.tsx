"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";

const navigation = [
    { name: "Dashboard",       href: "/admin",              icon: "⚡" },
    { name: "About",           href: "/admin/profile",      icon: "👤" },
    { name: "Education",       href: "/admin/education",    icon: "🎓" },
    { name: "Experience",      href: "/admin/experience",   icon: "💼" },
    { name: "Projects",        href: "/admin/projects",     icon: "🚀" },
    { name: "Skills",          href: "/admin/skills",       icon: "🧠" },
    { name: "Certificates",    href: "/admin/certificates", icon: "📜" },
    { name: "Activities",      href: "/admin/activities",   icon: "🏅" },
    { name: "Publications",    href: "/admin/publications", icon: "📚" },
    { name: "References",      href: "/admin/references",   icon: "🤝" },
    { name: "Blog Posts",      href: "/admin/posts",        icon: "✍️" },
];

export function Sidebar() {
    const pathname = usePathname();
    const [profile, setProfile] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/profile")
            .then((r) => r.json())
            .then(setProfile)
            .catch((err) => {
                console.error("Sidebar profile fetch error:", err);
                setError(err.message);
            });
    }, []);

    // Re-fetch whenever we navigate to pick up a fresh avatar
    useEffect(() => {
        fetch("/api/profile")
            .then((r) => r.json())
            .then(setProfile)
            .catch((err) => {
                console.error("Sidebar profile fetch error on navigate:", err);
                setError(err.message);
            });
    }, [pathname]);

    const initials = (profile?.name ?? "M").charAt(0).toUpperCase();

    if (error) {
        console.warn("Sidebar rendering with error state:", error);
    }

    return (
        <div className="hide-on-print" style={{
            width: 260,
            minHeight: "100vh",
            background: "var(--bg-nav)",
            backdropFilter: "blur(24px)",
            borderRight: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            position: "fixed",
            top: 0,
            left: 0,
            bottom: 0,
            zIndex: 40,
        }}>
            {/* ── Brand header ── */}
            <div style={{ padding: "28px 24px 20px", borderBottom: "1px solid var(--border)" }}>
                <Link href="/" style={{ textDecoration: "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                        <div style={{ color: "var(--text-primary)", width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, #6c63ff, #ff6584)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 16 }}>{initials}</div>
                        <span className="gradient-text" style={{ fontWeight: 800, fontSize: "1rem" }}>Admin Portal</span>
                    </div>
                </Link>

                {/* ── Avatar ── */}
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{
                        width: 52, height: 52, borderRadius: "50%",
                        background: "linear-gradient(135deg, #6c63ff, #ff6584)",
                        padding: 2, flexShrink: 0,
                        boxShadow: "0 0 20px rgba(108,99,255,0.4)",
                    }}>
                        <div style={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden", background: "var(--avatar-bg)" }}>
                            {profile?.avatarUrl ? (
                                <img src={profile.avatarUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 20, color: "var(--text-primary)" }}>
                                    {initials}
                                </div>
                            )}
                        </div>
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {profile?.name || "Admin"}
                        </p>
                        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {profile?.title || "Administrator"}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Navigation ── */}
            <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
                {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.href} href={item.href} style={{
                            padding: "10px 14px",
                            borderRadius: 10,
                            textDecoration: "none",
                            color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                            fontSize: 13,
                            fontWeight: 600,
                            background: isActive ? "rgba(108, 99, 255, 0.15)" : "transparent",
                            border: isActive ? "1px solid rgba(108, 99, 255, 0.3)" : "1px solid transparent",
                            transition: "all 0.18s ease",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                        }}>
                            <span style={{ fontSize: 15, width: 20, textAlign: "center" }}>{item.icon}</span>
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* ── Footer ── */}
            <div style={{ padding: "16px 12px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 8 }}>
                {/* View portfolio */}
                <Link href="/" target="_blank" style={{
                    padding: "10px 14px", borderRadius: 10, textDecoration: "none",
                    color: "var(--text-muted)", fontSize: 13, fontWeight: 600,
                    border: "1px solid var(--border)", transition: "all 0.18s",
                    display: "flex", alignItems: "center", gap: 10,
                }}>
                    <span style={{ fontSize: 15 }}>🌐</span> View Portfolio
                </Link>
                {/* Sign out */}
                <button onClick={() => signOut({ callbackUrl: "/login" })} style={{
                    width: "100%", padding: "10px 14px", borderRadius: 10,
                    border: "1px solid rgba(220, 38, 38, 0.2)",
                    background: "rgba(220, 38, 38, 0.05)", cursor: "pointer",
                    color: "#ff4d4d", fontSize: 13, fontWeight: 600,
                    display: "flex", alignItems: "center", gap: 10,
                    transition: "all 0.18s",
                }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(220,38,38,0.15)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(220,38,38,0.05)"; }}
                >
                    <span style={{ fontSize: 15 }}>🚪</span> Sign Out
                </button>
                {/* Theme Toggle in Admin Panel */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 14px", marginTop: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)" }}>Theme</span>
                    <ThemeToggle />
                </div>
            </div>
        </div>
    );
}
