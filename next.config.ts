import type { NextConfig } from "next";

// BASE_PATH is empty for Fridge (served at a subdomain root, e.g.
// content-style-guide.fridge.redo.builders). Set it (e.g. /content-style-guide)
// only when hosting under a subpath like GitHub Pages.
const basePath = process.env.BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  basePath: basePath || undefined,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  trailingSlash: true,
  images: { unoptimized: true },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
