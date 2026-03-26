import type { Metadata } from "next";
import "./globals.css";
import GlobalClientOverlays from "@/components/GlobalClientOverlays";

export const metadata: Metadata = {
  title: "Faishal Uddin Himel | Portfolio",
  description: "AI & Backend Developer building intelligent, secure, and scalable backend systems.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning>
        <GlobalClientOverlays />
        <div style={{ position: "relative", zIndex: 2 }}>
          {children}
        </div>
      </body>
    </html>
  );
}
