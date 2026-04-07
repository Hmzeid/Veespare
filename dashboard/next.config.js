/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["localhost", "api.veeparts.com"],
  },
};

module.exports = nextConfig;
