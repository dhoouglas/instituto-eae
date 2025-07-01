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
} from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { FontAwesome } from "@expo/vector-icons";
import { AppStackScreenProps } from "@/routes/types";
import Toast from "react-native-toast-message";
import api from "@/lib/api";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "@clerk/clerk-expo";

type Event = {
  id: string;
  title: string;
  location: string;
  date: Date;
  imageUrl: string;
};

// const mockEvents: Event[] = [
//   {
//     id: "1",
//     title: "Mutirão de Limpeza na Praia de Grumari",
//     location: "Praia de Grumari, Rio de Janeiro",
//     date: new Date("2025-08-20T09:00:00"),
//     imageUrl: "https://picsum.photos/seed/event1/400/300",
//   },
//   {
//     id: "2",
//     title: "Plantio de Mudas na Floresta da Tijuca",
//     location: "Setor A, Floresta da Tijuca, RJ",
//     date: new Date("2025-09-15T08:30:00"),
//     imageUrl: "https://picsum.photos/seed/event3/400/300",
//   },
//   {
//     id: "3",
//     title: "Palestra sobre Reciclagem e Compostagem",
//     location: "Sede do Instituto EAE",
//     date: new Date("2025-10-01T19:00:00"),
//     imageUrl: "https://picsum.photos/seed/event3/400/300",
//   },
// ];

type Props = AppStackScreenProps<"eventsList">;

const EventCard = ({
  item,
  isAdmin,
  onDelete,
}: {
  item: Event;
  isAdmin: boolean;
  onDelete: () => void;
}) => (
  <TouchableOpacity
    className="bg-white rounded-xl shadow-md mb-5 overflow-hidden"
    activeOpacity={0.8}
  >
    {isAdmin && (
      <TouchableOpacity
        onPress={onDelete}
        className="absolute bottom-3 right-3 bg-green-800/80 p-2 rounded-lg z-10"
      >
        <FontAwesome name="trash" size={16} color="white" />
      </TouchableOpacity>
    )}

    <Image
      source={{ uri: item.imageUrl }}
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

export function EventsListScreen({ navigation }: Props) {
  const { user } = useUser();
  const { getToken } = useAuth();
  const isAdmin = user?.publicMetadata?.role === "admin";

  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const renderEventItem: ListRenderItem<Event> = ({ item }) => {
    return (
      <EventCard
        item={item}
        isAdmin={isAdmin}
        onDelete={() => confirmDelete(item.id)}
      />
    );
  };

  async function fetchEvents() {
    setIsLoading(true);
    try {
      const response = await api.get("/events");
      const formattedEvents = response.data.events.map((event: any) => ({
        ...event,
        date: new Date(event.date),
      }));

      setEvents(formattedEvents);
    } catch (error) {
      console.error("Erro ao buscar eventos:", error);
      Toast.show({ type: "error", text1: "Erro ao carregar eventos." });
    } finally {
      setIsLoading(false);
    }
  }

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

      Toast.show({ type: "success", text1: "Evento excluído com sucesso!" });
      fetchEvents();
    } catch (error) {
      console.error("Erro ao deletar evento:", error);
      Toast.show({ type: "error", text1: "Erro ao excluir evento." });
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
    }, [])
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View
        style={{
          paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
          flex: 1,
        }}
      >
        <Text className="text-3xl font-bold text-green-800 font-[Inter_700Bold] px-4 pt-4 pb-2">
          Próximos Eventos
        </Text>

        <FlatList
          data={events}
          renderItem={renderEventItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            flexGrow: 1,
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
                  Nenhum evento agendado no momento. Os novos eventos são
                  criados por integrantes do EAE.
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
