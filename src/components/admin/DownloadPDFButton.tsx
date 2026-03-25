"use client";

import { useState } from "react";

export default function DownloadPDFButton({ name }: { name?: string | null }) {
    const [loading, setLoading] = useState(false);

    const handleDownload = () => {
        setLoading(true);
        // We use the browser's native print engine to ensure 
        // that all hyperlinks and selectable text are preserved perfectly.
        // The layout is controlled via @media print CSS in admin/page.tsx.
        window.print();
        
        // Brief timeout to reset loading state after the print dialog opens
        setTimeout(() => setLoading(false), 500);
    };


    return (
        <button
            id="download-pdf-btn"
            onClick={handleDownload}
            disabled={loading}
            title="Download resume as PDF (1 page, same as CV preview)"
            style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 22px",
                background: loading
                    ? "rgba(108,99,255,0.4)"
                    : "linear-gradient(135deg, #6c63ff, #8b5cf6)",
                border: "1px solid rgba(108,99,255,0.4)",
                borderRadius: 12,
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading ? "none" : "0 4px 20px rgba(108,99,255,0.35)",
                transition: "all 0.25s",
                letterSpacing: "0.03em",
                whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
                if (!loading) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 8px 32px rgba(108,99,255,0.55)";
                }
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = loading ? "none" : "0 4px 20px rgba(108,99,255,0.35)";
            }}
        >
            {loading ? (
                <>
                    <span style={{
                        width: 14, height: 14, borderRadius: "50%",
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTopColor: "#fff",
                        animation: "spin 0.7s linear infinite",
                        display: "inline-block",
                        flexShrink: 0,
                    }} />
                    Generating…
                </>
            ) : (
                <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5"
                        strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download PDF
                </>
            )}
        </button>
    );
}
