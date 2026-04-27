import { Loading } from "@/components/Loading";
import "./src/theme/global.css";
import {
  useFonts,
  Inter_400Regular,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { StatusBar } from "expo-status-bar";
import { Routes } from "@/routes";
import { ClerkProvider } from "@clerk/clerk-expo";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { tokenCache } from "@/utils/tokenCache";

export default function App() {
  const [isFontsLoaded] = useFonts({ Inter_400Regular, Inter_700Bold });

  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    throw new Error(
      "Missing Clerk Publishable Key. Make sure to set it in your .env file."
    );
  }

  if (!isFontsLoaded) {
    return <Loading />;
  }

  return (
    <SafeAreaProvider>
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <StatusBar style="auto" translucent />

        <Routes />
      </ClerkProvider>
    </SafeAreaProvider>
  );
}
