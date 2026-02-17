import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.toddperumal.neonpuck',
  appName: 'Neon Puck',
  webDir: 'public',
  server: {
    // In production, the app loads from local files.
    // For online multiplayer, network.js connects to the Render server explicitly.
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#1a1a2e',
      showSpinner: false,
      launchFadeOutDuration: 300
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1a1a2e'
    }
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    backgroundColor: '#1a1a2e'
  }
};

export default config;
