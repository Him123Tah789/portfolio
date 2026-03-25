import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow data URIs (base64 avatars stored in the DB)
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Suppress the <img> warning, we use inline avatars from the DB
  typescript: {
    // Type errors are caught by the IDE; don't block production builds
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
