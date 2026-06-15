import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep @react-pdf/renderer out of the Next.js/Turbopack bundle.
  // It uses native Node APIs and must run as-is in the Node.js runtime.
  serverExternalPackages: ["@react-pdf/renderer"],
};

export default nextConfig;
