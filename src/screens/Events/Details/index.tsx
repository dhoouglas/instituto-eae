import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  SafeAreaView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
  Dimensions,
  StatusBar as RNStatusBar,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { setStatusBarStyle } from "expo-status-bar";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useAuth } from "@clerk/clerk-expo";
import { EventsStackScreenProps } from "@/routes/types";
import { FontAwesome } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import api from "@/lib/api";
import { RSVPSelector, RSVPStatus } from "@/components/RSVPSelector";
import { Button } from "@/components/Button";
import { CommentSection } from "@/components/Comments/CommentSection";

type EventDetails = {
  id: string;
  title: string;
  location: string;
  date: string;
  imageUrl: string;
  description: string;
};

type Props = EventsStackScreenProps<"eventDetail">;

const { height: screenHeight } = Dimensions.get("window");

const EventDetailsSkeleton = () => (
  <View className="flex-1 bg-white">
    <View className="w-full h-80 bg-gray-200" />
    <View className="p-6 bg-white -mt-8 rounded-t-[32px] h-full">
      <View className="h-8 w-3/4 bg-gray-200 rounded mt-2" />
      <View className="h-16 w-full bg-gray-200 rounded-xl mt-6" />
      <View className="w-12 h-1.5 bg-gray-200 rounded-full my-6" />
      <View className="h-6 w-1/3 bg-gray-200 rounded mb-4" />
      <View className="h-4 w-full bg-gray-200 rounded mb-2" />
      <View className="h-4 w-full bg-gray-200 rounded mb-2" />
      <View className="h-4 w-5/6 bg-gray-200 rounded" />
    </View>
  </View>
);

export function EventDetailsScreen({ route }: Props) {
  const { eventId } = route.params;
  const navigation = useNavigation();
  const { getToken, isLoaded } = useAuth();

  const [event, setEvent] = useState<EventDetails | null>(null);
  const [myStatus, setMyStatus] = useState<RSVPStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) {
      return; // Aguarda o Clerk terminar de carregar a sessão.
    }

    const fetchDetails = async () => {
      setIsLoading(true);
      try {
        const token = await getToken();
        if (!token) {
          Toast.show({
            type: "error",
            text1: "Sessão expirada. Faça login novamente.",
          });
          setIsLoading(false);
          return;
        }

        const config = { headers: { Authorization: `Bearer ${token}` } };

        const [eventResponse, attendanceResponse] = await Promise.all([
          api.get(`/events/${eventId}`, config),
          api.get(`/events/${eventId}/attendance/me`, config),
        ]);

        setEvent(eventResponse.data.event);
        setMyStatus(attendanceResponse.data.attendance?.status || null);
      } catch (error) {
        console.error("Erro ao buscar dados da tela de detalhes:", error);
        Toast.show({ type: "error", text1: "Erro ao carregar o evento." });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, isLoaded]);

  const handleOpenMaps = () => {
    if (!event?.location) return;

    const encodedAddress = encodeURIComponent(event.location);
    const url = Platform.select({
      ios: `maps:0,0?q=${encodedAddress}`,
      android: `geo:0,0?q=${encodedAddress}`,
    });
    if (url) {
      Linking.openURL(url);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <EventDetailsSkeleton />;
    }

    if (!event) {
      return (
        <View className="flex-1 justify-center items-center bg-white p-6">
          <FontAwesome name="calendar-times-o" size={48} color="#D1D5DB" />
          <Text className="text-xl font-[Inter_700Bold] text-gray-800 mt-4 text-center">
            Evento não encontrado.
          </Text>
          <Button
            title="Voltar"
            onPress={() => navigation.goBack()}
            className="mt-6 bg-green-700 w-full"
          />
        </View>
      );
    }

    const eventDate = new Date(event.date);

    return (
      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        className="bg-white"
        enableOnAndroid={true}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={80}
      >
        <View style={{ height: screenHeight * 0.4 }}>
          {event.imageUrl ? (
            <Image
              source={{ uri: event.imageUrl }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-full bg-green-50 items-center justify-center pt-10">
              <FontAwesome name="image" size={60} color="#166534" opacity={0.5} />
            </View>
          )}
          <View className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 to-transparent" />
        </View>

        <View className="bg-white -mt-8 rounded-t-[32px] pt-8 px-6 pb-20">
          <Text className="text-3xl font-[Inter_800ExtraBold] text-gray-900 leading-tight mb-6">
            {event.title}
          </Text>

          <View className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-6">
            <View className="flex-row items-center mb-3 pb-3 border-b border-gray-200/60">
              <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-3">
                <FontAwesome name="calendar" size={18} color="#166534" />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-gray-500 font-[Inter_600SemiBold] uppercase tracking-wider mb-0.5">
                  Quando
                </Text>
                <Text className="text-base text-gray-800 font-[Inter_600SemiBold]">
                  {eventDate.toLocaleDateString("pt-BR", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleOpenMaps}
              className="flex-row items-center"
              activeOpacity={0.7}
            >
              <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-3">
                <FontAwesome name="map-marker" size={20} color="#166534" />
              </View>
              <View className="flex-1 mr-2">
                <Text className="text-xs text-gray-500 font-[Inter_600SemiBold] uppercase tracking-wider mb-0.5">
                  Onde
                </Text>
                <Text className="text-base text-gray-800 font-[Inter_600SemiBold]" numberOfLines={2}>
                  {event.location}
                </Text>
              </View>
              <View className="w-8 h-8 bg-gray-200 rounded-full items-center justify-center">
                <FontAwesome name="angle-right" size={16} color="#4B5563" />
              </View>
            </TouchableOpacity>
          </View>

          <View className="w-12 h-1.5 bg-green-600 rounded-full mb-6" />

          <Text className="text-2xl font-[Inter_800ExtraBold] text-gray-900 mb-3">
            Sobre o Evento
          </Text>
          <Text className="text-[17px] text-gray-700 leading-relaxed font-[Inter_400Regular] mb-8">
            {event.description}
          </Text>

          <View className="bg-gray-50 rounded-2xl p-5 border border-gray-100 mb-8">
            <Text className="text-center font-[Inter_700Bold] text-gray-800 mb-4 text-lg">
              Você vai participar?
            </Text>
            <RSVPSelector eventId={event.id} initialStatus={myStatus} />
          </View>

          <CommentSection entityId={event.id} entityType="event" />
        </View>
      </KeyboardAwareScrollView>
    );
  };

  useFocusEffect(
    useCallback(() => {
      const style = isLoading || !event?.imageUrl ? "dark" : "light";
      setStatusBarStyle(style);
      return () => setStatusBarStyle("auto");
    }, [isLoading, event?.imageUrl])
  );

  return (
    <View className="flex-1 bg-white">

      {renderContent()}

      <SafeAreaView className="absolute top-0 left-0 w-full" pointerEvents="box-none">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="ml-4 mt-2 w-10 h-10 rounded-full items-center justify-center bg-white/30 backdrop-blur-md border border-white/40"
          style={{
            marginTop: Platform.OS === "android" ? (RNStatusBar.currentHeight || 24) + 10 : 10,
          }}
        >
          <FontAwesome name="angle-left" size={24} color={isLoading || !event?.imageUrl ? "#374151" : "white"} style={{ marginRight: 2 }} />
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}