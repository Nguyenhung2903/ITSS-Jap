import type { NextConfig } from "next";

function getR2RemotePatterns() {
    const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [];
    const raw =
        process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.trim() ||
        process.env.CLOUDFLARE_R2_PUBLIC_URL?.trim();

    if (!raw) return patterns;

    try {
        const hostname = new URL(
            raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`
        ).hostname;

        patterns.push({
            protocol: "https",
            hostname,
            pathname: "/**",
        });
    } catch {
        // Ignore invalid R2 public URL at build time.
    }

    return patterns;
}

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
      allowedOrigins: [
        "localhost:3000",
      ],
    },
    optimizePackageImports: ["socket.io-client"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    localPatterns: [
      {
        pathname: '/assets/**',
      },
      {
        pathname: '/api/backend-assets/**',
      },
      {
        pathname: '/api/avatars/**',
      },
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.r2.dev',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'example.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      },
      ...getR2RemotePatterns(),
    ],
  },
};

export default nextConfig;
