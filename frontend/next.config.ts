import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async redirects() {
    return [
      {
        source: "/theory",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
