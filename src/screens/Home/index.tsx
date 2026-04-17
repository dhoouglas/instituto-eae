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
  StatusBar as RNStatusBar,
  Dimensions,
  Image,
} from "react-native";
import { StatusBar } from "expo-status-bar";
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

// Hero Banner - Chama para a Aventura
const HeroBanner = ({ onPress }: { onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.9} className="mx-4 mt-4">
    <ImageBackground
      source={{
        uri: "https://images.pexels.com/photos/1194235/pexels-photo-1194235.jpeg",
      }}
      className="h-56 w-full rounded-3xl overflow-hidden justify-between p-5 shadow-sm"
      resizeMode="cover"
    >
      <View className="absolute top-0 left-0 right-0 bottom-0 bg-black/40" />
      <View>
        <Text className="text-white text-3xl font-[Inter_800ExtraBold] leading-tight">
          Explore Nossas Trilhas
        </Text>
        <Text className="text-white/90 text-base font-[Inter_400Regular] mt-2">
          Caminhe, descubra e conecte-se com a natureza.
        </Text>
      </View>
      <View className="self-start mt-4">
        <View className="bg-green-600 rounded-full flex-row items-center px-5 py-2.5">
          <Text className="text-white font-[Inter_700Bold] text-sm mr-2">
            Iniciar Aventura
          </Text>
          <FontAwesome name="arrow-right" size={14} color="white" />
        </View>
      </View>
    </ImageBackground>
  </TouchableOpacity>
);

// Quick Access Row - Thumb Zone Friendly
const QuickActionItem = ({
  icon,
  title,
  onPress,
  color = "#166534", // green-800
  bgColor = "#DCFCE7", // green-50
}: {
  icon: React.ComponentProps<typeof FontAwesome>["name"];
  title: string;
  onPress: () => void;
  color?: string;
  bgColor?: string;
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    className="items-center w-20"
  >
    <View
      style={{ backgroundColor: bgColor }}
      className="w-14 h-14 rounded-full items-center justify-center mb-2 shadow-sm"
    >
      <FontAwesome name={icon} size={24} color={color} />
    </View>
    <Text
      className="text-xs text-gray-700 font-[Inter_600SemiBold] text-center"
      numberOfLines={1}
    >
      {title}
    </Text>
  </TouchableOpacity>
);

const EventCarouselCard = ({
  event,
  onPress,
}: {
  event: Event;
  onPress: () => void;
}) => {
  const eventDate = new Date(event.date);
  const day = eventDate.toLocaleDateString("pt-BR", { day: "2-digit" });
  const month = eventDate.toLocaleDateString("pt-BR", { month: "short" }).toUpperCase();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{ width: screenWidth * 0.75, marginRight: 16 }}
    >
      <ImageBackground
        source={event.imageUrl ? { uri: event.imageUrl } : placeholderImage}
        className="w-full h-48 rounded-2xl overflow-hidden justify-end p-4 shadow-sm"
        resizeMode="cover"
      >
        <View className="absolute top-0 left-0 right-0 bottom-0 bg-black/30" />

        {/* Floating Date Badge */}
        <View className="absolute top-3 right-3 bg-white/95 rounded-xl items-center justify-center w-12 h-14 shadow-sm">
          <Text className="text-green-800 text-lg font-[Inter_800ExtraBold] leading-none mt-1">
            {day}
          </Text>
          <Text className="text-gray-600 text-[10px] font-[Inter_700Bold] uppercase mb-1">
            {month}
          </Text>
        </View>

        <Text
          className="text-white text-xl font-[Inter_700Bold] leading-tight"
          numberOfLines={2}
        >
          {event.title}
        </Text>
        <View className="flex-row items-center mt-2">
          <FontAwesome name="map-marker" size={12} color="#E5E7EB" />
          <Text className="text-gray-200 text-sm font-[Inter_500Medium] ml-1.5" numberOfLines={1}>
            {event.location}
          </Text>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
};

// Compact News Card - Image Left, Text Right
const NewsCardHorizontal = ({
  item,
  onPress,
}: {
  item: NewsPost;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    className="bg-white rounded-2xl shadow-sm mb-4 border border-gray-100 flex-row overflow-hidden h-28 mx-4"
  >
    <View className="w-28 h-full bg-gray-200">
      {item.imageUrl ? (
        <Image
          source={{ uri: item.imageUrl }}
          className="w-full h-full"
          resizeMode="cover"
        />
      ) : (
        <View className="w-full h-full items-center justify-center bg-green-50">
          <FontAwesome name="newspaper-o" size={24} color="#166534" />
        </View>
      )}
    </View>
    <View className="flex-1 p-3 justify-between">
      <View>
        <Text className="text-[10px] font-bold text-green-700 uppercase tracking-wider mb-1">
          {item.category}
        </Text>
        <Text
          className="text-base text-gray-800 font-[Inter_700Bold] leading-tight"
          numberOfLines={2}
        >
          {item.title}
        </Text>
      </View>
      <Text className="text-[11px] text-gray-500 font-[Inter_500Medium]">
        {new Date(item.createdAt).toLocaleDateString("pt-BR")}
      </Text>
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
        <ActivityIndicator size="large" color="#166534" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <View
        style={{
          paddingTop: Platform.OS === "android" ? RNStatusBar.currentHeight : 0,
          flex: 1,
        }}
      >
        <Header
          showGreeting={true}
          onAvatarPress={() =>
            navigation.navigate("profile", { screen: "profileMain" })
          }
        />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>

          {/* Hero Section */}
          <HeroBanner
            onPress={() =>
              navigation.navigate("trails", { screen: "TrailList" })
            }
          />

          {/* Quick Actions Row */}
          <View className="mt-6 px-2">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
              <QuickActionItem
                icon="map-signs"
                title="Trilhas"
                onPress={() => navigation.navigate("trails", { screen: "TrailList" })}
                color="#047857" // emerald-700
                bgColor="#D1FAE5" // emerald-50
              />
              <QuickActionItem
                icon="paw"
                title="Fauna"
                onPress={() => navigation.navigate("faunaFlora", { screen: "faunaFloraList", params: { type: "FAUNA" } })}
                color="#B45309" // amber-700
                bgColor="#FEF3C7" // amber-50
              />
              <QuickActionItem
                icon="leaf"
                title="Flora"
                onPress={() => navigation.navigate("faunaFlora", { screen: "faunaFloraList", params: { type: "FLORA" } })}
                color="#15803D" // green-700
                bgColor="#DCFCE7" // green-50
              />
              <QuickActionItem
                icon="calendar"
                title="Eventos"
                onPress={() => navigation.navigate("events", { screen: "eventsList" })}
                color="#4338CA" // indigo-700
                bgColor="#E0E7FF" // indigo-50
              />
              <QuickActionItem
                icon="newspaper-o"
                title="Notícias"
                onPress={() => navigation.navigate("news", { screen: "newsList" })}
                color="#0369A1" // sky-700
                bgColor="#E0F2FE" // sky-50
              />
            </ScrollView>
          </View>

          {/* Events Carousel */}
          <View className="mt-8">
            <View className="flex-row justify-between items-center mb-4 px-5">
              <Text className="text-xl font-bold text-gray-800 font-[Inter_800ExtraBold]">
                Próximos Eventos
              </Text>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("events", { screen: "eventsList" })
                }
                className="flex-row items-center"
              >
                <Text className="text-sm font-[Inter_700Bold] text-green-700 mr-1">
                  Ver todos
                </Text>
                <FontAwesome name="angle-right" size={14} color="#15803D" />
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
                snapToInterval={screenWidth * 0.75 + 16}
                decelerationRate="fast"
              />
            ) : (
              <View className="h-32 bg-white border border-gray-100 rounded-2xl justify-center items-center mx-4 shadow-sm">
                <FontAwesome name="calendar-times-o" size={32} color="#D1D5DB" />
                <Text className="text-gray-400 font-[Inter_500Medium] mt-2">Nenhum evento agendado.</Text>
              </View>
            )}
          </View>

          {/* Latest News */}
          <View className="mt-8">
            <View className="flex-row justify-between items-center mb-4 px-5">
              <Text className="text-xl font-bold text-gray-800 font-[Inter_800ExtraBold]">
                Últimas Notícias
              </Text>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("news", { screen: "newsList" })
                }
                className="flex-row items-center"
              >
                <Text className="text-sm font-[Inter_700Bold] text-green-700 mr-1">
                  Ver todas
                </Text>
                <FontAwesome name="angle-right" size={14} color="#15803D" />
              </TouchableOpacity>
            </View>
            {news.length > 0 ? (
              news.map((item) => (
                <NewsCardHorizontal
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
              <View className="h-28 bg-white border border-gray-100 rounded-2xl justify-center items-center shadow-sm mx-4">
                <FontAwesome name="newspaper-o" size={28} color="#D1D5DB" />
                <Text className="text-gray-400 font-[Inter_500Medium] mt-2">Nenhuma notícia recente.</Text>
              </View>
            )}
          </View>

          {/* Social Media Footer */}
          <View className="p-8 items-center mt-4">
            <Text className="text-sm text-gray-500 mb-4 font-[Inter_600SemiBold] uppercase tracking-widest">
              Siga o Instituto
            </Text>
            <View className="flex-row gap-6">
              <TouchableOpacity
                onPress={() =>
                  Linking.openURL("https://www.instagram.com/institutoeae/#")
                }
                className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100"
              >
                <FontAwesome name="instagram" size={24} color="#E1306C" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  Linking.openURL("https://www.facebook.com/institutoeae")
                }
                className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100"
              >
                <FontAwesome name="facebook" size={24} color="#1877F2" />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}