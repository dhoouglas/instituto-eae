import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { EventsStackScreenProps } from "@/routes/types";
import { FontAwesome } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import api from "@/lib/api";
import { RSVPSelector, RSVPStatus } from "@/components/RSVPSelector";
import { useAuth } from "@clerk/clerk-expo";

type EventDetails = {
  id: string;
  title: string;
  location: string;
  date: string;
  imageUrl: string;
  description: string;
};

type Props = EventsStackScreenProps<"eventDetail">;

export function EventDetailsScreen({ route, navigation }: Props) {
  const { eventId } = route.params;
  const { getToken } = useAuth();

  const [event, setEvent] = useState<EventDetails | null>(null);
  const [myStatus, setMyStatus] = useState<RSVPStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEventDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Usuário não autenticado");

      const [eventResponse, attendanceResponse] = await Promise.all([
        api.get(`/events/${eventId}`),
        api.get(`/events/${eventId}/attendance/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setEvent(eventResponse.data.event);
      setMyStatus(attendanceResponse.data.attendance?.status || null);
    } catch (error) {
      console.error("Erro ao buscar dados da tela de detalhes:", error);
      Toast.show({ type: "error", text1: "Erro ao carregar o evento." });
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useFocusEffect(
    useCallback(() => {
      fetchEventDetails();
    }, [fetchEventDetails])
  );

  const handleOpenMaps = () => {
    const url = Platform.select({
      ios: `maps:0,0?q=${event?.location}`,
      android: `geo:0,0?q=${event?.location}`,
    });
    if (url) {
      Linking.openURL(url);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#4b8c34" />
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center">
        <Text className="text-lg text-gray-500">Evento não encontrado.</Text>
      </SafeAreaView>
    );
  }

  const eventDate = new Date(event.date);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView>
        <Image
          source={{ uri: event.imageUrl }}
          className="w-full h-64"
          resizeMode="cover"
        />

        <View className="p-6">
          <Text className="text-4xl font-bold text-gray-900 font-[Inter_700Bold] leading-tight">
            {event.title}
          </Text>

          <View className="mt-4 space-y-3">
            <View className="flex-row items-center">
              <FontAwesome name="calendar" size={20} color="#4b8c34" />
              <Text className="text-lg text-gray-700 ml-3 font-[Inter_400Regular]">
                {eventDate.toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleOpenMaps}
              className="flex-row items-center"
            >
              <FontAwesome name="map-marker" size={24} color="#4b8c34" />
              <Text className="text-lg text-gray-700 ml-3 font-[Inter_400Regular] flex-1">
                {event.location}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="w-full h-px bg-gray-200 my-6" />

          <Text className="text-2xl font-bold text-gray-900 font-[Inter_700Bold] mb-2">
            Sobre o Evento
          </Text>
          <Text className="text-lg text-gray-600 leading-relaxed font-[Inter_400Regular]">
            {event.description}
          </Text>

          <View className="w-full h-px bg-gray-200 my-6" />
          <RSVPSelector eventId={event.id} initialStatus={myStatus} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
