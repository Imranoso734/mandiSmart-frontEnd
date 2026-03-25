import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "bms-image-storage.s3.eu-west-2.amazonaws.com",
      },
    ],
  },
  /* config options here */
};

export default nextConfig;
