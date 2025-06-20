import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

// 1. Importamos o conjunto de ícones que queremos usar diretamente do @expo/vector-icons
import { FontAwesome } from "@expo/vector-icons";

export default function SocialAuthButtons() {
  return (
    <View className="w-full mt-8">
      <View className="flex-row items-center">
        <View className="flex-1 h-px bg-gray-200" />
        <Text className="mx-4 text-gray-600 font-[Inter_400Regular]">
          Ou continue com
        </Text>
        <View className="flex-1 h-px bg-gray-200" />
      </View>

      <View className="flex-row justify-center space-x-4 mt-5 gap-3">
        {/* 2. Usamos o componente importado diretamente (ex: <FontAwesome />) */}
        <TouchableOpacity className="items-center justify-center w-16 h-16 border border-gray-200 rounded-2xl">
          <FontAwesome name="google" size={28} color="#DB4437" />
        </TouchableOpacity>

        <TouchableOpacity className="items-center justify-center w-16 h-16 border border-gray-200 rounded-2xl">
          <FontAwesome name="facebook" size={28} color="#4267B2" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
