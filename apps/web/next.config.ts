import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const applicationDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(applicationDirectory, "../..");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: repositoryRoot,
  },
};

export default nextConfig;
