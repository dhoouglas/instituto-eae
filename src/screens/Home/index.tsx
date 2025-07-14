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
  Dimensions,
} from "react-native";
import { useAuth } from "@clerk/clerk-expo";
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
};

type NewsPost = {
  id: string;
  title: string;
  category: string;
  imageUrl: string | null;
  createdAt: string | Date;
};

const placeholderImage = require("@/assets/reforestation.svg");
const { width: screenWidth } = Dimensions.get("window");

const EventCarouselCard = ({
  event,
  onPress,
}: {
  event: Event;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    style={{ width: screenWidth * 0.8, marginRight: 16 }}
  >
    <ImageBackground
      source={event.imageUrl ? { uri: event.imageUrl } : placeholderImage}
      className="w-full h-56 rounded-2xl overflow-hidden justify-end p-4"
      resizeMode="cover"
    >
      <View className="absolute top-0 left-0 right-0 bottom-0 bg-black/20" />
      <Text
        className="text-white text-2xl font-[Inter_700Bold] leading-tight"
        numberOfLines={2}
      >
        {event.title}
      </Text>
      <Text className="text-white/90 text-base font-[Inter_400Regular] mt-1">
        {new Date(event.date).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "long",
        })}
      </Text>
    </ImageBackground>
  </TouchableOpacity>
);

const QuickAccessCard = ({
  icon,
  title,
  onPress,
}: {
  icon: React.ComponentProps<typeof FontAwesome>["name"];
  title: string;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-1 aspect-square bg-white rounded-2xl items-center justify-center p-2 shadow-sm border border-gray-100"
    activeOpacity={0.7}
  >
    <View className="bg-green-100 p-4 rounded-full">
      <FontAwesome name={icon} size={28} color="#4b8c34" />
    </View>
    <Text className="text-center text-gray-700 font-[Inter_600SemiBold] mt-3 text-sm">
      {title}
    </Text>
  </TouchableOpacity>
);

const NewsCard = ({
  item,
  onPress,
}: {
  item: NewsPost;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    className="bg-white rounded-xl shadow-sm mb-4 border border-gray-100 overflow-hidden"
  >
    {item.imageUrl && (
      <ImageBackground
        source={{ uri: item.imageUrl }}
        className="h-32 w-full"
        resizeMode="cover"
      />
    )}
    <View className="p-4">
      <Text className="text-xs font-bold text-green-logo uppercase tracking-wider">
        {item.category}
      </Text>
      <Text
        className="text-lg text-gray-800 font-bold font-[Inter_700Bold] leading-tight mt-1"
        numberOfLines={3}
      >
        {item.title}
      </Text>
      <View className="items-end mt-3 pt-2 border-t border-gray-100">
        <Text className="text-xs text-gray-500 font-[Inter_400Regular]">
          Publicado em {new Date(item.createdAt).toLocaleDateString("pt-BR")}
        </Text>
      </View>
    </View>
  </TouchableOpacity>
);

export function Home({ navigation }: AppTabScreenProps<"home">) {
  const { getToken } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [news, setNews] = useState<NewsPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHomeData = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      const [eventsResponse, newsResponse] = await Promise.all([
        api.get("/events?limit=4", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get("/news?limit=3"),
      ]);

      const formattedEvents = eventsResponse.data.events.map((event: any) => ({
        ...event,
        date: new Date(event.date),
      }));
      setEvents(formattedEvents);
      setNews(newsResponse.data.news);
    } catch (error) {
      console.error("Erro ao buscar dados para a Home:", error);
      Toast.show({ type: "error", text1: "Erro ao carregar os dados." });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchHomeData();
    }, [fetchHomeData])
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
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
          {/* Events Carousel */}
          <View className="mt-2">
            <View className="flex-row justify-between items-center mb-4 px-4">
              <Text className="text-2xl font-bold text-gray-800 font-[Inter_700Bold]">
                Próximos Eventos
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
            {events.length > 0 ? (
              <FlatList
                data={events}
                renderItem={({ item }) => (
                  <EventCarouselCard
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
                contentContainerStyle={{ paddingHorizontal: 16 }}
              />
            ) : (
              <View className="h-40 bg-gray-200 rounded-2xl justify-center items-center mx-4">
                <Text className="text-gray-500">Nenhum evento agendado.</Text>
              </View>
            )}
          </View>

          {/* Quick Access */}
          <View className="mt-8 px-4">
            <Text className="text-2xl font-bold text-gray-800 font-[Inter_700Bold] mb-4">
              Acesso Rápido
            </Text>
            <View className="flex-row gap-4">
              <QuickAccessCard
                icon="paw"
                title="Nossa Fauna"
                onPress={() =>
                  navigation.navigate("faunaFlora", {
                    screen: "faunaFloraList",
                    params: { type: "FAUNA" },
                  })
                }
              />
              <QuickAccessCard
                icon="leaf"
                title="Nossa Flora"
                onPress={() =>
                  navigation.navigate("faunaFlora", {
                    screen: "faunaFloraList",
                    params: { type: "FLORA" },
                  })
                }
              />
            </View>
          </View>

          {/* Latest News */}
          <View className="mt-8 px-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-2xl font-bold text-gray-800 font-[Inter_700Bold]">
                Últimas do Instituto
              </Text>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("news", { screen: "newsList" })
                }
              >
                <Text className="text-base font-bold text-green-logo">
                  Ver todas
                </Text>
              </TouchableOpacity>
            </View>
            {news.length > 0 ? (
              news.map((item) => (
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
              <Text className="text-gray-500">Nenhuma notícia recente.</Text>
            )}
          </View>

          {/* Social Media */}
          <View className="p-6 items-center mt-4 bg-white/50">
            <Text className="text-base text-gray-600 mb-3 font-[Inter_600SemiBold]">
              Siga-nos nas redes
            </Text>
            <View className="flex-row gap-6">
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
                <FontAwesome name="facebook-square" size={36} color="#4267B2" />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
