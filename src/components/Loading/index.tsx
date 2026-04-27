import React from "react";
import { ActivityIndicator, View, SafeAreaView } from "react-native";
import theme from "@/theme";

interface LoadingProps {
  fullScreen?: boolean;
  size?: "small" | "large";
  color?: string;
}

export function Loading({ fullScreen = false, size = "large", color = "#166534" }: LoadingProps) {
  if (fullScreen) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size={size} color={color} />
      </SafeAreaView>
    );
  }

  return (
    <View className="flex items-center justify-center">
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}
