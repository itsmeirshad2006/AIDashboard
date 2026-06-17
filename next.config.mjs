/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep production builds resilient on Vercel: type-safety is enforced,
  // while lint warnings never block a deploy. Run `npm run lint` locally.
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
