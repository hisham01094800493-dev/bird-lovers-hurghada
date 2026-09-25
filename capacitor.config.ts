import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.birdlovers.hurghada',
  appName: 'Bird Lovers Hurghada',
  webDir: 'dist/public',
  server: {
    url: 'https://bird-lovers-hurghada.vercel.app',
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
