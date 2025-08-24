import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.247f73b9ba494810bd70531b6b75efa6',
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