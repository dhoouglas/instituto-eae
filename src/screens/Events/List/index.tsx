import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
  ListRenderItem,
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { FontAwesome } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import api from "@/lib/api";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { EventsStackParamList } from "@/routes/types";
import { useAuth } from "@clerk/clerk-expo";
import { Header } from "@/components/Header";

type Event = {
  id: string;
  title: string;
  location: string;
  date: Date;
  imageUrl: string | null;
};

const placeholderImage = require("@/assets/bg.png");

type EventsNavigationProp = StackNavigationProp<EventsStackParamList>;

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
}) => (
  <TouchableOpacity
    onPress={onPress}
    className="bg-white rounded-xl shadow-md mb-5 overflow-hidden"
    activeOpacity={0.8}
  >
    {isAdmin && (
      <View className="absolute bottom-3 right-3 flex-row gap-1 z-10">
        <TouchableOpacity
          onPress={onEdit}
          className="bg-green-800/80 w-8 h-8 rounded-lg items-center justify-center shadow"
        >
          <FontAwesome name="pencil" size={16} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onDelete}
          className="bg-green-800/80 w-8 h-8 rounded-lg items-center justify-center shadow"
        >
          <FontAwesome name="trash" size={16} color="white" />
        </TouchableOpacity>
      </View>
    )}

    <Image
      source={item.imageUrl ? { uri: item.imageUrl } : placeholderImage}
      style={{ width: "100%", height: 160, backgroundColor: "#E5E7EB" }}
      resizeMode="cover"
    />
    <View className="p-4">
      <Text className="text-lg font-bold text-gray-800 font-[Inter_700Bold] leading-tight">
        {item.title}
      </Text>
      <View className="flex-row items-center mt-2">
        <FontAwesome name="map-marker" size={16} color="#6B7280" />
        <Text
          className="text-base text-gray-600 ml-2 font-[Inter_400Regular] flex-1"
          numberOfLines={1}
        >
          {item.location}
        </Text>
      </View>
      <View className="flex-row items-center mt-1">
        <FontAwesome name="calendar" size={16} color="#6B7280" />
        <Text className="text-base text-gray-600 ml-2 font-[Inter_400Regular]">
          {item.date.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </Text>
      </View>
    </View>
  </TouchableOpacity>
);

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
      // console.log(
      //   "Dados brutos recebidos da API:",
      //   JSON.stringify(response.data.events, null, 2)
      // );
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
        <Header title="Próximos Eventos" showBackButton={true} />

        <FlatList
          data={events}
          renderItem={renderEventItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: 6,
            paddingHorizontal: 24,
            paddingBottom: 90,
          }}
          showsVerticalScrollIndicator={false}
          refreshing={isLoading}
          onRefresh={fetchEvents}
          ListEmptyComponent={() =>
            !isLoading && (
              <View className="flex-1 justify-center items-center px-8">
                <FontAwesome
                  name="calendar-times-o"
                  size={48}
                  color="#D1D5DB"
                />
                <Text className="text-xl font-bold text-gray-600 mt-4 text-center">
                  Nenhum Evento Encontrado
                </Text>
                <Text className="text-base text-gray-400 mt-2 text-center">
                  Ainda não há eventos futuros agendados. Fique de olho para
                  novidades!
                </Text>
              </View>
            )
          }
        />

        {isAdmin && (
          <TouchableOpacity
            onPress={() => navigation.navigate("createEvent")}
            className="absolute bottom-8 right-6 bg-green-800 w-16 h-16 rounded-full items-center justify-center shadow-lg"
            activeOpacity={0.8}
          >
            <FontAwesome name="plus" size={24} color="white" />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
