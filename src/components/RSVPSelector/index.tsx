import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";

// Definimos os possíveis estados de confirmação
type RSVPStatus = "CONFIRMED" | "MAYBE" | "DECLINED";

export function RSVPSelector() {
  // Estado para controlar qual botão está ativo
  const [selection, setSelection] = useState<RSVPStatus | null>(null);

  // Função para criar o botão, evitando repetição de código
  const renderButton = (status: RSVPStatus, text: string) => {
    const isSelected = selection === status;

    // Estilos condicionais
    const containerClasses = isSelected ? "bg-green-logo" : "bg-green-100";
    const textClasses = isSelected ? "text-white" : "text-green-logo";

    return (
      <TouchableOpacity
        onPress={() => setSelection(status)}
        className={`flex-1 py-3 rounded-lg items-center justify-center mx-1 ${containerClasses}`}
      >
        <Text className={`font-bold text-base ${textClasses}`}>{text}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View>
      <Text className="text-2xl font-bold text-gray-900 font-[Inter_700Bold] mb-4">
        Você vai participar?
      </Text>
      <View className="flex-row justify-between">
        {renderButton("CONFIRMED", "Vou!")}
        {renderButton("MAYBE", "Talvez")}
        {renderButton("DECLINED", "Não vou")}
      </View>
    </View>
  );
}
