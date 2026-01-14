import type { OpenNextConfig } from '@opennextjs/cloudflare';

const config: OpenNextConfig = {
  default: {},
  // Cloudflare specific configuration
  cloudflare: {
    // Enable skew protection for zero-downtime deployments
    skewProtection: {
      enabled: false,
    },
  },
};

export default config;
