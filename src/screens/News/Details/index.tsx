import React, { useState, useEffect, useCallback } from "react";
import { View, Text, SafeAreaView, ScrollView, Image } from "react-native";
import api from "@/lib/api";
import { NewsStackScreenProps } from "@/routes/types";
import Toast from "react-native-toast-message";
import { Loading } from "@/components/Loading";
import { useAuth } from "@clerk/clerk-expo";

type NewsDetails = {
  title: string;
  content: string;
  category: string;
  imageUrl: string | null;
  createdAt: string;
};

// Tipo para os parâmetros da rota
type Props = NewsStackScreenProps<"newsDetail">;

export function NewsDetailsScreen({ route, navigation }: Props) {
  const { getToken } = useAuth();
  const { newsId } = route.params;

  const [post, setPost] = useState<NewsDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPostDetails = async () => {
      try {
        const response = await api.get(`/news/${newsId}`);
        setPost(response.data.newsPost);
      } catch (error) {
        Toast.show({ type: "error", text1: "Erro ao carregar notícia." });
      } finally {
        setIsLoading(false);
      }
    };
    fetchPostDetails();
  }, [newsId]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <Loading />
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <Text className="text-lg text-gray-500">Notícia não encontrada.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
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
    </SafeAreaView>
  );
}
