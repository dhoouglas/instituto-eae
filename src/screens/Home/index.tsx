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
import { useAuth, useUser } from "@clerk/clerk-expo";
import { AppTabScreenProps } from "@/routes/types";
import { useFocusEffect } from "@react-navigation/native";
import api from "@/lib/api";
import { FontAwesome } from "@expo/vector-icons";
import { Header } from "@/components/Header";
import Toast from "react-native-toast-message";

type Event = {
  id: string;
  title: string;
  location: string;
  date: Date;
  imageUrl: string | null;
  myAttendanceStatus: string | null;
};

type NewsPost = {
  id: string;
  title: string;
  category: string;
  imageUrl: string | null;
};

const placeholderImage = require("@/assets/reforestation.svg");

const FeaturedEventCard = ({
  event,
  onPress,
}: {
  event: Event;
  onPress: () => void;
}) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
    <ImageBackground
      source={event.imageUrl ? { uri: event.imageUrl } : placeholderImage}
      className="w-full h-56 rounded-2xl overflow-hidden justify-end p-4"
      resizeMode="cover"
    >
      <View className="absolute top-0 left-0 right-0 bottom-0 bg-black/10" />
      <Text className="text-white text-2xl font-[Inter_700Bold] leading-tight">
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
      source={event.imageUrl ? { uri: event.imageUrl } : placeholderImage}
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

// const mockNews = [
//   {
//     id: "1",
//     category: "CONSERVAÇÃO",
//     title:
//       "Instituto EAE lança novo projeto de reflorestamento na Serra da Mantiqueira.",
//   },
//   {
//     id: "2",
//     category: "EDUCAÇÃO",
//     title: "Inscrições abertas para a oficina de compostagem de Setembro.",
//   },
//   {
//     id: "3",
//     category: "EVENTO",
//     title: "Confira as fotos do último mutirão de limpeza na Praia de Grumari.",
//   },
// ];

const NewsCard = ({
  item,
  onPress,
}: {
  item: {
    id: string;
    category: string;
    title: string;
    createdAt: string | Date;
    imageUrl: string | null;
  };
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    className="bg-white rounded-xl shadow-sm mb-4 border border-gray-100 p-4"
  >
    <View className="flex-row items-start">
      <View className="bg-green-100 p-3 rounded-lg mr-4">
        <FontAwesome name="newspaper-o" size={24} color="#4b8c34" />
      </View>
      <View className="flex-1">
        <Text className="text-xs font-bold text-green-logo uppercase">
          {item.category}
        </Text>
        <Text
          className="text-lg text-gray-800 font-bold font-[Inter_700Bold] leading-tight mt-1"
          numberOfLines={2}
        >
          {item.title}
        </Text>
      </View>
    </View>
    <View className="items-end mt-2 pt-2 border-t border-gray-100">
      <Text className="text-xs text-gray-500 font-[Inter_400Regular]">
        Publicado em {new Date(item.createdAt).toLocaleDateString("pt-BR")}
      </Text>
    </View>
  </TouchableOpacity>
);

export function Home({ navigation }: AppTabScreenProps<"home">) {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [news, setNews] = useState<NewsPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHomeData = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await getToken();

      const [eventsResponse, newsResponse] = await Promise.all([
        api.get("/events", { headers: { Authorization: `Bearer ${token}` } }),
        api.get("/news"),
      ]);

      const formattedEvents = eventsResponse.data.events.map((event: any) => ({
        ...event,
        date: new Date(event.date),
      }));
      setEvents(formattedEvents);

      setNews(newsResponse.data.news);
    } catch (error) {
      console.error("Erro ao buscar dados para a Home:", error);
      Toast.show({ type: "error", text1: "Erro ao carregar dados da Home." });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchHomeData();
    }, [fetchHomeData])
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
        <ActivityIndicator size="large" color="#4b8c34" />
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
                {news.length > 0 ? (
                  news.map((item: any) => (
                    <NewsCard
                      key={item.id}
                      item={item}
                      onPress={() =>
                        navigation.navigate("news", {
                          screen: "newsDetail",
                          params: { newsId: item.id },
                        })
                      }
                    />
                  ))
                ) : (
                  <Text className="text-gray-500">
                    Nenhuma notícia recente.
                  </Text>
                )}
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
