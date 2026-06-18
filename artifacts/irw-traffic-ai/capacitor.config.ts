import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.irwtrafficai.app",
  appName: "IrwTrafficAI",
  webDir: "dist/public",
  server: {
    // Setelah deploy di Replit, isi URL ini dengan URL .replit.app Anda
    // Contoh: https://irw-traffic-ai.username.replit.app
    url: process.env.REPLIT_APP_URL ?? "https://irwtrafficai.replit.app",
    cleartext: false,
    androidScheme: "https",
  },
  android: {
    backgroundColor: "#0a0e1a",
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0a0e1a",
      showSpinner: false,
    },
  },
};

export default config;
