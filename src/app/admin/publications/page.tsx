"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { GripVertical, BookOpen, Calendar, Link as LinkIcon, Edit3, Trash2 } from "lucide-react";

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

const Field = ({ label, name, type = "text", placeholder = "", defaultValue = "", required = false, disabled = false }: any) => (
    <div style={{ width: "100%" }}>
        <label style={labelStyle}>{label}</label>
        <input
            type={type}
            name={name}
            placeholder={disabled ? "N/A" : placeholder}
            defaultValue={defaultValue}
            required={required && !disabled}
            disabled={disabled}
            style={{ ...inputStyle, cursor: disabled ? "not-allowed" : (type === 'date' ? "pointer" : "text"), opacity: disabled ? 0.3 : 1 }}
            onClick={(e) => !disabled && type === 'date' && (e.target as any).showPicker?.()}
            onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
            onBlur={(e) => e.target.style.borderColor = "var(--border)"}
        />
    </div>
);

export default function PublicationsAdmin() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [editSaving, setEditSaving] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [editSubmitted, setEditSubmitted] = useState(false);
    const [isReordering, setIsReordering] = useState(false);

    useEffect(() => {
        fetch("/api/publications")
            .then((res) => res.json())
            .then((data) => {
                setItems(Array.isArray(data) ? data : []);
                setLoading(false);
            });
    }, []);

    const onDragEnd = async (result: any) => {
        if (!result.destination) return;
        const reordered = Array.from(items);
        const [removed] = reordered.splice(result.source.index, 1);
        reordered.splice(result.destination.index, 0, removed);

        setItems(reordered);
        setIsReordering(true);

        try {
            await fetch("/api/publications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orders: reordered.map((x, i) => ({ id: x.id, order: i }))
                }),
            });
        } catch (err) {
            console.error("Failed to sync order", err);
        }
        setIsReordering(false);
    };

    const openEdit = (item: any) => {
        setEditingItem(item);
        setEditSubmitted(item.submitted || false);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        const formEl = e.currentTarget;
        const form = new FormData(formEl);
        const data: any = Object.fromEntries(form.entries());
        data.submitted = submitted;
        data.order = items.length;

        if (submitted) {
            delete data.url;
            delete data.date;
            delete data.publisher;
        }

        const res = await fetch("/api/publications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (res.ok) {
            const newItem = await res.json();
            setItems([...items, newItem]);
            formEl.reset();
            setSubmitted(false);
        } else {
            const err = await res.json();
            alert("Error: " + err.error);
        }
        setSaving(false);
    };

    const handleEditSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingItem) return;
        setEditSaving(true);
        const fd = new FormData(e.currentTarget);
        const data: any = Object.fromEntries(fd.entries());
        data.submitted = editSubmitted;

        if (editSubmitted) {
            delete data.url;
            delete data.date;
            delete data.publisher;
        }

        const res = await fetch(`/api/publications?id=${editingItem.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (res.ok) {
            const updated = await res.json();
            setItems(items.map((i) => i.id === updated.id ? { ...updated, order: i.order } : i));
            setEditingItem(null);
        }
        setEditSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this publication?")) return;
        const res = await fetch(`/api/publications?id=${id}`, { method: "DELETE" });
        if (res.ok) setItems(items.filter((i) => i.id !== id));
    };

    if (loading) return (
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid var(--accent)", borderTopColor: "transparent", margin: "0 auto 16px", animation: "spin 0.6s linear infinite" }} />
            Loading scholarly work...
        </div>
    );

    return (
        <div style={{ maxWidth: 1000, paddingBottom: 100 }}>
            <style>{`.pub-row:hover .drag-handle { opacity: 1 !important; transform: translateX(0) !important; }`}</style>

            <div style={{ marginBottom: 40, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                    <p style={{ color: "var(--accent)", fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Academic Portfolio</p>
                    <h1 className="gradient-text" style={{ fontSize: "2.6rem", fontWeight: 900 }}>Research & Publications</h1>
                </div>
                {isReordering && (
                    <div style={{ color: "var(--accent)", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid var(--accent)", borderTopColor: "transparent", animation: "spin 0.6s linear infinite" }} />
                        SAVING ORDER...
                    </div>
                )}
            </div>

            {/* ── ADD FORM ── */}
            <form onSubmit={handleSubmit} className="glass" style={{ padding: 40, border: "1px solid var(--border)", marginBottom: 48 }}>
                <h2 style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: 32, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 12 }}>
                    <BookOpen size={20} color="var(--accent)" />
                    Add New Reference
                </h2>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
                    <Field label="Paper / Article Title" name="title" required placeholder="Full title of your work" />
                    <Field label="Publisher / Journal" name="publisher" placeholder="e.g. Nature, IEEE, etc." disabled={submitted} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
                    <Field label="Date Published" name="date" type="date" required disabled={submitted} />
                    <Field label="Source URL" name="url" type="url" placeholder="https://doi.org/..." disabled={submitted} />
                </div>

                <div style={{ marginBottom: 24 }}>
                    <label style={labelStyle}>Abstract / Contribution</label>
                    <textarea name="description" placeholder="Summarize your findings or contribution..." rows={3} style={{ ...inputStyle, resize: "vertical" } as any} />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.02)", padding: 20, borderRadius: 16, border: "1px solid var(--border)", marginTop: 8 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 700, color: "var(--text-primary)", cursor: "pointer" }}>
                        <input type="checkbox" checked={submitted} onChange={(e) => setSubmitted(e.target.checked)}
                               style={{ accentColor: "var(--accent)", width: 18, height: 18 }} />
                        Currently in Peer-Review / Submitted
                    </label>
                    <button type="submit" className="btn-glow" disabled={saving}>{saving ? "Processing..." : "Add to List"}</button>
                </div>
            </form>

            {/* ── DRAGGABLE LIST ── */}
            <div className="glass" style={{ border: "1px solid var(--border)", overflow: "hidden" }}>
                <div style={{ padding: "24px 32px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <h3 style={{ fontWeight: 800, fontSize: "1.1rem" }}>Recorded Publications</h3>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Drag to reorder scholarly importance</p>
                </div>

                <DragDropContext onDragEnd={onDragEnd}>
                    <DroppableFix droppableId="pub-list">
                        {(provided: any) => (
                            <div {...provided.droppableProps} ref={provided.innerRef}>
                                {items.length === 0 ? (
                                    <p style={{ padding: 60, textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>No publications found.</p>
                                ) : items.map((item, index) => (
                                    <Draggable key={item.id} draggableId={item.id} index={index}>
                                        {(provided: any, snapshot: any) => (
                                            <div ref={provided.innerRef} {...provided.draggableProps} className="pub-row"
                                                style={{
                                                    ...provided.draggableProps.style,
                                                    padding: "24px 32px",
                                                    borderBottom: "1px solid var(--border)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    background: snapshot.isDragging ? "rgba(108,99,255,0.06)" : "transparent",
                                                    backdropFilter: snapshot.isDragging ? "blur(20px)" : "none",
                                                    transition: "background 0.2s"
                                                }}>
                                                
                                                <div {...provided.dragHandleProps} className="drag-handle"
                                                    style={{ marginRight: 24, color: "var(--text-muted)", cursor: "grab", opacity: 0.3, transition: "all 0.2s" }}>
                                                    <GripVertical size={20} />
                                                </div>

                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                                                        <h3 style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--text-primary)" }}>{item.title}</h3>
                                                        {item.submitted && <span style={{ background: "rgba(255,179,71,0.1)", color: "#ffb347", fontSize: 10, fontWeight: 900, padding: "3px 10px", borderRadius: 50, border: "1px solid rgba(255,179,71,0.2)" }}>IN REVIEW</span>}
                                                    </div>
                                                    
                                                    {!item.submitted && (
                                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 20, marginBottom: 10 }}>
                                                            {item.publisher && (
                                                                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--accent)", fontSize: 13, fontWeight: 700 }}>
                                                                    <BookOpen size={14} />
                                                                    {item.publisher}
                                                                </div>
                                                            )}
                                                            {item.date && (
                                                                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: 13, fontWeight: 600 }}>
                                                                    <Calendar size={14} />
                                                                    {new Date(item.date).toLocaleDateString('en-GB')}
                                                                </div>
                                                            )}
                                                            {item.url && (
                                                                <a href={item.url} target="_blank" rel="noreferrer" 
                                                                   style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--accent-2)", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                                                                    <LinkIcon size={14} />
                                                                    View Paper
                                                                </a>
                                                            )}
                                                        </div>
                                                    )}
                                                    
                                                    {item.description && <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>{item.description}</p>}
                                                </div>

                                                <div style={{ display: "flex", gap: 8, marginLeft: 24 }}>
                                                    <button onClick={() => openEdit(item)}
                                                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "var(--text-primary)", cursor: "pointer", fontSize: 12, padding: "8px 16px", borderRadius: 10, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                                                        <Edit3 size={14} /> Edit
                                                    </button>
                                                    <button onClick={() => handleDelete(item.id)}
                                                        style={{ background: "rgba(255,59,59,0.08)", border: "1px solid rgba(255,59,59,0.2)", color: "#ff6b6b", cursor: "pointer", fontSize: 12, padding: "8px 16px", borderRadius: 10, fontWeight: 700 }}>
                                                        <Trash2 size={14} />
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
                <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(15px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
                    onClick={() => setEditingItem(null)}>
                    <div className="glass" style={{ width: "100%", maxWidth: 720, padding: 48, borderRadius: 28, border: "1px solid var(--border)", maxHeight: "90vh", overflowY: "auto" }}
                        onClick={(e) => e.stopPropagation()}>
                        <h2 style={{ fontWeight: 800, fontSize: "1.4rem", marginBottom: 32 }}>Update Research Entry</h2>
                        <form onSubmit={handleEditSave}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
                                <Field label="Paper Title" name="title" required defaultValue={editingItem.title} />
                                <Field label="Publisher" name="publisher" defaultValue={editingItem.publisher} disabled={editSubmitted} />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
                                <Field label="Publication Date" name="date" type="date" required defaultValue={toDateInput(editingItem.date)} disabled={editSubmitted} />
                                <Field label="URL" name="url" type="url" defaultValue={editingItem.url} disabled={editSubmitted} />
                            </div>
                            <div style={{ marginBottom: 24 }}>
                                <label style={labelStyle}>Description</label>
                                <textarea name="description" rows={4} defaultValue={editingItem.description ?? ""} style={{ ...inputStyle, resize: "vertical" } as any} />
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40 }}>
                                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "var(--accent)", cursor: "pointer" }}>
                                    <input type="checkbox" checked={editSubmitted} onChange={(e) => setEditSubmitted(e.target.checked)} style={{ accentColor: "var(--accent)", width: 18, height: 18 }} />
                                    Mark as In-Review
                                </label>
                                <div style={{ display: "flex", gap: 12 }}>
                                    <button type="button" onClick={() => setEditingItem(null)} style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", padding: "12px 24px", borderRadius: 12, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                                    <button type="submit" className="btn-glow" disabled={editSaving}>{editSaving ? "Synchronizing..." : "Apply Changes"}</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
