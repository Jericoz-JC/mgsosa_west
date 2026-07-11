import type { NextConfig } from "next";

if (process.env.VERCEL === "1" && !process.env.NEXT_PUBLIC_CONVEX_URL?.trim()) {
  throw new Error(
    "NEXT_PUBLIC_CONVEX_URL is required for Vercel deployments. Configure it in the Vercel project environment before building.",
  );
}

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
