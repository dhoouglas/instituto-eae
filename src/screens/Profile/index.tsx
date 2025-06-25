// Exemplo para src/screens/Eventos.tsx
import React from "react";
import { View, Text, SafeAreaView } from "react-native";

export function Profile() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center items-center">
        <Text className="text-2xl font-bold">Tela de Perfil</Text>
      </View>
    </SafeAreaView>
  );
}
