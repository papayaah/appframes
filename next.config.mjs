import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default withBundleAnalyzer({
  reactStrictMode: false,
  experimental: {
    optimizePackageImports: ['@mantine/core', '@mantine/hooks'],
    // Needed because `@reactkits.dev/better-auth-connect` is installed via `file:../buzzer/...`
    // (a symlink outside the Next.js project root). Turbopack otherwise fails module resolution.
    externalDir: true,
  },
  transpilePackages: ['@reactkits.dev/better-auth-connect'],
});
