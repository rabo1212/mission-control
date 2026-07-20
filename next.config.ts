import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/": ["./data/**/*"],
    "/project/*": ["./data/**/*"],
    "/agents": ["./data/**/*"],
    "/office": ["./data/**/*", "./data/office-assignments.json"],
    "/tokens": ["./data/**/*"],
  },
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
