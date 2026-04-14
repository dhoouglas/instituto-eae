import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import Toast from "react-native-toast-message";
import { useAuth } from "@clerk/clerk-expo";
import api from "@/lib/api";
import { FontAwesome } from "@expo/vector-icons";

export type RSVPStatus = "CONFIRMED" | "MAYBE" | "DECLINED";

type Props = {
  eventId: string;
  initialStatus: RSVPStatus | null;
};

export function RSVPSelector({ eventId, initialStatus }: Props) {
  const { getToken } = useAuth();
  const [selection, setSelection] = useState<RSVPStatus | null>(initialStatus);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<RSVPStatus | null>(null);

  useEffect(() => {
    setSelection(initialStatus);
  }, [initialStatus]);

  const handleRsvpPress = useCallback(
    async (status: RSVPStatus) => {
      // Evita chamadas duplicadas
      if (isLoading || status === selection) return;
      
      setPendingStatus(status);
      setIsLoading(true);
      
      try {
        const token = await getToken();
        if (!token) {
          Toast.show({
            type: "error",
            text1: "Sessão expirada. Faça login novamente.",
          });
          return;
        }

        const config = {
          headers: { Authorization: `Bearer ${token}` },
        };

        await api.post(`/events/${eventId}/rsvp`, { status }, config);

        setSelection(status);
        Toast.show({ type: "success", text1: "Sua presença foi atualizada!" });
      } catch (error) {
        console.error("Erro ao registrar presença:", error);
        Toast.show({ type: "error", text1: "Erro ao salvar sua resposta." });
      } finally {
        setIsLoading(false);
        setPendingStatus(null);
      }
    },
    [eventId, getToken, selection, isLoading]
  );

  const getButtonStyles = (status: RSVPStatus) => {
    const isSelected = selection === status;
    const isPending = pendingStatus === status;
    
    switch (status) {
      case "CONFIRMED":
        return {
          icon: "check" as const,
          label: "Vou!",
          bgClass: isSelected ? "bg-green-600" : "bg-white border border-gray-200",
          textClass: isSelected ? "text-white" : "text-gray-600",
          iconColor: isSelected ? "white" : "#16A34A", // green-600
        };
      case "MAYBE":
        return {
          icon: "question" as const,
          label: "Talvez",
          bgClass: isSelected ? "bg-amber-500" : "bg-white border border-gray-200",
          textClass: isSelected ? "text-white" : "text-gray-600",
          iconColor: isSelected ? "white" : "#F59E0B", // amber-500
        };
      case "DECLINED":
        return {
          icon: "times" as const,
          label: "Não vou",
          bgClass: isSelected ? "bg-red-500" : "bg-white border border-gray-200",
          textClass: isSelected ? "text-white" : "text-gray-600",
          iconColor: isSelected ? "white" : "#EF4444", // red-500
        };
    }
  };

  const renderButton = (status: RSVPStatus) => {
    const styles = getButtonStyles(status);
    const isPending = pendingStatus === status;

    return (
      <TouchableOpacity
        key={status}
        onPress={() => handleRsvpPress(status)}
        disabled={isLoading}
        activeOpacity={0.7}
        className={`flex-1 py-3 px-1 rounded-xl items-center justify-center mx-1 flex-row ${styles.bgClass}`}
      >
        {isPending ? (
          <ActivityIndicator color={styles.iconColor === "white" ? "white" : "#6B7280"} size="small" />
        ) : (
          <>
            <FontAwesome name={styles.icon} size={14} color={styles.iconColor} />
            <Text className={`font-[Inter_700Bold] text-sm ml-1.5 ${styles.textClass}`}>
              {styles.label}
            </Text>
          </>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-row justify-between w-full">
      {renderButton("CONFIRMED")}
      {renderButton("MAYBE")}
      {renderButton("DECLINED")}
    </View>
  );
}
