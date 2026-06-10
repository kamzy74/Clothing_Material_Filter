import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "images.pactapparel.com" },
      { hostname: "media.wearpact.com" },
      { hostname: "www.patagonia.com" },
      { hostname: "www.everlane.com" },
      { hostname: "assets.everlane.com" },
      { hostname: "**.shopifycdn.com" },
      { hostname: "cdn.shopify.com" },
    ],
  },
};

export default nextConfig;
