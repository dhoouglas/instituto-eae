import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
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
};

type NewsNavigationProp = StackNavigationProp<NewsStackParamList, "newsList">;

const NewsCardSkeleton = () => (
  <View className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden border border-gray-100">
    <View className="w-full h-40 bg-gray-200" />
    <View className="p-4">
      <View className="h-4 w-1/4 bg-gray-200 rounded" />
      <View className="h-6 w-3/4 bg-gray-200 rounded mt-2" />
    </View>
  </View>
);

const NewsCard = ({
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
    className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden border border-gray-100"
  >
    {item.imageUrl ? (
      <Image
        source={{ uri: item.imageUrl }}
        className="w-full h-40"
        resizeMode="cover"
      />
    ) : (
      <View className="w-full h-40 bg-gray-200 items-center justify-center">
        <FontAwesome name="image" size={40} color="#9CA3AF" />
      </View>
    )}
    <View className="p-4">
      <Text className="text-xs font-bold text-green-logo uppercase">
        {item.category}
      </Text>
      <Text className="text-lg font-bold text-gray-800 mt-1" numberOfLines={2}>
        {item.title}
      </Text>
    </View>
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

  const renderNewsItem: ListRenderItem<NewsPost> = ({ item }) => (
    <NewsCard
      item={item}
      isAdmin={isAdmin}
      onPress={() => navigation.navigate("newsDetail", { newsId: item.id })}
      onEdit={() => navigation.navigate("editNews", { newsId: item.id })}
      onDelete={() => confirmDelete(item.id)}
    />
  );

  const renderContent = () => {
    if (isLoading && news.length === 0) {
      return (
        <View style={{ paddingHorizontal: 24, paddingTop: 6 }}>
          <NewsCardSkeleton />
          <NewsCardSkeleton />
          <NewsCardSkeleton />
        </View>
      );
    }

    if (fetchError) {
      return (
        <View className="flex-1 justify-center items-center p-6">
          <Text className="text-lg text-red-500 text-center mb-4">
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
          paddingHorizontal: 24,
          paddingBottom: 90,
        }}
        refreshing={isLoading}
        onRefresh={fetchNews}
        ListEmptyComponent={
          !isLoading ? (
            <View className="flex-1 justify-center items-center">
              <Text className="text-gray-500">Nenhuma notícia encontrada.</Text>
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
        <Header title="Últimas Notícias" showBackButton={true} />

        {renderContent()}

        {isAdmin && (
          <TouchableOpacity
            onPress={() => navigation.navigate("createNews")}
            className="absolute bottom-8 right-6 bg-green-logo w-16 h-16 rounded-full items-center justify-center shadow-lg"
            activeOpacity={0.8}
          >
            <FontAwesome name="plus" size={24} color="white" />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
