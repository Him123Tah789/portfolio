"use client";

import { useState, useEffect } from "react";
const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 16px",
    background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)",
    borderRadius: 12, fontSize: 14, color: "var(--text-primary)", outline: "none",
    transition: "border-color 0.2s", boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 11, fontWeight: 700,
    color: "var(--text-muted)", marginBottom: 8,
    textTransform: "uppercase", letterSpacing: "0.05em",
};

const Field = ({ label, name, type = "text", placeholder = "", value, onChange, textarea = false }: any) => (
    <div style={{ width: "100%" }}>
        <label style={labelStyle}>{label}</label>
        {textarea ? (
            <textarea
                name={name} value={value} onChange={onChange} placeholder={placeholder} required rows={10}
                style={{ ...inputStyle, lineHeight: 1.6, resize: "vertical", fontFamily: "monospace" }}
                onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
                onBlur={(e) => e.target.style.borderColor = "var(--border)"}
            />
        ) : (
            <input
                type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} required
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
                onBlur={(e) => e.target.style.borderColor = "var(--border)"}
            />
        )}
    </div>
);

export default function PostsAdmin() {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingPost, setEditingPost] = useState<any | null>(null);
    const [editSaving, setEditSaving] = useState(false);
    
    // Create form state
    const [formData, setFormData] = useState({ title: "", content: "", slug: "", published: true });

    useEffect(() => {
        fetch("/api/posts").then((res) => res.json()).then((data) => {
            setPosts(Array.isArray(data) ? data : []);
            setLoading(false);
        });
    }, []);

    const slugify = (text: string) => {
        return text.toString().toLowerCase()
            .replace(/\s+/g, '-')           // Replace spaces with -
            .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
            .replace(/\-\-+/g, '-')         // Replace multiple - with single -
            .replace(/^-+/, '')             // Trim - from start of text
            .replace(/-+$/, '');            // Trim - from end of text
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const title = e.target.value;
        setFormData({ ...formData, title, slug: slugify(title) });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        const res = await fetch("/api/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        });
        if (res.ok) {
            const newPost = await res.json();
            setPosts([newPost, ...posts]);
            setFormData({ title: "", content: "", slug: "", published: true });
        }
        setSaving(false);
    };

    const handleEditSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingPost) return;
        setEditSaving(true);
        const form = new FormData(e.currentTarget);
        const data: any = Object.fromEntries(form.entries());
        data.published = form.get("published") === "on";
        data.id = editingPost.id;

        const res = await fetch("/api/posts", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (res.ok) {
            const result = await res.json();
            setPosts(posts.map(p => p.id === result.id ? result : p));
            setEditingPost(null);
        }
        setEditSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this blog post?")) return;
        const res = await fetch(`/api/posts?id=${id}`, { method: "DELETE" });
        if (res.ok) setPosts(posts.filter((p) => p.id !== id));
    };

    if (loading) return <p style={{ color: "var(--text-muted)", padding: 40, textAlign: "center" }}>Loading articles...</p>;

    return (
        <div style={{ maxWidth: 1000, paddingBottom: 100 }}>
            <div style={{ marginBottom: 40 }}>
                <p style={{ color: "var(--accent)", fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Journal</p>
                <h1 className="gradient-text" style={{ fontSize: "2.6rem", fontWeight: 900 }}>Manage Blog</h1>
            </div>

            {/* ── CREATE FORM ── */}
            <form onSubmit={handleSubmit} className="glass" style={{ padding: 40, border: "1px solid var(--border)", marginBottom: 48 }}>
                <h2 style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: 32, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ width: 3, height: 20, background: "var(--accent)", borderRadius: 4 }} />
                    Write New Article
                </h2>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
                    <Field label="Post Title" name="title" value={formData.title} onChange={handleTitleChange} placeholder="A catchy title..." />
                    <Field label="Domain Link (Slug)" name="slug" value={formData.slug} onChange={(e: any) => setFormData({...formData, slug: e.target.value})} placeholder="url-friendly-slug" />
                </div>

                <div style={{ marginBottom: 24 }}>
                    <Field label="Content (Markdown)" name="content" textarea value={formData.content} onChange={(e: any) => setFormData({...formData, content: e.target.value})} placeholder="Markdown supported..." />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.02)", padding: 20, borderRadius: 16, border: "1px solid var(--border)" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 700, color: "var(--text-primary)", cursor: "pointer" }}>
                        <input type="checkbox" checked={formData.published} onChange={(e) => setFormData({...formData, published: e.target.checked})} style={{ accentColor: "var(--accent)", width: 18, height: 18 }} />
                        Publish immediately
                    </label>
                    <button type="submit" className="btn-glow" disabled={saving}>
                        {saving ? "Publishing..." : "Post Article"}
                    </button>
                </div>
            </form>

            {/* ── LIST ── */}
            <div className="glass" style={{ border: "1px solid var(--border)", overflow: "hidden" }}>
                <div style={{ padding: "24px 32px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ fontWeight: 800, fontSize: "1.1rem" }}>Journal Entries</h3>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", background: "rgba(255,255,255,0.05)", padding: "4px 14px", borderRadius: 50 }}>{posts.length} ARTICLES</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column" }}>
                    {posts.length === 0 ? (
                        <p style={{ padding: 60, textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>No articles yet.</p>
                    ) : posts.map((post) => (
                        <div key={post.id} style={{ padding: "20px 32px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "background 0.2s" }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                            <div>
                                <h3 style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)", marginBottom: 4 }}>{post.title}</h3>
                                <p style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
                                    /{post.slug} • {new Date(post.createdAt).toLocaleDateString('en-GB')} •
                                    <span style={{ marginLeft: 8, color: post.published ? "var(--accent)" : "#ffb347", fontWeight: 800 }}>{post.published ? "PUBLISHED" : "DRAFT"}</span>
                                </p>
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                                <button onClick={() => setEditingPost(post)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "var(--text-primary)", cursor: "pointer", fontSize: 12, padding: "7px 14px", borderRadius: 8, fontWeight: 700 }}>Edit</button>
                                <button onClick={() => handleDelete(post.id)} style={{ background: "rgba(255,59,59,0.08)", border: "1px solid rgba(255,59,59,0.2)", color: "#ff6b6b", cursor: "pointer", fontSize: 12, padding: "7px 14px", borderRadius: 8, fontWeight: 700 }}>Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── EDIT MODAL ── */}
            {editingPost && (
                <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={() => setEditingPost(null)}>
                    <div className="glass" style={{ width: "100%", maxWidth: 800, padding: 48, borderRadius: 24, border: "1px solid var(--border)", maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
                        <h2 style={{ fontWeight: 800, fontSize: "1.3rem", marginBottom: 32 }}>Edit Journal Entry</h2>
                        <form onSubmit={handleEditSave}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
                                <div style={{ width: "100%" }}>
                                    <label style={labelStyle}>Title</label>
                                    <input name="title" defaultValue={editingPost.title} required style={inputStyle} />
                                </div>
                                <div style={{ width: "100%" }}>
                                    <label style={labelStyle}>Slug</label>
                                    <input name="slug" defaultValue={editingPost.slug} required style={inputStyle} />
                                </div>
                            </div>
                            <div style={{ marginBottom: 24 }}>
                                <label style={labelStyle}>Content (Markdown)</label>
                                <textarea name="content" defaultValue={editingPost.content} required rows={12} style={{ ...inputStyle, lineHeight: 1.6, resize: "vertical", fontFamily: "monospace" }} />
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>
                                    <input type="checkbox" name="published" defaultChecked={editingPost.published} style={{ accentColor: "var(--accent)", width: 18, height: 18 }} />
                                    Published
                                </label>
                                <div style={{ display: "flex", gap: 12 }}>
                                    <button type="button" onClick={() => setEditingPost(null)} style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", padding: "10px 20px", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                                    <button type="submit" className="btn-glow" disabled={editSaving}>{editSaving ? "Saving..." : "Apply Changes"}</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
