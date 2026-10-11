import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs/config';

const nextConfig: NextConfig = {/* config options here */};

export default withSentryConfig(nextConfig, {
  org: 'wittemann',
  project: 'tournament',
  sentryUrl: 'https://de.sentry.io/',
  silent: !process.env.CI,
  // Source maps are only uploaded when SENTRY_AUTH_TOKEN is set (build-time).
  authToken: process.env.SENTRY_AUTH_TOKEN,
});
