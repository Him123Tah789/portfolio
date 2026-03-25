"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { GripVertical, Briefcase, Calendar } from "lucide-react";

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
    if (!dateStr) return "";
    return new Date(dateStr).toISOString().split("T")[0];
}

export default function ExperienceAdmin() {
    const [experience, setExperience] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentlyWorking, setCurrentlyWorking] = useState(false);
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [editSaving, setEditSaving] = useState(false);
    const [editCurrently, setEditCurrently] = useState(false);
    const [isReordering, setIsReordering] = useState(false);

    useEffect(() => {
        fetch("/api/experience").then((r) => r.json()).then((d) => {
            setExperience(Array.isArray(d) ? d : []);
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        if (!error) return;
        const t = setTimeout(() => setError(null), 5000);
        return () => clearTimeout(t);
    }, [error]);

    const onDragEnd = async (result: any) => {
        if (!result.destination) return;
        const items = Array.from(experience);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        const updatedItems = items.map((item, index) => ({ ...item, order: index }));
        setExperience(updatedItems);
        setIsReordering(true);

        try {
            await fetch("/api/experience", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orders: updatedItems.map((x, i) => ({ id: x.id, order: i }))
                }),
            });
        } catch (err) {
            console.error("Failed to sync order", err);
        }
        setIsReordering(false);
    };

    const openEdit = (item: any) => {
        setEditingItem(item);
        setEditCurrently(item.current);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        const form = e.currentTarget;
        const fd = new FormData(form);
        const data: any = Object.fromEntries(fd.entries());
        data.current = currentlyWorking;
        data.order = experience.length;
        if (currentlyWorking) delete data.endDate;

        if (!currentlyWorking && data.endDate && data.startDate) {
            if (new Date(data.startDate) > new Date(data.endDate)) {
                setError("End date cannot be before start date.");
                setSaving(false);
                return;
            }
        }

        const res = await fetch("/api/experience", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (res.ok) {
            const record = await res.json();
            setExperience((prev) => [...prev, record]);
            form.reset();
            setCurrentlyWorking(false);
        } else {
            setError("Failed to save experience.");
        }
        setSaving(false);
    };

    const handleEditSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingItem) return;
        setEditSaving(true);
        const fd = new FormData(e.currentTarget);
        const data: any = Object.fromEntries(fd.entries());
        data.current = editCurrently;
        if (editCurrently) delete data.endDate;

        const res = await fetch(`/api/experience?id=${editingItem.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (res.ok) {
            const updated = await res.json();
            setExperience(experience.map((x) => x.id === updated.id ? { ...updated, order: x.order } : x));
            setEditingItem(null);
        }
        setEditSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this record?")) return;
        const res = await fetch(`/api/experience?id=${id}`, { method: "DELETE" });
        if (res.ok) setExperience((prev) => prev.filter((x) => x.id !== id));
    };

    if (loading) return (
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid var(--accent)", borderTopColor: "transparent", margin: "0 auto 16px", animation: "spin 0.6s linear infinite" }} />
            Loading career history...
        </div>
    );

    return (
        <div style={{ maxWidth: 1000, paddingBottom: 100 }}>
            <style>{`.exp-row:hover .drag-handle { opacity: 1 !important; transform: translateX(0) !important; }`}</style>
            
            {error && (
                <div style={{ position: "fixed", top: 24, right: 24, zIndex: 2000, padding: "16px 24px", borderRadius: 12, fontSize: 14, fontWeight: 600, background: "rgba(239,68,68,0.15)", backdropFilter: "blur(12px)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", boxShadow: "0 10px 40px rgba(0,0,0,0.4)", display: "flex", alignItems: "center", gap: 10 }}>
                    <span>⚠️</span> {error}
                </div>
            )}

            <div style={{ marginBottom: 40, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                    <p style={{ color: "var(--accent)", fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Professional Path</p>
                    <h1 className="gradient-text" style={{ fontSize: "2.6rem", fontWeight: 900 }}>Experience</h1>
                </div>
                {isReordering && (
                    <div style={{ color: "var(--accent)", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid var(--accent)", borderTopColor: "transparent", animation: "spin 0.6s linear infinite" }} />
                        SYNCING...
                    </div>
                )}
            </div>

            {/* ── ADD FORM ── */}
            <form onSubmit={handleSubmit} className="glass" style={{ padding: 40, border: "1px solid var(--border)", marginBottom: 48 }}>
                <h2 style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: 32, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 12 }}>
                    <Briefcase size={20} color="var(--accent)" />
                    Add Work Experience
                </h2>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
                    <div>
                        <label style={labelStyle}>Company Name</label>
                        <input name="company" placeholder="e.g. Google" required style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>Position</label>
                        <input name="position" placeholder="e.g. Senior Software Engineer" required style={inputStyle} />
                    </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                    <label style={labelStyle}>Description</label>
                    <textarea name="description" placeholder="Responsibilities and achievements..." rows={4}
                        style={{ ...inputStyle, lineHeight: 1.6, resize: "vertical" } as any} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 8, alignItems: "flex-end" }}>
                    <div>
                        <label style={labelStyle}>Start Date</label>
                        <input type="date" name="startDate" required style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>End Date</label>
                        <input type="date" name="endDate" disabled={currentlyWorking}
                            style={{ ...inputStyle, cursor: currentlyWorking ? "not-allowed" : "pointer", opacity: currentlyWorking ? 0.3 : 1 }} />
                    </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.02)", padding: 20, borderRadius: 16, border: "1px solid var(--border)", marginTop: 8 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 700, color: "var(--text-primary)", cursor: "pointer" }}>
                        <input type="checkbox" checked={currentlyWorking} onChange={(e) => setCurrentlyWorking(e.target.checked)}
                            style={{ accentColor: "var(--accent)", width: 18, height: 18 }} />
                        Currently Working
                    </label>
                    <button type="submit" className="btn-glow" disabled={saving}>
                        {saving ? "Saving..." : "Add Experience"}
                    </button>
                </div>
            </form>

            {/* ── DRAGGABLE RECORDS LIST ── */}
            <div className="glass" style={{ border: "1px solid var(--border)", overflow: "hidden" }}>
                <div style={{ padding: "24px 32px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <h3 style={{ fontWeight: 800, fontSize: "1.1rem" }}>Career History</h3>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Drag to reorder · Click edit to modify</p>
                </div>

                <DragDropContext onDragEnd={onDragEnd}>
                    <DroppableFix droppableId="exp-list">
                        {(provided: any) => (
                            <div {...provided.droppableProps} ref={provided.innerRef} style={{ display: "flex", flexDirection: "column" }}>
                                {experience.length === 0 ? (
                                    <p style={{ padding: 60, textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>List is empty.</p>
                                ) : experience.map((item, index) => (
                                    <Draggable key={item.id} draggableId={item.id} index={index}>
                                        {(provided: any, snapshot: any) => (
                                            <div ref={provided.innerRef} {...provided.draggableProps} className="exp-row"
                                                style={{
                                                    ...provided.draggableProps.style,
                                                    padding: "24px 32px",
                                                    borderBottom: "1px solid var(--border)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    background: snapshot.isDragging ? "rgba(108,99,255,0.06)" : "transparent",
                                                    backdropFilter: snapshot.isDragging ? "blur(20px)" : "none",
                                                    transition: "background 0.2s",
                                                }}>
                                                
                                                <div {...provided.dragHandleProps} className="drag-handle"
                                                    style={{ marginRight: 24, color: "var(--text-muted)", cursor: "grab", opacity: 0.3, transition: "all 0.2s" }}>
                                                    <GripVertical size={20} />
                                                </div>

                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <h3 style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--text-primary)", marginBottom: 4 }}>{item.position}</h3>
                                                    <p style={{ fontSize: 14, color: "var(--accent)", fontWeight: 700, marginBottom: 8 }}>{item.company}</p>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--text-muted)", fontSize: 12, fontWeight: 700 }}>
                                                        <Calendar size={12} />
                                                        {new Date(item.startDate).toLocaleDateString('en-GB')}
                                                        {" — "}
                                                        {item.current ? "PRESENT" : item.endDate ? new Date(item.endDate).toLocaleDateString('en-GB') : "N/A"}
                                                    </div>
                                                </div>

                                                <div style={{ display: "flex", gap: 8, marginLeft: 24 }}>
                                                    <button onClick={() => openEdit(item)}
                                                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "var(--text-primary)", cursor: "pointer", fontSize: 12, padding: "7px 14px", borderRadius: 8, fontWeight: 700 }}>
                                                        Edit
                                                    </button>
                                                    <button onClick={() => handleDelete(item.id)}
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
                        <h2 style={{ fontWeight: 800, fontSize: "1.3rem", marginBottom: 32 }}>Edit Experience</h2>
                        <form onSubmit={handleEditSave}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
                                <div>
                                    <label style={labelStyle}>Company Name</label>
                                    <input name="company" defaultValue={editingItem.company} required style={inputStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Position</label>
                                    <input name="position" defaultValue={editingItem.position} required style={inputStyle} />
                                </div>
                            </div>
                            <div style={{ marginBottom: 24 }}>
                                <label style={labelStyle}>Description</label>
                                <textarea name="description" rows={4} defaultValue={editingItem.description ?? ""}
                                    style={{ ...inputStyle, lineHeight: 1.6, resize: "vertical" } as any} />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 8, alignItems: "flex-end" }}>
                                <div>
                                    <label style={labelStyle}>Start Date</label>
                                    <input type="date" name="startDate" defaultValue={toDateInput(editingItem.startDate)} required style={inputStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>End Date</label>
                                    <input type="date" name="endDate" disabled={editCurrently}
                                        defaultValue={toDateInput(editingItem.endDate)}
                                        style={{ ...inputStyle, cursor: editCurrently ? "not-allowed" : "pointer", opacity: editCurrently ? 0.3 : 1 }} />
                                </div>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32 }}>
                                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "var(--accent)", cursor: "pointer" }}>
                                    <input type="checkbox" checked={editCurrently} onChange={(e) => setEditCurrently(e.target.checked)}
                                        style={{ accentColor: "var(--accent)", width: 17, height: 17 }} />
                                    Currently Working
                                </label>
                                <div style={{ display: "flex", gap: 12 }}>
                                    <button type="button" onClick={() => setEditingItem(null)} style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", padding: "10px 20px", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
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
