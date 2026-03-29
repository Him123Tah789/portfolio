import { Sidebar } from "@/components/admin/Sidebar";
import ClientInteractivity from "@/components/ClientInteractivity";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect("/login?from=%2Fadmin");
    }

    return (
        <div style={{
            display: "flex",
            minHeight: "100vh",
            backgroundColor: "var(--bg-primary)",
            color: "var(--text-primary)",
            position: "relative",
            overflow: "hidden"
        }}>
            {/* ── Background Layer ── */}
            <div className="dot-pattern" style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }} />

            <ClientInteractivity />

            {/* Glow blobs - repositioned to be visible above the primary bg but behind content */}
            <div className="glow-circle" style={{ zIndex: 0, width: 800, height: 800, background: "rgba(108, 99, 255, 0.15)", filter: "blur(120px)", top: 0, left: 0 }} />
            <div className="glow-circle" style={{ zIndex: 0, width: 600, height: 600, background: "rgba(255, 101, 132, 0.18)", filter: "blur(100px)", top: 0, left: 0 }} />
            <div className="glow-circle" style={{ zIndex: 0, width: 700, height: 700, background: "rgba(59, 130, 246, 0.15)", filter: "blur(110px)", top: 0, left: 0 }} />
            <div className="glow-circle" style={{ zIndex: 0, width: 900, height: 900, background: "rgba(234, 179, 8, 0.15)", filter: "blur(130px)", top: 0, left: 0 }} />

            {/* ── Content Layer ── */}
            <Sidebar />
            <main style={{
                marginLeft: 260,
                flex: 1,
                padding: "40px 5% 60px",
                position: "relative",
                zIndex: 10, // Ensure content is above the background
                minHeight: "100vh"
            }}>
                <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                    {children}
                </div>
            </main>
        </div>
    );
}
