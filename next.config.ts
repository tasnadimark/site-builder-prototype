import type { NextConfig } from 'next';

const config: NextConfig = {
  devIndicators: false,
  // Pin the workspace root to this folder so a lockfile higher up is not picked up.
  turbopack: { root: process.cwd() },
};

export default config;
