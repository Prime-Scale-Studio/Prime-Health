import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["*"],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  async headers() {
    const widgetHeaders = [
      { key: "Access-Control-Allow-Origin", value: "*" },
      { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
      { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
      { key: "Content-Security-Policy", value: "frame-ancestors *;" },
    ];

    return [
      {
        // Matches exactly /widget
        source: "/widget",
        headers: widgetHeaders,
      },
      {
        // Matches /widget/ (trailing slash)
        source: "/widget/",
        headers: widgetHeaders,
      },
      {
        // Matches /widget/[slug] and anything deeper
        source: "/widget/:path+",
        headers: widgetHeaders,
      },
      {
        source: "/api/widget/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
          { key: "Access-Control-Allow-Credentials", value: "false" },
        ],
      },
    ];
  },
};

export default nextConfig;
