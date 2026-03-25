"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { GripVertical, Award, Calendar, ExternalLink } from "lucide-react";

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

const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 16px",
    background: "var(--bg-section)", border: "1px solid var(--border)",
    borderRadius: 12, fontSize: 14, color: "var(--text-primary)",
    outline: "none", transition: "border-color 0.2s", boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 11, fontWeight: 700,
    color: "var(--text-muted)", marginBottom: 8,
    textTransform: "uppercase", letterSpacing: "0.05em",
};

function toDateInput(dateStr: string | null | undefined) {
    if (!dateStr || new Date(dateStr).getUTCFullYear() === 1970) return "";
    return new Date(dateStr).toISOString().split("T")[0];
}

const Field = ({ label, name, type = "text", placeholder = "", defaultValue = "" }: any) => (
    <div style={{ width: "100%" }}>
        <label style={labelStyle}>{label}</label>
        <input
            type={type}
            name={name}
            placeholder={placeholder}
            defaultValue={defaultValue}
            required={type !== "url" && name !== "credentialId" && name !== "issueDate"}
            style={inputStyle}
            onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
            onBlur={(e) => e.target.style.borderColor = "var(--border)"}
        />
    </div>
);

export default function CertificatesAdmin() {
    const [certs, setCerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [editSaving, setEditSaving] = useState(false);
    const [isReordering, setIsReordering] = useState(false);

    useEffect(() => {
        fetch("/api/certificates")
            .then((res) => res.json())
            .then((data) => {
                setCerts(Array.isArray(data) ? data : []);
                setLoading(false);
            });
    }, []);

    const onDragEnd = async (result: any) => {
        if (!result.destination) return;
        const items = Array.from(certs);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        const updatedItems = items.map((item, index) => ({ ...item, order: index }));
        setCerts(updatedItems);
        setIsReordering(true);

        try {
            await fetch("/api/certificates", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orders: updatedItems.map((c, i) => ({ id: c.id, order: i }))
                }),
            });
        } catch (error) {
            console.error("Failed to sync order", error);
        }
        setIsReordering(false);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        const form = new FormData(e.currentTarget);
        const data: any = Object.fromEntries(form.entries());
        data.order = certs.length;

        const res = await fetch("/api/certificates", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (res.ok) {
            const newCert = await res.json();
            setCerts([...certs, newCert]);
            (e.target as HTMLFormElement).reset();
        }
        setSaving(false);
    };

    const handleEditSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingItem) return;
        setEditSaving(true);
        const fd = new FormData(e.currentTarget);
        const data: any = Object.fromEntries(fd.entries());

        const res = await fetch(`/api/certificates?id=${editingItem.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (res.ok) {
            const updated = await res.json();
            setCerts(certs.map((c) => c.id === updated.id ? { ...updated, order: c.order } : c));
            setEditingItem(null);
        }
        setEditSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this certificate record?")) return;
        const res = await fetch(`/api/certificates?id=${id}`, { method: "DELETE" });
        if (res.ok) {
            setCerts(certs.filter((c) => c.id !== id));
        }
    };

    if (loading) return (
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid var(--accent)", borderTopColor: "transparent", margin: "0 auto 16px", animation: "spin 0.6s linear infinite" }} />
            Loading certifications...
        </div>
    );

    return (
        <div style={{ maxWidth: 1000, paddingBottom: 100 }}>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                .cert-row:hover .drag-handle { opacity: 1 !important; transform: translateX(0) !important; }
            `}</style>

            <div style={{ marginBottom: 40, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                    <p style={{ color: "var(--accent)", fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Credentials</p>
                    <h1 className="gradient-text" style={{ fontSize: "2.6rem", fontWeight: 900 }}>Certificates</h1>
                </div>
                {isReordering && (
                    <div style={{ color: "var(--accent)", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid var(--accent)", borderTopColor: "transparent", animation: "spin 0.6s linear infinite" }} />
                        SYNCING ORDER...
                    </div>
                )}
            </div>

            {/* ── ADD FORM ── */}
            <form onSubmit={handleSubmit} className="glass" style={{ padding: 40, border: "1px solid var(--border)", marginBottom: 48 }}>
                <h2 style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: 32, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 12 }}>
                    <Award size={20} color="var(--accent)" />
                    Add New Credential
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
                    <Field label="Certificate Title" name="title" placeholder="e.g. AWS Solutions Architect" />
                    <Field label="Issuing Organization" name="issuer" placeholder="e.g. Amazon Web Services" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 32 }}>
                    <Field label="Date Issued" name="issueDate" type="date" />
                    <Field label="Credential ID" name="credentialId" placeholder="Optional" />
                    <Field label="Verify URL" name="credentialUrl" type="url" placeholder="https://..." />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", background: "rgba(255,255,255,0.02)", padding: 20, borderRadius: 16, border: "1px solid var(--border)", marginTop: 8 }}>
                    <button type="submit" className="btn-glow" disabled={saving}>
                        {saving ? "Processing..." : "Add Certificate"}
                    </button>
                </div>
            </form>

            {/* ── DRAGGABLE RECORDS LIST ── */}
            <div className="glass" style={{ border: "1px solid var(--border)", overflow: "hidden" }}>
                <div style={{ padding: "24px 32px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <h3 style={{ fontWeight: 800, fontSize: "1.1rem" }}>Recorded Certificates</h3>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Drag to reorder · Click to edit</p>
                </div>

                <DragDropContext onDragEnd={onDragEnd}>
                    <DroppableFix droppableId="certs-list">
                        {(provided: any) => (
                            <div {...provided.droppableProps} ref={provided.innerRef} style={{ display: "flex", flexDirection: "column" }}>
                                {certs.length === 0 ? (
                                    <p style={{ padding: 60, textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>List is empty.</p>
                                ) : certs.map((cert, index) => (
                                    <Draggable key={cert.id} draggableId={cert.id} index={index}>
                                        {(provided: any, snapshot: any) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                className="cert-row"
                                                style={{
                                                    ...provided.draggableProps.style,
                                                    padding: "20px 32px",
                                                    borderBottom: "1px solid var(--border)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    background: snapshot.isDragging ? "rgba(108,99,255,0.06)" : "transparent",
                                                    backdropFilter: snapshot.isDragging ? "blur(20px)" : "none",
                                                    transition: "background 0.2s",
                                                }}
                                            >
                                                {/* Drag Handle */}
                                                <div 
                                                    {...provided.dragHandleProps} 
                                                    className="drag-handle"
                                                    style={{ 
                                                        marginRight: 24, 
                                                        color: "var(--text-muted)", 
                                                        cursor: "grab",
                                                        opacity: 0.3,
                                                        transition: "all 0.2s",
                                                        transform: "translateX(-4px)"
                                                    }}
                                                >
                                                    <GripVertical size={20} />
                                                </div>

                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <h3 style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)", marginBottom: 4 }}>{cert.title}</h3>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                                                        <p style={{ fontSize: 13, color: "var(--accent)", fontWeight: 700 }}>{cert.issuer}</p>
                                                        {cert.issuedAt && new Date(cert.issuedAt).getUTCFullYear() !== 1970 && (
                                                            <p style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                                                                <Calendar size={12} />
                                                                {new Date(cert.issuedAt).toLocaleDateString('en-GB')}
                                                            </p>
                                                        )}
                                                        {cert.credentialUrl && (
                                                            <a href={cert.credentialUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "var(--text-muted)", textDecoration: "none", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                                                                VERIFY <ExternalLink size={12} />
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>

                                                <div style={{ display: "flex", gap: 8, marginLeft: 24 }}>
                                                    <button onClick={() => setEditingItem(cert)}
                                                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "var(--text-primary)", cursor: "pointer", fontSize: 12, padding: "7px 14px", borderRadius: 8, fontWeight: 700 }}>
                                                        Edit
                                                    </button>
                                                    <button onClick={() => handleDelete(cert.id)}
                                                        style={{ background: "rgba(255,59,59,0.08)", border: "1px solid rgba(255,59,59,0.2)", color: "#ff6b6b", cursor: "pointer", fontSize: 12, padding: "7px 14px", borderRadius: 8, fontWeight: 700 }}>
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </DroppableFix>
                </DragDropContext>
            </div>

            {/* ── EDIT MODAL ── */}
            {editingItem && (
                <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
                    onClick={() => setEditingItem(null)}>
                    <div className="glass" style={{ width: "100%", maxWidth: 680, padding: 48, borderRadius: 24, border: "1px solid var(--border)", maxHeight: "90vh", overflowY: "auto" }}
                        onClick={(e) => e.stopPropagation()}>
                        <h2 style={{ fontWeight: 800, fontSize: "1.3rem", marginBottom: 32 }}>Edit Certificate</h2>
                        <form onSubmit={handleEditSave}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
                                <Field label="Title" name="title" defaultValue={editingItem.title} />
                                <Field label="Issuer" name="issuer" defaultValue={editingItem.issuer} />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 32 }}>
                                <Field label="Date" name="issueDate" type="date" defaultValue={toDateInput(editingItem.issuedAt)} />
                                <Field label="ID" name="credentialId" defaultValue={editingItem.credentialId ?? ""} />
                                <Field label="Verify URL" name="credentialUrl" type="url" defaultValue={editingItem.credentialUrl ?? ""} />
                            </div>
                            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                                <button type="button" onClick={() => setEditingItem(null)} style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", padding: "10px 20px", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                                <button type="submit" className="btn-glow" disabled={editSaving}>{editSaving ? "Saving..." : "Apply Changes"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
