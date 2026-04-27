import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
  ImageBackground,
  ListRenderItem,
  Alert,
  Platform,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useUser, useAuth } from "@clerk/clerk-expo";
import { FontAwesome } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

import { Header } from "@/components/Header";
import { NewsStackParamList } from "@/routes/types";
import api from "@/lib/api";
import { Button } from "@/components/Button";

type NewsPost = {
  id: string;
  title: string;
  category: string;
  imageUrl: string | null;
  createdAt: string | Date;
};

type NewsNavigationProp = StackNavigationProp<NewsStackParamList, "newsList">;

// --- SKELETONS ---
const HeroSkeleton = () => (
  <View className="bg-gray-200 rounded-3xl h-64 mb-6 shadow-sm mx-5 mt-4 border border-gray-100" />
);

const HorizontalSkeleton = () => (
  <View className="bg-white rounded-2xl shadow-sm mb-4 border border-gray-100 flex-row overflow-hidden h-28 mx-5">
    <View className="w-28 h-full bg-gray-200" />
    <View className="flex-1 p-3 justify-between">
      <View className="h-3 w-1/3 bg-gray-200 rounded mb-2" />
      <View className="h-4 w-full bg-gray-200 rounded mb-1" />
      <View className="h-4 w-2/3 bg-gray-200 rounded" />
      <View className="h-3 w-1/4 bg-gray-200 rounded mt-auto" />
    </View>
  </View>
);

// --- CARDS ---

// Card 1: Destaque (Hero)
const HeroNewsCard = ({
  item,
  isAdmin,
  onEdit,
  onDelete,
  onPress,
}: {
  item: NewsPost;
  isAdmin: boolean;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.9}
    className="mx-5 mt-4 mb-6"
  >
    <ImageBackground
      source={item.imageUrl ? { uri: item.imageUrl } : require("@/assets/reforestation.svg")}
      className="h-64 w-full rounded-3xl overflow-hidden justify-end p-5 shadow-sm"
      resizeMode="cover"
    >
      <View className="absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent bg-black/40" />

      <View className="absolute top-4 left-4 bg-green-600 px-3 py-1 rounded-full">
        <Text className="text-white text-[10px] font-[Inter_800ExtraBold] uppercase tracking-wider">
          Destaque
        </Text>
      </View>

      {isAdmin && (
        <View className="absolute top-4 right-4 flex-row gap-2 z-10">
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

      <View>
        <Text className="text-green-400 text-xs font-[Inter_800ExtraBold] uppercase tracking-wider mb-1.5">
          {item.category}
        </Text>
        <Text
          className="text-white text-2xl font-[Inter_800ExtraBold] leading-tight"
          numberOfLines={3}
        >
          {item.title}
        </Text>
        <Text className="text-gray-300 text-xs font-[Inter_500Medium] mt-2">
          {new Date(item.createdAt || new Date()).toLocaleDateString("pt-BR")}
        </Text>
      </View>
    </ImageBackground>
  </TouchableOpacity>
);

// Card 2..N: Horizontal Compacto
const HorizontalNewsCard = ({
  item,
  isAdmin,
  onEdit,
  onDelete,
  onPress,
}: {
  item: NewsPost;
  isAdmin: boolean;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    className="bg-white rounded-2xl shadow-sm mb-4 border border-gray-100 flex-row overflow-hidden h-32 mx-5"
  >
    <View className="w-32 h-full bg-gray-100">
      {item.imageUrl ? (
        <Image
          source={{ uri: item.imageUrl }}
          className="w-full h-full"
          resizeMode="cover"
        />
      ) : (
        <View className="w-full h-full items-center justify-center bg-green-50">
          <FontAwesome name="newspaper-o" size={28} color="#166534" />
        </View>
      )}
    </View>
    <View className="flex-1 p-3.5 justify-between">
      <View>
        <Text className="text-[10px] font-[Inter_800ExtraBold] text-green-700 uppercase tracking-wider mb-1">
          {item.category}
        </Text>
        <Text
          className="text-base text-gray-800 font-[Inter_700Bold] leading-snug"
          numberOfLines={2}
        >
          {item.title}
        </Text>
      </View>

      <View className="flex-row items-center justify-between mt-2">
        <Text className="text-[11px] text-gray-500 font-[Inter_500Medium]">
          {new Date(item.createdAt || new Date()).toLocaleDateString("pt-BR")}
        </Text>

        {isAdmin && (
          <View className="flex-row gap-2">
            <TouchableOpacity onPress={onEdit} className="p-1">
              <FontAwesome name="pencil" size={14} color="#4B5563" />
            </TouchableOpacity>
            <TouchableOpacity onPress={onDelete} className="p-1">
              <FontAwesome name="trash" size={14} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  </TouchableOpacity>
);

export function NewsListScreen() {
  const navigation = useNavigation<NewsNavigationProp>();
  const { user } = useUser();
  const { getToken } = useAuth();
  const isAdmin = user?.publicMetadata?.role === "admin";

  const [news, setNews] = useState<NewsPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchNews = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const response = await api.get("/news");
      setNews(response.data.news);
    } catch (error) {
      const errorMessage = "Não foi possível carregar as notícias.";
      setFetchError(errorMessage);
      Toast.show({ type: "error", text1: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchNews();
    }, [fetchNews])
  );

  const handleDeleteNews = async (newsId: string) => {
    try {
      const token = await getToken({ template: "api-testing-token" });
      await api.delete(`/news/${newsId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Toast.show({ type: "success", text1: "Notícia excluída com sucesso!" });
      setNews((prevNews) => prevNews.filter((item) => item.id !== newsId));
    } catch (error) {
      Toast.show({ type: "error", text1: "Erro ao excluir notícia." });
    }
  };

  const confirmDelete = (newsId: string) => {
    Alert.alert(
      "Confirmar Exclusão",
      "Tem certeza que deseja deletar esta notícia?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Deletar",
          style: "destructive",
          onPress: () => handleDeleteNews(newsId),
        },
      ]
    );
  };

  const renderNewsItem: ListRenderItem<NewsPost> = ({ item, index }) => {
    // A primeira notícia vira o destaque (Hero)
    if (index === 0) {
      return (
        <HeroNewsCard
          item={item}
          isAdmin={isAdmin}
          onPress={() => navigation.navigate("newsDetail", { newsId: item.id })}
          onEdit={() => navigation.navigate("editNews", { newsId: item.id })}
          onDelete={() => confirmDelete(item.id)}
        />
      );
    }

    // As demais são horizontais
    return (
      <HorizontalNewsCard
        item={item}
        isAdmin={isAdmin}
        onPress={() => navigation.navigate("newsDetail", { newsId: item.id })}
        onEdit={() => navigation.navigate("editNews", { newsId: item.id })}
        onDelete={() => confirmDelete(item.id)}
      />
    );
  };

  const renderContent = () => {
    if (isLoading && news.length === 0) {
      return (
        <View style={{ paddingTop: 6 }}>
          <HeroSkeleton />
          <HorizontalSkeleton />
          <HorizontalSkeleton />
          <HorizontalSkeleton />
        </View>
      );
    }

    if (fetchError) {
      return (
        <View className="flex-1 justify-center items-center p-6">
          <Text className="text-lg text-red-500 text-center mb-4 font-[Inter_500Medium]">
            {fetchError}
          </Text>
          <Button title="Tentar Novamente" onPress={fetchNews} />
        </View>
      );
    }

    return (
      <FlatList
        data={news}
        renderItem={renderNewsItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: 6,
          paddingBottom: 100,
        }}
        refreshing={isLoading}
        onRefresh={fetchNews}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading ? (
            <View className="flex-1 justify-center items-center px-8 mt-20">
              <View className="w-24 h-24 bg-green-50 rounded-full items-center justify-center mb-4">
                <FontAwesome name="newspaper-o" size={40} color="#166534" />
              </View>
              <Text className="text-gray-800 text-xl font-[Inter_700Bold] text-center mb-2">
                Nenhuma notícia
              </Text>
              <Text className="text-gray-500 text-center font-[Inter_400Regular]">
                Fique de olho, em breve publicaremos novidades do instituto.
              </Text>
            </View>
          ) : null
        }
      />
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View
        style={{
          paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
          flex: 1,
        }}
      >
        <Header
          title="Notícias"
          showBackButton={true}
          onBackPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate("home" as any);
            }
          }}
        />

        {renderContent()}

        {isAdmin && (
          <TouchableOpacity
            onPress={() => navigation.navigate("createNews")}
            className="absolute bottom-6 right-5 bg-green-700 h-14 rounded-full flex-row items-center justify-center shadow-lg px-6 shadow-black/30"
            activeOpacity={0.9}
          >
            <FontAwesome name="plus" size={18} color="white" />
            <Text className="text-white font-[Inter_700Bold] ml-2 text-base">
              Nova Notícia
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
