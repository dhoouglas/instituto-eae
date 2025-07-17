import { useNotifications } from "@/hooks/useNotifications";
import { Loading } from "@/components/Loading";
import "./src/theme/global.css";
import {
  useFonts,
  Inter_400Regular,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { StatusBar } from "react-native";
import { Routes } from "@/routes";
import { ClerkProvider } from "@clerk/clerk-expo";
import Toast from "react-native-toast-message";

export default function App() {
  const [isFontsLoaded] = useFonts({ Inter_400Regular, Inter_700Bold });
  useNotifications();

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
    <>
      <ClerkProvider publishableKey={publishableKey}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent
        />

        <Routes />
      </ClerkProvider>

      <Toast />
    </>
  );
}
