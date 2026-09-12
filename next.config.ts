import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Suppress Prisma edge runtime warnings (we use nodejs runtime)
  serverExternalPackages: ["@prisma/client", "prisma", "bcryptjs", "next-auth", "openid-client"],

  // Image domains for future use
  images: {
    remotePatterns: [],
  },

  // Headers for security
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
