import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/": ["./data/**/*"],
    "/project/*": ["./data/**/*"],
    "/agents": ["./data/**/*"],
  },
};

export default nextConfig;
