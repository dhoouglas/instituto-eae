import theme from "@/theme";
import { ActivityIndicator, View } from "react-native";

export function Loading() {
  return (
    <View className="flex items-center justify-center">
      <ActivityIndicator color={theme.COLORS.BROWN_LOGO} />
    </View>
  );
}
