import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const repo = "content-style-guide";

const nextConfig: NextConfig = {
  output: "export",
  // Served from https://<org>.github.io/content-style-guide/ in production.
  basePath: isProd ? `/${repo}` : undefined,
  assetPrefix: isProd ? `/${repo}/` : undefined,
  trailingSlash: true,
  images: { unoptimized: true },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
