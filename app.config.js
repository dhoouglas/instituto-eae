module.exports = {
  expo: {
    name: "Instituto-EAE",
    slug: "Instituto-EAE",
    scheme: "instituto-eae",
    owner: "dhoouglas",
    version: "1.0.1",
    orientation: "portrait",
    icon: "./assets/splash-icon-light.png",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon-light.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
      dark: {
        image: "./assets/splash-icon-dark.png",
        backgroundColor: "#000000",
      },
    },
    ios: {
      supportsTablet: true,
      icon: {
        dark: "./assets/ios-dark.png",
        light: "./assets/ios-light.png",
        tinted: "./assets/ios-tinted.png",
      },
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          "Este aplicativo usa sua localização para exibir sua posição no mapa e seguir trilhas.",
        NSLocationAlwaysAndWhenInUseUsageDescription:
          "Este aplicativo usa sua localização em segundo plano para gravar suas trilhas, mesmo quando o aplicativo não está aberto.",
        UIBackgroundModes: ["location", "fetch"],
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        monochromeImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
      package: "com.dhoouglas.appeae",
      permissions: [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION",
      ],
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
      },
    },
    notification: {
      icon: "./assets/icon.png",
      color: "#ffffff",
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    extra: {
      eas: {
        projectId: "8d1cd463-5729-400c-8641-79cd892344f0",
      },
    },
    plugins: [
      "expo-font",
      "expo-web-browser",
      "expo-notifications",
      "expo-location",
    ],
  },
};
