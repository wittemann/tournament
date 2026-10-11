import type { BrowserOptions } from '@sentry/nextjs';

// Shared by the client, server and edge Sentry.init calls. Without a DSN
// Sentry stays disabled. No PII, no session replay.
//
// IPs: `dataCollection.userInfo: false` is what keeps them out (client
// infers no IP, server request data excludes it). Header deny terms match as
// substrings, so 'x-vercel-ip' also covers the x-vercel-ip-* geo headers.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || undefined;

export const sentryOptions = {
  dsn,
  enabled: !!dsn,
  dataCollection: {
    userInfo: false,
    httpHeaders: {
      request: {
        deny: ['x-vercel-ip', 'x-forwarded-for', 'x-real-ip'],
      },
    },
  },
  tracesSampleRate: 0.05,
  // Backstop only, in case an IP is ever set on the user manually.
  beforeSend(event) {
    if (event.user) delete event.user.ip_address;
    return event;
  },
} satisfies BrowserOptions;
