import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Image,
  Platform,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import api from "@/lib/api";
import { NewsStackScreenProps } from "@/routes/types";
import Toast from "react-native-toast-message";
import { Button } from "@/components/Button";
import { FontAwesome } from "@expo/vector-icons";

type NewsDetails = {
  title: string;
  content: string;
  category: string;
  imageUrl: string | null;
  createdAt: string;
};

type Props = NewsStackScreenProps<"newsDetail">;

const DetailsSkeleton = () => (
  <View className="flex-1">
    <View className="w-full h-64 bg-gray-200" />
    <View className="p-6">
      <View className="h-4 w-1/4 bg-gray-200 rounded" />
      <View className="h-8 w-3/4 bg-gray-200 rounded mt-2" />
      <View className="h-4 w-1/2 bg-gray-200 rounded mt-2" />
      <View className="w-16 h-1 bg-gray-200 my-6" />
      <View className="h-4 w-full bg-gray-200 rounded mt-2" />
      <View className="h-4 w-full bg-gray-200 rounded mt-2" />
      <View className="h-4 w-5/6 bg-gray-200 rounded mt-2" />
    </View>
  </View>
);

export function NewsDetailsScreen({ route, navigation }: Props) {
  const { newsId } = route.params;

  const [post, setPost] = useState<NewsDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchPostDetails = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const response = await api.get(`/news/${newsId}`);
      setPost(response.data.newsPost);
    } catch (error) {
      const errorMessage = "Não foi possível carregar a notícia.";
      setFetchError(errorMessage);
      Toast.show({ type: "error", text1: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }, [newsId]);

  useEffect(() => {
    fetchPostDetails();
  }, [fetchPostDetails]);

  const renderContent = () => {
    if (isLoading) {
      return <DetailsSkeleton />;
    }

    if (fetchError) {
      return (
        <View className="flex-1 justify-center items-center p-6">
          <Text className="text-lg text-red-500 text-center mb-4">
            {fetchError}
          </Text>
          <Button title="Tentar Novamente" onPress={fetchPostDetails} />
        </View>
      );
    }

    if (!post) {
      return (
        <View className="flex-1 justify-center items-center">
          <Text className="text-lg text-gray-500">Notícia não encontrada.</Text>
        </View>
      );
    }

    return (
      <ScrollView>
        {post.imageUrl && (
          <Image
            source={{ uri: post.imageUrl }}
            className="w-full h-64"
            resizeMode="cover"
          />
        )}
        <View className="p-6">
          <Text className="text-sm font-bold text-green-logo uppercase">
            {post.category}
          </Text>
          <Text className="text-3xl font-bold text-gray-900 mt-1 font-[Inter_700Bold]">
            {post.title}
          </Text>
          <Text className="text-sm text-gray-500 mt-2">
            Publicado em{" "}
            {new Date(post.createdAt).toLocaleDateString("pt-BR", {
              dateStyle: "long",
            })}
          </Text>
          <View className="w-16 h-1 bg-green-logo my-6" />
          <Text className="text-lg text-gray-700 leading-relaxed font-[Inter_400Regular]">
            {post.content}
          </Text>
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View
        style={{
          flex: 1,
        }}
      >
        {renderContent()}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="absolute top-4 left-4 bg-black/20 w-10 h-10 rounded-full items-center justify-center"
          style={{
            marginTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
          }}
        >
          <FontAwesome name="arrow-left" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
