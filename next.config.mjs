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
  transpilePackages: ['@reactkits.dev/better-auth-connect', '@reactkits.dev/react-media-library', '@reactkits.dev/ai-connect'],
  // Proxy media requests to production when developing locally with remote DB
  async rewrites() {
    if (process.env.NODE_ENV === 'development' && process.env.PROXY_MEDIA_TO_PRODUCTION === 'true') {
      return [
        {
          source: '/api/media/:path*',
          destination: 'https://appframes.dev/api/media/:path*',
        },
      ];
    }
    return [];
  },
});
