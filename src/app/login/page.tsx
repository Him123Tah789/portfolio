"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });
        if (result?.error) {
            setError("Invalid email or password.");
            setLoading(false);
        } else {
            router.push("/admin");
        }
    };

    return (
        <main className="dot-pattern" style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--bg-primary)",
        }}>
            <div style={{
                width: "100%",
                maxWidth: 420,
                padding: "0 20px",
            }}>
                <div className="glass" style={{ padding: 48, border: "1px solid var(--border)" }}>
                    <div style={{ textAlign: "center", marginBottom: 40 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg, #6c63ff, #ff6584)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 24, margin: "0 auto 20px" }}>M</div>
                        <h1 className="gradient-text" style={{ fontSize: "2.2rem", fontWeight: 900, marginBottom: 12, letterSpacing: "-0.04em" }}>Admin Portal</h1>
                        <p style={{ color: "var(--text-muted)", fontSize: 14, fontWeight: 500 }}>Sign in to manage your digital presence</p>
                    </div>

                    {error && (
                        <div style={{
                            padding: "12px 16px",
                            background: "rgba(255,100,100,0.1)",
                            border: "1px solid rgba(255,100,100,0.2)",
                            borderRadius: 10,
                            color: "#ff6b6b",
                            fontSize: 14,
                            marginBottom: 20,
                        }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div>
                            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-muted)", marginBottom: 6 }}>Email</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="admin@example.com"
                                style={{
                                    width: "100%",
                                    padding: "12px 16px",
                                    background: "rgba(255,255,255,0.06)",
                                    border: "1px solid var(--border)",
                                    borderRadius: 10,
                                    color: "var(--text-primary)",
                                    fontSize: 15,
                                    outline: "none",
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-muted)", marginBottom: 6 }}>Password</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                style={{
                                    width: "100%",
                                    padding: "12px 16px",
                                    background: "rgba(255,255,255,0.06)",
                                    border: "1px solid var(--border)",
                                    borderRadius: 10,
                                    color: "var(--text-primary)",
                                    fontSize: 15,
                                    outline: "none",
                                }}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-glow"
                            style={{ marginTop: 8, textAlign: "center" }}
                        >
                            {loading ? "Signing in…" : "Sign In"}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}
