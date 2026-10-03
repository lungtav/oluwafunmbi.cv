import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hides the "N" dev-tools badge in the bottom-left corner during `next dev`.
  // Production builds never show it.
  devIndicators: false,
};

export default nextConfig;
