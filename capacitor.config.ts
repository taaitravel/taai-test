import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.f8b1d397680f4f3095f982a6b0a9eafd',
  appName: 'taai-test',
  webDir: 'dist',
  server: {
    url: 'https://f8b1d397-680f-4f30-95f9-82a6b0a9eafd.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0a0b14',
      showSpinner: false
    }
  }
};

export default config;
