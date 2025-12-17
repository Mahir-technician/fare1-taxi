import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      gsap: 'gsap/dist/gsap',
    };
    return config;
  },
};

export default nextConfig;