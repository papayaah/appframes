import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default withBundleAnalyzer({
  reactStrictMode: false,
  experimental: {
    optimizePackageImports: ['@mantine/core', '@mantine/hooks'],
    // Keep enabled so local packages/submodules work smoothly.
    externalDir: true,
  },
  transpilePackages: ['@reactkits.dev/better-auth-connect', '@reactkits.dev/react-media-library'],
});
