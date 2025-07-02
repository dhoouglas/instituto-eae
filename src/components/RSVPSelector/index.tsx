import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import Toast from "react-native-toast-message";
import api from "@/lib/api";

export type RSVPStatus = "CONFIRMED" | "MAYBE" | "DECLINED";

type Props = {
  eventId: string;
  initialStatus: RSVPStatus | null;
};

export function RSVPSelector({ eventId, initialStatus }: Props) {
  const { getToken } = useAuth();
  const [selection, setSelection] = useState<RSVPStatus | null>(initialStatus);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setSelection(initialStatus);
  }, [initialStatus]);

  const handleRsvpPress = useCallback(
    async (status: RSVPStatus) => {
      setIsLoading(true);
      try {
        const token = await getToken({ template: "api-testing-token" });

        await api.post(
          `/events/${eventId}/rsvp`,
          { status },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setSelection(status);
        Toast.show({ type: "success", text1: "Sua presença foi atualizada!" });
      } catch (error) {
        console.error("Erro ao registrar presença:", error);
        Toast.show({ type: "error", text1: "Erro ao salvar sua resposta." });
      } finally {
        setIsLoading(false);
      }
    },
    [eventId, getToken]
  );

  const renderButton = (status: RSVPStatus, text: string) => {
    const isSelected = selection === status;
    const containerClasses = isSelected ? "bg-green-logo" : "bg-green-100";
    const textClasses = isSelected ? "text-white" : "text-green-logo";

    return (
      <TouchableOpacity
        onPress={() => handleRsvpPress(status)}
        disabled={isLoading}
        className={`flex-1 py-3 rounded-lg items-center justify-center mx-1 ${containerClasses}`}
      >
        {isLoading && isSelected ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className={`font-bold text-base ${textClasses}`}>{text}</Text>
        )}
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
