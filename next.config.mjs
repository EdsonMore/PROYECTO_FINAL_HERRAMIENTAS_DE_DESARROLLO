// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  serverRuntimeConfig: {
    port: 3000,
    hostname: '127.0.0.1',
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "encrypted-tbn0.gstatic.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "previews.123rf.com",
      },
    ],
  },
};

export default nextConfig;
