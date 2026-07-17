import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.guijimilong.trickmaze",
  appName: "诡计迷宫",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
};

export default config;
