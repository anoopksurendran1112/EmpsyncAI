/*import type { NextConfig } from "next";


const nextConfig: NextConfig = {
  devIndicators: {
    appIsRunning: false, // 🚫 removes the "N" box at bottom-right
  },
  eslint: {
    ignoreDuringBuilds: true, // ✅ disables ESLint blocking builds
  },
};

export default nextConfig;
*/


/*const COMPANY_MEDIA_BASE = process.env.NEXT_PUBLIC_COMPANY_MEDIA_BASE;

const nextConfig: NextConfig = {
  devIndicators: { appIsRunning: false },
  eslint: { ignoreDuringBuilds: true },
  async rewrites() {
    return [
      {
        source: "/media/:path*",
        destination: `${COMPANY_MEDIA_BASE}/media/:path*`,
      },
    ];
  },
};

export default nextConfig;

*/
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "empsyncai.kochi.digital",
        port: "", // production
        pathname: "/**",
      },
      /*{
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000", // local backend
        pathname: "/media/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000", // local backend (sometimes you access via localhost)
        pathname: "/media/**",
      },*/
    ],
  },
  devIndicators: {
    appIsRunning: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};
export default nextConfig;
