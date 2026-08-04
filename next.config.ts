import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  images: {
    // Add hosts here if you ever reference remote images from MDX frontmatter.
    remotePatterns: [],
    formats: ["image/avif", "image/webp"],
  },

  experimental: {
    // lucide has a very large export surface; barrel optimization keeps the
    // icons you don't import out of the client bundle.
    //
    // Deliberately NOT applied to @react-three/drei: it relies on module-level
    // singletons (the View tunnel), and rewriting its barrel imports risks
    // producing more than one instance of them.
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
