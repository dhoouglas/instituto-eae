import "./src/theme/global.css";

import {
  Inter_400Regular,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { StatusBar, Text, View } from "react-native";

export default function App() {
  const [isFontsLoaded] = useFonts({ Inter_400Regular, Inter_700Bold });

  return (
    <View className="flex-1 items-center justify-center">
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      {isFontsLoaded ? <Text>Hello EAE !</Text> : null}
    </View>
  );
}
