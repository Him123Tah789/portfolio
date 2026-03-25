"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { GripVertical, Cpu, Edit3, Trash2, Plus, Zap, X } from "lucide-react";

const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 16px",
    background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)",
    borderRadius: 12, fontSize: 14, color: "var(--text-primary)",
    outline: "none", transition: "border-color 0.2s", boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 11, fontWeight: 700,
    color: "var(--text-muted)", marginBottom: 8,
    textTransform: "uppercase", letterSpacing: "0.05em",
};

const Field = ({ label, name, type = "text", placeholder = "", defaultValue = "" }: any) => (
    <div style={{ width: "100%" }}>
        <label style={labelStyle}>{label}</label>
        <input
            type={type}
            name={name}
            placeholder={placeholder}
            defaultValue={defaultValue}
            required
            min={type === "number" ? 0 : undefined}
            max={type === "number" ? 100 : undefined}
            style={inputStyle}
            onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
            onBlur={(e) => e.target.style.borderColor = "var(--border)"}
        />
    </div>
);

export default function SkillsAdmin() {
    const [skills, setSkills] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [editSaving, setEditSaving] = useState(false);
    const [isReordering, setIsReordering] = useState(false);

    useEffect(() => {
        fetch("/api/skills")
            .then((res) => res.json())
            .then((data) => {
                setSkills(Array.isArray(data) ? data : []);
                setLoading(false);
            });
    }, []);

    const onDragEnd = async (result: any) => {
        if (!result.destination) return;
        const reordered = Array.from(skills);
        const [removed] = reordered.splice(result.source.index, 1);
        reordered.splice(result.destination.index, 0, removed);

        setSkills(reordered);
        setIsReordering(true);

        try {
            await fetch("/api/skills", {
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

    const openEdit = (item: any) => setEditingItem(item);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        const formEl = e.currentTarget;
        const form = new FormData(formEl);
        const data: any = Object.fromEntries(form.entries());
        data.order = skills.length;

        const res = await fetch("/api/skills", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (res.ok) {
            const newSkill = await res.json();
            setSkills([...skills, newSkill]);
            formEl.reset();
        }
        setSaving(false);
    };

    const handleEditSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingItem) return;
        setEditSaving(true);
        const fd = new FormData(e.currentTarget);
        const data: any = Object.fromEntries(fd.entries());

        const res = await fetch(`/api/skills?id=${editingItem.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (res.ok) {
            const updated = await res.json();
            setSkills(skills.map((s) => s.id === updated.id ? { ...updated, order: s.order } : s));
            setEditingItem(null);
        }
        setEditSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Remove this skill?")) return;
        const res = await fetch(`/api/skills?id=${id}`, { method: "DELETE" });
        if (res.ok) setSkills(skills.filter((s) => s.id !== id));
    };

    if (loading) return (
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid var(--accent)", borderTopColor: "transparent", margin: "0 auto 16px", animation: "spin 0.6s linear infinite" }} />
            Exploring Tech Stack...
        </div>
    );

    return (
        <div style={{ maxWidth: 1000, paddingBottom: 100 }}>
            <style>{`.skill-row:hover .drag-handle { opacity: 1 !important; transform: translateX(0) !important; }`}</style>
            
            <div style={{ marginBottom: 40, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                    <p style={{ color: "var(--accent)", fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Knowledge Base</p>
                    <h1 className="gradient-text" style={{ fontSize: "2.6rem", fontWeight: 900 }}>Technical Skills</h1>
                </div>
                {isReordering && (
                    <div style={{ color: "var(--accent)", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid var(--accent)", borderTopColor: "transparent", animation: "spin 0.6s linear infinite" }} />
                        REORDERING...
                    </div>
                )}
            </div>

            {/* ── ADD FORM ── */}
            <form onSubmit={handleSubmit} className="glass" style={{ padding: 40, border: "1px solid var(--border)", marginBottom: 48 }}>
                <h2 style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: 32, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 12 }}>
                    <Cpu size={20} color="var(--accent)" />
                    Register New Competency
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
                    <Field label="Skill Name" name="name" placeholder="e.g. TypeScript" />
                    <Field label="Category" name="category" placeholder="e.g. Frontend" />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", background: "rgba(255,255,255,0.02)", padding: 20, borderRadius: 16, border: "1px solid var(--border)", marginTop: 8 }}>
                    <button type="submit" className="btn-glow" style={{ height: 46, display: "flex", alignItems: "center", gap: 8 }} disabled={saving}>
                        <Plus size={18} />
                        {saving ? "..." : "Add Competency"}
                    </button>
                </div>
            </form>

            {/* ── DRAGGABLE RECORDS LIST ── */}
            <div className="glass" style={{ border: "1px solid var(--border)", overflow: "hidden" }}>
                <div style={{ padding: "24px 32px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <h3 style={{ fontWeight: 800, fontSize: "1.1rem" }}>Skills Portfolio</h3>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Drag to rank skills globally</p>
                </div>

                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="skills-list">
                        {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef}>
                                {skills.length === 0 ? (
                                    <p style={{ padding: 60, textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>Inventory is currently empty.</p>
                                ) : skills.map((skill, index) => (
                                    <Draggable key={skill.id} draggableId={skill.id} index={index}>
                                        {(provided, snapshot) => (
                                            <div ref={provided.innerRef} {...provided.draggableProps} className="skill-row"
                                                style={{
                                                    ...provided.draggableProps.style,
                                                    padding: "16px 32px",
                                                    borderBottom: "1px solid var(--border)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    background: snapshot.isDragging ? "rgba(108,99,255,0.08)" : "transparent",
                                                    backdropFilter: snapshot.isDragging ? "blur(20px)" : "none",
                                                    transition: "background 0.2s"
                                                }}>
                                                
                                                <div {...provided.dragHandleProps} className="drag-handle"
                                                    style={{ marginRight: 24, color: "var(--text-muted)", cursor: "grab", opacity: 0.3, transition: "all 0.2s" }}>
                                                    <GripVertical size={20} />
                                                </div>

                                                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 16 }}>
                                                    <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>{skill.name}</span>
                                                    <span style={{ fontSize: 10, fontWeight: 800, color: "var(--accent)", background: "rgba(108,99,255,0.08)", padding: "2px 10px", borderRadius: 50, textTransform: "uppercase" }}>{skill.category}</span>
                                                </div>

                                                <div style={{ display: "flex", gap: 8, marginLeft: 24 }}>
                                                    <button onClick={() => openEdit(skill)}
                                                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "var(--text-primary)", cursor: "pointer", fontSize: 11, padding: "6px 12px", borderRadius: 8, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                                                        <Edit3 size={12} /> Edit
                                                    </button>
                                                    <button onClick={() => handleDelete(skill.id)}
                                                        style={{ background: "rgba(255,59,59,0.08)", border: "1px solid rgba(255,59,59,0.2)", color: "#ff6b6b", cursor: "pointer", fontSize: 11, padding: "6px 12px", borderRadius: 8, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                                                        <Trash2 size={12} /> Delete
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            </div>

            {/* ── EDIT MODAL ── */}
            {editingItem && (
                <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(15px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
                    onClick={() => setEditingItem(null)}>
                    <div className="glass" style={{ width: "100%", maxWidth: 500, padding: 48, borderRadius: 28, border: "1px solid var(--border)" }}
                        onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
                            <h3 style={{ fontWeight: 800, fontSize: "1.3rem", display: "flex", alignItems: "center", gap: 12 }}>
                                <Zap size={20} color="var(--accent)" />
                                Edit Skill Detail
                            </h3>
                            <button onClick={() => setEditingItem(null)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", lineHeight: 1 }}>
                                <X size={22} />
                            </button>
                        </div>
                        <form onSubmit={handleEditSave}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 24, marginBottom: 32 }}>
                                <Field label="Skill Name" name="name" defaultValue={editingItem.name} />
                                <Field label="Category" name="category" defaultValue={editingItem.category} />
                            </div>
                            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                                <button type="button" onClick={() => setEditingItem(null)} style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", padding: "10px 20px", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>Discard</button>
                                <button type="submit" className="btn-glow" disabled={editSaving}>{editSaving ? "Saving..." : "Apply Changes"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
