/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "static.bytespark.me",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

module.exports = nextConfig;
