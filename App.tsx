import { Loading } from "@/components/Loading";
import "./src/theme/global.css";

import {
  Inter_400Regular,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { StatusBar, View } from "react-native";
import { Routes } from "@/routes";

export default function App() {
  const [isFontsLoaded] = useFonts({ Inter_400Regular, Inter_700Bold });

  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      {isFontsLoaded ? <Routes /> : <Loading />}
    </>
  );
}
