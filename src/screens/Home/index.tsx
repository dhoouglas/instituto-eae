import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ImageBackground,
  ActivityIndicator,
  Linking,
  Platform,
  StatusBar,
} from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { AppTabScreenProps } from "@/routes/types";
import { useFocusEffect } from "@react-navigation/native";
import api from "@/lib/api";
import { FontAwesome } from "@expo/vector-icons";
import { Header } from "@/components/Header";

type Event = {
  id: string;
  title: string;
  location: string;
  date: Date;
  imageUrl: string;
};

const FeaturedEventCard = ({
  event,
  onPress,
}: {
  event: Event;
  onPress: () => void;
}) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
    <ImageBackground
      source={{ uri: event.imageUrl }}
      className="w-full h-56 rounded-2xl overflow-hidden justify-end p-4"
      resizeMode="cover"
    >
      <View className="absolute top-0 left-0 right-0 bottom-0 bg-black/40" />
      <Text className="text-white text-2xl font-bold font-[Inter_700Bold] leading-tight">
        {event.title}
      </Text>
      <Text className="text-white/90 text-base font-[Inter_400Regular] mt-1">
        {event.date.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "long",
        })}
      </Text>
    </ImageBackground>
  </TouchableOpacity>
);

const SmallEventCard = ({
  event,
  onPress,
}: {
  event: Event;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    className="w-64 mr-4 bg-white rounded-xl shadow-sm border border-gray-100"
  >
    <ImageBackground
      source={{ uri: event.imageUrl }}
      className="w-full h-24 rounded-t-xl overflow-hidden"
      resizeMode="cover"
    />
    <View className="p-3">
      <Text
        className="font-bold font-[Inter_700Bold] text-gray-800"
        numberOfLines={2}
      >
        {event.title}
      </Text>
      <Text className="text-gray-500 text-sm mt-1">{event.location}</Text>
    </View>
  </TouchableOpacity>
);

const mockNews = [
  {
    id: "1",
    category: "CONSERVAÇÃO",
    title:
      "Instituto EAE lança novo projeto de reflorestamento na Serra da Mantiqueira.",
  },
  {
    id: "2",
    category: "EDUCAÇÃO",
    title: "Inscrições abertas para a oficina de compostagem de Setembro.",
  },
  {
    id: "3",
    category: "EVENTO",
    title: "Confira as fotos do último mutirão de limpeza na Praia de Grumari.",
  },
];

const NewsCard = ({ item }: { item: (typeof mockNews)[0] }) => (
  <TouchableOpacity
    className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex-row items-center mb-3"
    activeOpacity={0.7}
  >
    <View className="bg-green-100 p-3 rounded-lg">
      <FontAwesome name="newspaper-o" size={24} color="#2A9D8F" />
    </View>
    <View className="flex-1 ml-4">
      <Text className="text-xs font-bold text-green-logo">{item.category}</Text>
      <Text
        className="text-base text-gray-800 font-[Inter_400Regular] leading-tight mt-1"
        numberOfLines={2}
      >
        {item.title}
      </Text>
    </View>
  </TouchableOpacity>
);

export function Home({ navigation }: AppTabScreenProps<"home">) {
  const { user } = useUser();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/events");
      const formattedEvents = response.data.events.map((event: any) => ({
        ...event,
        date: new Date(event.date),
      }));
      setEvents(formattedEvents);
    } catch (error) {
      console.error("Erro ao buscar eventos na Home:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [fetchEvents])
  );

  const featuredEvent = events[0];
  const otherEvents = events.slice(1);

  const getInitials = () => {
    const fullName = user?.fullName;
    if (!fullName) return "VE"; // Voluntário EAE
    const names = fullName.split(" ");
    if (names.length > 1)
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    return names[0] ? names[0][0].toUpperCase() : "";
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#2A9D8F" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View
        style={{
          paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
          flex: 1,
        }}
      >
        <Header
          showGreeting={true}
          onAvatarPress={() => navigation.navigate("profile")}
        />
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="px-4">
            <View className="">
              {featuredEvent ? (
                <FeaturedEventCard
                  event={featuredEvent}
                  onPress={() =>
                    navigation.navigate("events", {
                      screen: "eventDetail",
                      params: { eventId: featuredEvent.id },
                    })
                  }
                />
              ) : (
                <View className="h-56 bg-gray-200 rounded-2xl justify-center items-center">
                  <Text className="text-gray-500">
                    Nenhum evento em destaque.
                  </Text>
                </View>
              )}
            </View>

            <View className="mt-8">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-2xl font-bold text-gray-800 font-[Inter_700Bold]">
                  Outros Eventos
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("events", { screen: "eventsList" })
                  }
                >
                  <Text className="text-base font-bold text-green-logo">
                    Ver todos
                  </Text>
                </TouchableOpacity>
              </View>
              {otherEvents.length > 0 ? (
                <FlatList
                  data={otherEvents}
                  renderItem={({ item }) => (
                    <SmallEventCard
                      event={item}
                      onPress={() =>
                        navigation.navigate("events", {
                          screen: "eventDetail",
                          params: { eventId: item.id },
                        })
                      }
                    />
                  )}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                />
              ) : (
                <Text className="text-gray-500">
                  Não há outros eventos no momento.
                </Text>
              )}
            </View>

            <View className="mt-8">
              <Text className="text-2xl font-bold text-gray-800 font-[Inter_700Bold] mb-4">
                Últimas do Instituto
              </Text>
              <View>
                {mockNews.map((item) => (
                  <NewsCard key={item.id} item={item} />
                ))}
              </View>
            </View>

            <View className="p-3 items-center">
              <Text className="text-base text-gray-500 mb-2">
                Siga-nos nas redes
              </Text>
              <View className="flex-row gap-4">
                <TouchableOpacity
                  onPress={() =>
                    Linking.openURL("https://www.instagram.com/institutoeae/#")
                  }
                >
                  <FontAwesome name="instagram" size={36} color="#C13584" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    Linking.openURL("https://www.facebook.com/institutoeae")
                  }
                >
                  <FontAwesome
                    name="facebook-square"
                    size={36}
                    color="#4267B2"
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
