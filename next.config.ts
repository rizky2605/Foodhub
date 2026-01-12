import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co', // Mengizinkan semua subdomain supabase.co
      },
    ],
  },
};

export default nextConfig;