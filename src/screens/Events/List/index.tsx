import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ImageBackground,
  ListRenderItem,
  Platform,
  StatusBar,
  Alert,
} from "react-native";
import { useUser, useAuth } from "@clerk/clerk-expo";
import { FontAwesome } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import api from "@/lib/api";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { EventsStackParamList } from "@/routes/types";
import { Header } from "@/components/Header";

type Event = {
  id: string;
  title: string;
  location: string;
  date: Date;
  imageUrl: string | null;
};

const placeholderImage = require("@/assets/reforestation.svg");

type EventsNavigationProp = StackNavigationProp<EventsStackParamList>;

// --- SKELETON ---
const EventCardSkeleton = () => (
  <View className="bg-white rounded-3xl shadow-sm mb-6 mx-5 border border-gray-100 overflow-hidden">
    <View className="w-full h-48 bg-gray-200" />
    <View className="p-5">
      <View className="h-6 w-3/4 bg-gray-200 rounded mb-3" />
      <View className="h-4 w-1/2 bg-gray-200 rounded mb-2" />
      <View className="h-4 w-1/3 bg-gray-200 rounded" />
    </View>
  </View>
);

const EventCard = ({
  item,
  isAdmin,
  onDelete,
  onEdit,
  onPress,
}: {
  item: Event;
  isAdmin: boolean;
  onDelete: () => void;
  onEdit: () => void;
  onPress: () => void;
}) => {
  const day = item.date.toLocaleDateString("pt-BR", { day: "2-digit" });
  const month = item.date.toLocaleDateString("pt-BR", { month: "short" }).toUpperCase();

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-3xl shadow-sm mb-6 mx-5 border border-gray-100 overflow-hidden"
      activeOpacity={0.9}
    >
      <ImageBackground
        source={item.imageUrl ? { uri: item.imageUrl } : placeholderImage}
        className="w-full h-48 justify-end"
        resizeMode="cover"
      >
        <View className="absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent bg-black/20" />

        {/* Floating Date Badge */}
        <View className="absolute top-4 right-4 bg-white/95 rounded-xl items-center justify-center w-12 h-14 shadow-sm">
          <Text className="text-green-800 text-lg font-[Inter_800ExtraBold] leading-none mt-1">
            {day}
          </Text>
          <Text className="text-gray-600 text-[10px] font-[Inter_700Bold] uppercase mb-1">
            {month}
          </Text>
        </View>

        {isAdmin && (
          <View className="absolute top-4 left-4 flex-row gap-2 z-10">
            <TouchableOpacity
              onPress={onEdit}
              className="bg-white/20 backdrop-blur-md w-8 h-8 rounded-full items-center justify-center border border-white/30"
            >
              <FontAwesome name="pencil" size={14} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onDelete}
              className="bg-red-500/80 backdrop-blur-md w-8 h-8 rounded-full items-center justify-center border border-white/30"
            >
              <FontAwesome name="trash" size={14} color="white" />
            </TouchableOpacity>
          </View>
        )}
      </ImageBackground>

      <View className="p-5">
        <Text className="text-xl font-bold text-gray-800 font-[Inter_800ExtraBold] leading-tight mb-3">
          {item.title}
        </Text>

        <View className="flex-row items-center mb-2">
          <View className="w-6 items-center">
            <FontAwesome name="map-marker" size={16} color="#047857" />
          </View>
          <Text
            className="text-sm text-gray-600 font-[Inter_500Medium] flex-1"
            numberOfLines={1}
          >
            {item.location}
          </Text>
        </View>

        <View className="flex-row items-center">
          <View className="w-6 items-center">
            <FontAwesome name="clock-o" size={14} color="#047857" />
          </View>
          <Text className="text-sm text-gray-600 font-[Inter_500Medium]">
            {item.date.toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit"
            })}h
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export function EventsListScreen() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const isAdmin = user?.publicMetadata?.role === "admin";
  const navigation = useNavigation<EventsNavigationProp>();

  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const renderEventItem: ListRenderItem<Event> = ({ item }) => {
    return (
      <EventCard
        item={item}
        isAdmin={isAdmin}
        onDelete={() => confirmDelete(item.id)}
        onEdit={() => navigation.navigate("editEvent", { eventId: item.id })}
        onPress={() => navigation.navigate("eventDetail", { eventId: item.id })}
      />
    );
  };

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/events");
      const formattedEvents = response.data.events.map((event: any) => ({
        ...event,
        date: new Date(event.date),
      }));
      setEvents(formattedEvents);
    } catch (error: any) {
      console.error("Erro ao buscar eventos:", error);
      const message =
        error.response?.data?.message ||
        "Não foi possível carregar os eventos.";
      Toast.show({ type: "error", text1: "Erro", text2: message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  async function handleDeleteEvent(eventId: string) {
    try {
      const token = await getToken({ template: "api-testing-token" });
      if (!token) {
        Toast.show({ type: "error", text1: "Falha na autenticação." });
        return;
      }

      await api.delete(`/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setEvents((currentEvents) =>
        currentEvents.filter((event) => event.id !== eventId)
      );

      Toast.show({ type: "success", text1: "Evento excluído com sucesso!" });
    } catch (error: any) {
      console.error("Erro ao deletar evento:", error);
      const message =
        error.response?.data?.message || "Não foi possível excluir o evento.";
      Toast.show({ type: "error", text1: "Erro ao excluir", text2: message });
    }
  }

  const confirmDelete = (eventId: string) => {
    Alert.alert(
      "Confirmar Exclusão",
      "Você tem certeza que deseja deletar este evento? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Deletar",
          style: "destructive",
          onPress: () => handleDeleteEvent(eventId),
        },
      ]
    );
  };

  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [fetchEvents])
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View
        style={{
          paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
          flex: 1,
        }}
      >
        <Header
          title="Próximos Eventos"
          showBackButton={true}
          onBackPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate("home" as any);
            }
          }}
        />

        {isLoading && events.length === 0 ? (
          <View style={{ paddingTop: 16 }}>
            <EventCardSkeleton />
            <EventCardSkeleton />
            <EventCardSkeleton />
          </View>
        ) : (
          <FlatList
            data={events}
            renderItem={renderEventItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              flexGrow: 1,
              paddingTop: 16,
              paddingBottom: 100,
            }}
            showsVerticalScrollIndicator={false}
            refreshing={isLoading}
            onRefresh={fetchEvents}
            ListEmptyComponent={() =>
              !isLoading && (
                <View className="flex-1 justify-center items-center px-8 mt-20">
                  <View className="w-24 h-24 bg-green-50 rounded-full items-center justify-center mb-4">
                    <FontAwesome name="calendar-times-o" size={40} color="#166534" />
                  </View>
                  <Text className="text-xl font-[Inter_700Bold] text-gray-800 mt-4 text-center">
                    Nenhum Evento Agendado
                  </Text>
                  <Text className="text-base font-[Inter_400Regular] text-gray-500 mt-2 text-center">
                    Fique de olho para as próximas novidades do Instituto.
                  </Text>
                </View>
              )
            }
          />
        )}

        {isAdmin && (
          <TouchableOpacity
            onPress={() => navigation.navigate("createEvent")}
            className="absolute bottom-6 right-5 bg-green-700 h-14 rounded-full flex-row items-center justify-center shadow-lg px-6 shadow-black/30"
            activeOpacity={0.9}
          >
            <FontAwesome name="plus" size={18} color="white" />
            <Text className="text-white font-[Inter_700Bold] ml-2 text-base">
              Novo Evento
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}