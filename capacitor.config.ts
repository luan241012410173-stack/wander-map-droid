import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gpsnavigator.app',
  appName: 'GPS Navigator',
  webDir: 'dist',
  server: {
    url: 'https://247f73b9-ba49-4810-bd70-531b6b75efa6.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Geolocation: {
      permissions: {
        location: "always"
      }
    }
  }
};

export default config;