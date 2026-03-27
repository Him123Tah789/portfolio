import prisma from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface PostPageProps {
  params: Promise<{ id: string }>;
}

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params;

  let post: Awaited<ReturnType<typeof prisma.post.findFirst>> = null;
  try {
    post = await prisma.post.findFirst({
      where: {
        OR: [
          { id: id },
          { slug: id }
        ]
      },
    });
  } catch {
    post = null;
  }

  if (!post || !post.published) {
    notFound();
  }

  return (
    <main
      className="space-scene"
      style={{ minHeight: "100vh", padding: "120px 5% 60px", position: "relative" }}
    >
      <div style={{ maxWidth: 800, margin: "0 auto", position: "relative", zIndex: 2 }}>
        <Link href="/#blog" style={{ 
          display: "inline-flex", 
          alignItems: "center", 
          gap: 8, 
          color: "var(--accent)", 
          textDecoration: "none", 
          fontSize: 14, 
          fontWeight: 600,
          marginBottom: 40 
        }}>
          ← Back to Portfolio
        </Link>

        <p style={{ 
          color: "var(--accent)", 
          fontSize: 13, 
          fontWeight: 700, 
          textTransform: "uppercase", 
          letterSpacing: "0.1em", 
          marginBottom: 16 
        }}>
          {new Date(post.createdAt).toLocaleDateString('en-GB')}
        </p>
        
        <h1 style={{ 
          fontSize: "clamp(2.5rem, 6vw, 4rem)", 
          fontWeight: 900, 
          lineHeight: 1.1, 
          letterSpacing: "-0.04em", 
          marginBottom: 40,
          color: "var(--text-primary)"
        }}>
          {post.title}
        </h1>

        <div className="glass" style={{ 
          padding: "40px", 
          border: "1px solid var(--border)",
          lineHeight: 1.8,
          fontSize: 18,
          color: "var(--text-primary)",
          whiteSpace: "pre-wrap"
        }}>
          {post.content}
        </div>

        <div style={{ marginTop: 60, padding: 40, borderTop: "1px solid var(--border)", textAlign: "center" }}>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 24 }}>
            Thanks for reading! If you enjoyed this post, feel free to reach out.
          </p>
          <Link href="/#contact" className="btn-glow">
            Get in Touch
          </Link>
        </div>
      </div>
    </main>
  );
}
