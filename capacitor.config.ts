import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mrrobot.lottoai',
  appName: '로또AI',
  webDir: 'dist',
  android: {
    buildOptions: {
      keystorePath: '../lottoai.keystore',
      keystoreAlias: 'lottoai',
    },
  },
  plugins: {
    CapacitorHttp: { enabled: true },
  },
};

export default config;
