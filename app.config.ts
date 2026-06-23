import type { ExpoConfig } from "expo/config";

const getAppName = (): string => {
  if (process.env.APP_VARIANT === "production") return "App Integrity";
  if (process.env.APP_VARIANT === "development") return "App Integrity (Dev)";
  if (process.env.APP_VARIANT === "preview") return "App Integrity (Preview)";
  return "App Integrity";
};

const getBundleIdentifier = (): string => {
  if (process.env.APP_VARIANT === "production") return "com.chitrakshtarun.appintegrity";
  if (process.env.APP_VARIANT === "development") return "com.chitrakshtarun.appintegrity.dev";
  if (process.env.APP_VARIANT === "preview") return "com.chitrakshtarun.appintegrity.preview";
  return "com.chitrakshtarun.appintegrity";
};

const config: ExpoConfig = {
  name: getAppName(),
  slug: "expo-app-integrity-example",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "expoappintegrityexample",
  userInterfaceStyle: "automatic",
  ios: {
    icon: "./assets/expo.icon",
    bundleIdentifier: getBundleIdentifier(),
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: getBundleIdentifier(),
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: "server",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#208AEF",
        android: {
          image: "./assets/images/splash-icon.png",
          imageWidth: 76,
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    eas: {
      projectId: "9eddac37-34cf-4b4d-b015-81bff557e8ae",
    },
  },
  owner: "chitrakshtarun",
};

export default config;
