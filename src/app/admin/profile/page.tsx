"use client";

import { useState, useEffect, useCallback } from "react";
import Cropper from "react-easy-crop";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { GripVertical } from "lucide-react";

// ── helpers ─────────────────────────────────────────────────────────────────
function DroppableFix({ children, ...props }: any) {
    const [enabled, setEnabled] = useState(false);
    useEffect(() => {
        const animation = requestAnimationFrame(() => setEnabled(true));
        return () => {
            cancelAnimationFrame(animation);
            setEnabled(false);
        };
    }, []);
    if (!enabled) return null;
    return <Droppable {...props}>{children}</Droppable>;
}

async function getCroppedImg(imageSrc: string, croppedAreaPixels: any): Promise<string | null> {
    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve) => { image.onload = resolve; });

    const canvas = document.createElement("canvas");
    // Always output 400×400 for a crisp circle avatar
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0, 0,
        400, 400
    );
    return canvas.toDataURL("image/png");
}

const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 16px",
    background: "var(--bg-section)", border: "1px solid var(--border)",
    borderRadius: 12, fontSize: 14, color: "var(--text-primary)", outline: "none",
    transition: "border-color 0.2s",
};

const Field = ({ label, name, type = "text", defaultValue }: any) => (
    <div>
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>
        <input type={type} name={name} defaultValue={defaultValue ?? ""}
            style={inputStyle}
            onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
            onBlur={(e) => e.target.style.borderColor = "var(--border)"}
        />
    </div>
);

// ── component ────────────────────────────────────────────────────────────────
export default function ProfileAdmin() {
    const [profile, setProfile]       = useState<any>(null);
    const [loading, setLoading]       = useState(true);
    const [saving, setSaving]         = useState(false);
    const [toast, setToast]           = useState<{ type: "success" | "error"; msg: string } | null>(null);
    const [socialLinks, setSocialLinks] = useState<any[]>([]);

    // Crop state
    const [imageSrc, setImageSrc]               = useState<string | null>(null);
    const [crop, setCrop]                        = useState({ x: 0, y: 0 });
    const [zoom, setZoom]                        = useState(1);
    const [rotation, setRotation]                = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [showCropper, setShowCropper]          = useState(false);
    const [uploading, setUploading]              = useState(false);
    const [uploadingResume, setUploadingResume]  = useState(false);
    const [dragOver, setDragOver]                = useState(false);

    useEffect(() => {
        fetch("/api/profile")
            .then((r) => r.json())
            .then((d) => {
                setProfile(d);
                // Ensure every link has an id for DND keys
                const links = (d?.socialLinks || []).map((l: any, idx: number) => ({
                    ...l,
                    id: l.id || `init-${idx}-${Date.now()}`
                }));
                setSocialLinks(links);
                setLoading(false);
            });
    }, []);

    const showToast = (type: "success" | "error", msg: string) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    };

    const onCropComplete = useCallback((_: any, cap: any) => {
        setCroppedAreaPixels(cap);
    }, []);

    const loadFile = (file: File) => {
        const reader = new FileReader();
        reader.addEventListener("load", () => {
            setImageSrc(reader.result as string);
            setCrop({ x: 0, y: 0 });
            setZoom(1);
            setRotation(0);
            setShowCropper(true);
        });
        reader.readAsDataURL(file);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) loadFile(e.target.files[0]);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith("image/")) loadFile(file);
    };

    const handleUpload = async () => {
        if (!imageSrc || !croppedAreaPixels) return;
        setUploading(true);
        try {
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
            if (!croppedImage) return;

            const res = await fetch("/api/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: croppedImage }),
            });

            if (res.ok) {
                const { url } = await res.json();
                setProfile((p: any) => ({ ...p, avatarUrl: url + "?t=" + Date.now() }));
                setShowCropper(false);
                showToast("success", "Profile photo updated!");
            } else {
                showToast("error", "Upload failed. Please try again.");
            }
        } catch {
            showToast("error", "Upload error. Please try again.");
        }
        setUploading(false);
    };

    const handleAddLink = () => {
        if (socialLinks.length >= 10) { showToast("error", "Maximum 10 social links allowed."); return; }
        setSocialLinks([...socialLinks, { id: `new-${Date.now()}`, platform: "GitHub", url: "" }]);
    };

    const handleResumeFile = async (file: File) => {
        if (!file) return;
        setUploadingResume(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("fileName", `${(profile?.name || "resume").replace(/\s+/g, "_")}_resume`);

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                showToast("error", "Document upload failed.");
                return;
            }

            const { url } = await res.json();
            setProfile((p: any) => ({ ...p, resumeUrl: url }));
            showToast("success", "Document uploaded successfully.");
        } catch {
            showToast("error", "Document upload error.");
        } finally {
            setUploadingResume(false);
        }
    };
    const handleRemoveLink = (i: number) => setSocialLinks(socialLinks.filter((_, idx) => idx !== i));
    const handleLinkChange = (i: number, field: string, value: string) => {
        const n = [...socialLinks]; n[i][field] = value; setSocialLinks(n);
    };

    const onDragEnd = (result: any) => {
        if (!result.destination) return;
        const items = Array.from(socialLinks);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        setSocialLinks(items);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        const form = new FormData(e.currentTarget);
        const data = Object.fromEntries(form.entries());

        const res = await fetch("/api/profile", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...data, avatarUrl: profile?.avatarUrl, resumeUrl: profile?.resumeUrl, socialLinks }),
        });
        setSaving(false);
        if (res.ok) showToast("success", "Profile saved successfully!");
        else showToast("error", "Save failed. Please try again.");
    };

    if (loading) return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, gap: 16, color: "var(--text-muted)" }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid var(--accent)", borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
            Loading profile…
        </div>
    );

    return (
        <div style={{ maxWidth: 860 }}>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes toastIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
                .upload-zone:hover { border-color: var(--accent) !important; background: rgba(108,99,255,0.06) !important; }
                .remove-link-btn:hover { background: rgba(255,77,77,0.15) !important; }
                .social-row:hover .drag-handle { opacity: 1 !important; transform: translateX(0) !important; }
            `}</style>

            {/* ── Header ── */}
            <div style={{ marginBottom: 40 }}>
                <p style={{ color: "var(--accent)", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Admin</p>
                <h1 className="gradient-text" style={{ fontSize: "2.4rem", fontWeight: 900, letterSpacing: "-0.04em" }}>About Me Settings</h1>
            </div>

            {/* ── Toast ── */}
            {toast && (
                <div style={{
                    position: "fixed", bottom: 32, right: 32, zIndex: 9999,
                    padding: "14px 24px", borderRadius: 14, fontWeight: 600, fontSize: 14,
                    background: toast.type === "success" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                    border: `1px solid ${toast.type === "success" ? "rgba(34,197,94,0.5)" : "rgba(239,68,68,0.5)"}`,
                    color: toast.type === "success" ? "#4ade80" : "#f87171",
                    backdropFilter: "blur(16px)",
                    animation: "toastIn 0.3s ease",
                    display: "flex", alignItems: "center", gap: 10,
                }}>
                    {toast.type === "success" ? "✓" : "✕"} {toast.msg}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* ── Avatar Card ── */}
                <div className="glass" style={{ padding: 40, border: "1px solid var(--border)", marginBottom: 24 }}>
                    <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 28, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ width: 3, height: 20, background: "var(--accent)", borderRadius: 4, display: "inline-block" }} />
                        Profile Photo
                    </h2>
                    <div style={{ display: "flex", alignItems: "center", gap: 40, flexWrap: "wrap" }}>
                        {/* Avatar preview */}
                        <div style={{ position: "relative", flexShrink: 0 }}>
                            <div style={{
                                width: 140, height: 140, borderRadius: "50%",
                                background: "linear-gradient(135deg, #6c63ff, #ff6584)",
                                padding: 3,
                                boxShadow: "0 0 40px rgba(108,99,255,0.4)",
                            }}>
                                <div style={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden", background: "#0a0a0f" }}>
                                    {profile?.avatarUrl ? (
                                        <img src={profile.avatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    ) : (
                                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, fontWeight: 900, color: "var(--text-primary)" }}>
                                            {(profile?.name?.[0] || "M").toUpperCase()}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* Camera badge */}
                            <label htmlFor="avatar-input" style={{
                                position: "absolute", bottom: 4, right: 4,
                                width: 36, height: 36, borderRadius: "50%",
                                background: "linear-gradient(135deg, #6c63ff, #ff6584)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer", fontSize: 16,
                                boxShadow: "0 4px 14px rgba(0,0,0,0.5)",
                                border: "2px solid #0a0a0f",
                            }} title="Upload new photo">📷</label>
                        </div>

                        {/* Drop zone */}
                        <div
                            className="upload-zone"
                            onDrop={handleDrop}
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            style={{
                                flex: 1, minWidth: 220,
                                border: `2px dashed ${dragOver ? "var(--accent)" : "var(--border)"}`,
                                borderRadius: 16, padding: "28px 24px",
                                textAlign: "center", cursor: "pointer",
                                background: dragOver ? "rgba(108,99,255,0.06)" : "transparent",
                                transition: "all 0.2s",
                            }}
                            onClick={() => document.getElementById("avatar-input")?.click()}
                        >
                            <div style={{ fontSize: 32, marginBottom: 12 }}>🖼️</div>
                            <p style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)", marginBottom: 6 }}>
                                Drag &amp; drop or click to upload
                            </p>
                            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>PNG, JPG, WEBP — max 10 MB</p>
                            <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>
                                You'll get a crop &amp; resize editor before saving
                            </p>
                        </div>

                        <input id="avatar-input" type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
                    </div>
                </div>

                {/* ── Basic Info ── */}
                <div className="glass" style={{ padding: 40, border: "1px solid var(--border)", marginBottom: 24 }}>
                    <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 28, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ width: 3, height: 20, background: "var(--accent)", borderRadius: 4, display: "inline-block" }} />
                        Basic Information
                    </h2>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
                        <Field label="Full Name" name="name" defaultValue={profile?.name ?? ""} />
                        <Field label="Professional Title" name="title" defaultValue={profile?.title ?? ""} />
                    </div>
                    <div style={{ marginBottom: 24 }}>
                        <Field label="About Section Title" name="aboutTitle" defaultValue={profile?.aboutTitle ?? "Passionate about building things that matter"} />
                    </div>
                    <div style={{ marginBottom: 24 }}>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Bio / About Me</label>
                        <textarea name="bio" rows={5} defaultValue={profile?.bio ?? ""}
                            style={{ ...inputStyle, lineHeight: 1.7, resize: "vertical" }}
                            onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
                            onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                        />
                    </div>
                    <div style={{ marginBottom: 24 }}>
                        <Field label="Present Address" name="address" defaultValue={profile?.address ?? ""} />
                    </div>
                    <div style={{ marginBottom: 24 }}>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Resume / Document</label>
                        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                            <button
                                type="button"
                                onClick={() => document.getElementById("resume-input")?.click()}
                                style={{
                                    border: "1px solid var(--border)",
                                    borderRadius: 10,
                                    background: "var(--bg-section)",
                                    color: "var(--text-primary)",
                                    padding: "10px 14px",
                                    cursor: "pointer",
                                    fontSize: 13,
                                    fontWeight: 600,
                                }}
                                disabled={uploadingResume}
                            >
                                {uploadingResume ? "Uploading..." : "Upload Document"}
                            </button>
                            {profile?.resumeUrl ? (
                                <a href={profile.resumeUrl} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", fontSize: 13, textDecoration: "none", fontWeight: 600 }}>
                                    View Uploaded File
                                </a>
                            ) : (
                                <span style={{ color: "var(--text-muted)", fontSize: 13 }}>No file uploaded</span>
                            )}
                        </div>
                        <p style={{ marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>
                            Supports PDF, DOC, DOCX, ZIP, TXT, images, and most file types (max 20MB).
                        </p>
                        <input
                            id="resume-input"
                            type="file"
                            style={{ display: "none" }}
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) void handleResumeFile(file);
                            }}
                        />
                    </div>
                    <Field label="Primary Email Address" name="email" type="email" defaultValue={profile?.email ?? ""} />
                </div>

                {/* ── Social Links ── */}
                <div className="glass" style={{ padding: 40, border: "1px solid var(--border)", marginBottom: 32 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
                        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ width: 3, height: 20, background: "var(--accent)", borderRadius: 4, display: "inline-block" }} />
                            Social Profiles
                        </h2>
                        <button type="button" onClick={handleAddLink} style={{
                            background: "rgba(108,99,255,0.12)", border: "1px solid rgba(108,99,255,0.4)",
                            color: "var(--accent)", padding: "7px 16px", borderRadius: 8,
                            fontSize: 12, fontWeight: 700, cursor: "pointer", letterSpacing: "0.04em",
                        }}>+ ADD LINK</button>
                    </div>
                    <DragDropContext onDragEnd={onDragEnd}>
                        <DroppableFix droppableId="social-links">
                            {(provided: any) => (
                                <div {...provided.droppableProps} ref={provided.innerRef} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                    {socialLinks.map((link, i) => (
                                        <Draggable key={link.id} draggableId={String(link.id)} index={i}>
                                            {(provided: any, snapshot: any) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    className="social-row"
                                                    style={{
                                                        ...provided.draggableProps.style,
                                                        display: "flex",
                                                        gap: 16,
                                                        alignItems: "flex-end",
                                                        background: snapshot.isDragging ? "rgba(108,99,255,0.06)" : "rgba(108,99,255,0.02)",
                                                        padding: "16px",
                                                        borderRadius: "16px",
                                                        border: "1px solid var(--border)",
                                                        borderColor: snapshot.isDragging ? "var(--accent)" : "var(--border)",
                                                        boxShadow: snapshot.isDragging ? "0 10px 40px rgba(108,99,255,0.15)" : "none",
                                                        transition: "all 0.2s ease",
                                                        zIndex: snapshot.isDragging ? 100 : 1
                                                    }}
                                                >
                                                    <div {...provided.dragHandleProps} className="drag-handle"
                                                        style={{ color: "var(--text-muted)", cursor: "grab", opacity: 0.3, transition: "all 0.2s", marginBottom: 12 }}>
                                                        <GripVertical size={20} />
                                                    </div>
                                                    <div style={{ width: 160, flexShrink: 0 }}>
                                                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase" }}>Platform</label>
                                                        <select value={link.platform} onChange={(e) => handleLinkChange(i, "platform", e.target.value)}
                                                            style={{ 
                                                                ...inputStyle, 
                                                                padding: "11px 16px",
                                                                appearance: "none",
                                                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236c63ff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                                                                backgroundRepeat: "no-repeat",
                                                                backgroundPosition: "right 12px center",
                                                                backgroundSize: "16px",
                                                                cursor: "pointer"
                                                            }}>
                                                            {["GitHub", "LinkedIn", "Twitter", "Instagram", "Facebook", "Portfolio", "YouTube", "Other"].map(p => (
                                                                <option key={p} value={p} style={{ background: "var(--bg-card)", color: "var(--text-primary)" }}>{p}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase" }}>URL</label>
                                                        <input type="url" value={link.url} onChange={(e) => handleLinkChange(i, "url", e.target.value)}
                                                            placeholder="https://..." style={{ ...inputStyle, padding: "11px 16px" }}
                                                            onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
                                                            onBlur={(e) => e.target.style.borderColor = "var(--border)"} />
                                                    </div>
                                                    <button type="button" className="remove-link-btn" onClick={() => handleRemoveLink(i)} style={{
                                                        background: "rgba(255,77,77,0.08)", border: "1px solid rgba(255,77,77,0.3)",
                                                        color: "#ff4d4d", padding: "11px 14px", borderRadius: 12, cursor: "pointer",
                                                        fontSize: 16, lineHeight: 1, transition: "background 0.2s", flexShrink: 0,
                                                    }}>✕</button>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </DroppableFix>
                    </DragDropContext>
                    {socialLinks.length === 0 && (
                        <p style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", padding: "28px 20px", border: "1px dashed var(--border)", borderRadius: 12 }}>
                            No social links yet — click <strong>+ ADD LINK</strong> to get started.
                        </p>
                    )}
                </div>

                {/* ── Section Titles Customization ── */}
                <div className="glass" style={{ padding: 40, border: "1px solid var(--border)", marginBottom: 32 }}>
                    <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 28, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ width: 3, height: 20, background: "var(--accent)", borderRadius: 4, display: "inline-block" }} />
                        Page Section Customization
                    </h2>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px 24px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)", borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>🎓 Education</p>
                            <Field label="Title" name="educationTitle" defaultValue={profile?.educationTitle} />
                            <Field label="Subtitle" name="educationSubtitle" defaultValue={profile?.educationSubtitle} />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)", borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>💼 Experience</p>
                            <Field label="Title" name="experienceTitle" defaultValue={profile?.experienceTitle} />
                            <Field label="Subtitle" name="experienceSubtitle" defaultValue={profile?.experienceSubtitle} />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)", borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>🛠️ Skills</p>
                            <Field label="Title" name="skillsTitle" defaultValue={profile?.skillsTitle} />
                            <Field label="Subtitle" name="skillsSubtitle" defaultValue={profile?.skillsSubtitle} />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)", borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>🚀 Projects</p>
                            <Field label="Title" name="projectsTitle" defaultValue={profile?.projectsTitle} />
                            <Field label="Subtitle" name="projectsSubtitle" defaultValue={profile?.projectsSubtitle} />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)", borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>🏆 Certificates</p>
                            <Field label="Title" name="certificatesTitle" defaultValue={profile?.certificatesTitle} />
                            <Field label="Subtitle" name="certificatesSubtitle" defaultValue={profile?.certificatesSubtitle} />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)", borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>📝 Publications</p>
                            <Field label="Title" name="publicationsTitle" defaultValue={profile?.publicationsTitle} />
                            <Field label="Subtitle" name="publicationsSubtitle" defaultValue={profile?.publicationsSubtitle} />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)", borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>✨ Extra-Curricular</p>
                            <Field label="Title" name="activitiesTitle" defaultValue={profile?.activitiesTitle} />
                            <Field label="Subtitle" name="activitiesSubtitle" defaultValue={profile?.activitiesSubtitle} />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)", borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>🤝 References</p>
                            <Field label="Title" name="referencesTitle" defaultValue={profile?.referencesTitle} />
                            <Field label="Subtitle" name="referencesSubtitle" defaultValue={profile?.referencesSubtitle} />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)", borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>✍️ Blog/Journal</p>
                            <Field label="Title" name="blogTitle" defaultValue={profile?.blogTitle} />
                            <Field label="Subtitle" name="blogSubtitle" defaultValue={profile?.blogSubtitle} />
                        </div>
                    </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", background: "rgba(255,255,255,0.02)", padding: 20, borderRadius: 16, border: "1px solid var(--border)", marginTop: 8 }}>

                    <button type="submit" className="btn-glow" disabled={saving} style={{ padding: "14px 40px", fontSize: 15 }}>
                        {saving ? "Saving…" : "Save Profile"}
                    </button>
                </div>
            </form>

            {/* ── Crop Modal ── */}
            {showCropper && imageSrc && (
                <div style={{
                    position: "fixed", inset: 0,
                    background: "rgba(0,0,0,0.92)", backdropFilter: "blur(12px)",
                    zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
                }}>
                    <div className="glass" style={{ width: "100%", maxWidth: 580, padding: "36px 32px", border: "1px solid var(--border)" }}>
                        <h2 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: 8 }}>Crop &amp; Resize Photo</h2>
                        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24 }}>Drag to reposition · Scroll or use slider to zoom</p>

                        {/* Cropper area */}
                        <div style={{ position: "relative", width: "100%", height: 360, background: "#000", borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)" }}>
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                rotation={rotation}
                                aspect={1}
                                cropShape="round"
                                showGrid={false}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                            />
                        </div>

                        {/* Controls */}
                        <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                            <div>
                                <label style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 10, textTransform: "uppercase" }}>
                                    <span>Zoom</span>
                                    <span style={{ color: "var(--text-primary)" }}>{zoom.toFixed(1)}×</span>
                                </label>
                                <input type="range" min={1} max={3} step={0.05} value={zoom}
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    style={{ width: "100%", accentColor: "var(--accent)" }} />
                            </div>
                            <div>
                                <label style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 10, textTransform: "uppercase" }}>
                                    <span>Rotate</span>
                                    <span style={{ color: "var(--text-primary)" }}>{rotation}°</span>
                                </label>
                                <input type="range" min={-180} max={180} step={1} value={rotation}
                                    onChange={(e) => setRotation(Number(e.target.value))}
                                    style={{ width: "100%", accentColor: "var(--accent)" }} />
                            </div>
                        </div>

                        {/* Preview circle */}
                        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 24, padding: "16px 20px", background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid var(--border)" }}>
                            <div style={{ width: 48, height: 48, borderRadius: "50%", overflow: "hidden", border: "2px solid var(--accent)", flexShrink: 0 }}>
                                {profile?.avatarUrl ? <img src={profile.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#6c63ff,#ff6584)" }} />}
                            </div>
                            <div>
                                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Saved as 400×400 PNG</p>
                                <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Round crop shown in sidebar &amp; portfolio</p>
                            </div>
                        </div>

                        <div style={{ marginTop: 28, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                            <button
                                onClick={() => document.getElementById("avatar-input")?.click()}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = "rgba(108,99,255,0.5)";
                                    e.currentTarget.style.color = "var(--text-primary)";
                                    e.currentTarget.style.background = "rgba(108,99,255,0.08)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = "var(--border)";
                                    e.currentTarget.style.color = "var(--text-muted)";
                                    e.currentTarget.style.background = "transparent";
                                }}
                                style={{
                                    background: "transparent",
                                    border: "1px dashed var(--border)",
                                    color: "var(--text-muted)",
                                    padding: "9px 18px",
                                    borderRadius: 10,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    fontSize: 13,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    transition: "all 0.2s",
                                }}
                            >
                                <span style={{ fontSize: 15 }}>🖼️</span> Choose different file
                            </button>
                            <div style={{ display: "flex", gap: 12 }}>
                                <button onClick={() => setShowCropper(false)}
                                    style={{ background: "none", border: "1px solid var(--border)", color: "var(--text-muted)", padding: "10px 20px", borderRadius: 10, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
                                    Cancel
                                </button>
                                <button onClick={handleUpload} className="btn-glow" disabled={uploading} style={{ padding: "10px 28px" }}>
                                    {uploading ? "Uploading…" : "Apply Photo"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
