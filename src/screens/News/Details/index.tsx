import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  SafeAreaView,
  Image,
  Platform,
  StatusBar as RNStatusBar,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { setStatusBarStyle } from "expo-status-bar";
import { useFocusEffect } from "@react-navigation/native";
import api from "@/lib/api";
import { NewsStackScreenProps } from "@/routes/types";
import Toast from "react-native-toast-message";
import { Button } from "@/components/Button";
import { FontAwesome } from "@expo/vector-icons";
import { CommentSection } from "@/components/Comments/CommentSection";

type NewsDetails = {
  title: string;
  content: string;
  category: string;
  imageUrl: string | null;
  createdAt: string;
};

type Props = NewsStackScreenProps<"newsDetail">;

const { height: screenHeight } = Dimensions.get("window");

const DetailsSkeleton = () => (
  <View className="flex-1 bg-white">
    <View className="w-full h-80 bg-gray-200" />
    <View className="p-6 bg-white -mt-6 rounded-t-3xl h-full">
      <View className="h-4 w-1/4 bg-gray-200 rounded" />
      <View className="h-8 w-3/4 bg-gray-200 rounded mt-4" />
      <View className="h-4 w-1/2 bg-gray-200 rounded mt-4" />
      <View className="w-16 h-1 bg-gray-200 my-6" />
      <View className="h-4 w-full bg-gray-200 rounded mt-2" />
      <View className="h-4 w-full bg-gray-200 rounded mt-3" />
      <View className="h-4 w-5/6 bg-gray-200 rounded mt-3" />
      <View className="h-4 w-full bg-gray-200 rounded mt-3" />
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
        <View className="flex-1 justify-center items-center p-6 bg-white">
          <FontAwesome name="exclamation-triangle" size={40} color="#EF4444" className="mb-4" />
          <Text className="text-lg text-gray-800 text-center mt-4 mb-6 font-[Inter_500Medium]">
            {fetchError}
          </Text>
          <Button title="Tentar Novamente" onPress={fetchPostDetails} className="w-full bg-green-700" />
        </View>
      );
    }

    if (!post) {
      return (
        <View className="flex-1 justify-center items-center bg-white">
          <FontAwesome name="newspaper-o" size={40} color="#9CA3AF" />
          <Text className="text-lg text-gray-500 font-[Inter_500Medium] mt-4">Notícia não encontrada.</Text>
        </View>
      );
    }

    return (
      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        className="bg-white"
        enableOnAndroid={true}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={80}
      >
        <View style={{ height: screenHeight * 0.4 }}>
          {post.imageUrl ? (
            <Image
              source={{ uri: post.imageUrl }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-full bg-green-50 items-center justify-center pt-10">
              <FontAwesome name="newspaper-o" size={60} color="#166534" opacity={0.5} />
            </View>
          )}
          <View className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 to-transparent" />
        </View>

        <View className="bg-white -mt-8 rounded-t-[32px] pt-8 px-6 pb-20">
          <View className="flex-row items-center mb-4">
            <View className="bg-green-100 px-3 py-1.5 rounded-full mr-3">
              <Text className="text-xs font-[Inter_800ExtraBold] text-green-800 uppercase tracking-wider">
                {post.category}
              </Text>
            </View>
            <View className="flex-row items-center flex-1">
              <FontAwesome name="clock-o" size={14} color="#6B7280" />
              <Text className="text-xs text-gray-500 font-[Inter_500Medium] ml-1.5">
                {new Date(post.createdAt).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric"
                })}
              </Text>
            </View>
          </View>

          <Text className="text-3xl text-gray-900 leading-tight font-[Inter_800ExtraBold] tracking-tight">
            {post.title}
          </Text>

          <View className="w-12 h-1.5 bg-green-600 rounded-full my-6" />

          <Text className="text-[17px] text-gray-700 leading-relaxed font-[Inter_400Regular]">
            {post.content}
          </Text>

          <CommentSection entityId={newsId} entityType="news" />
        </View>
      </KeyboardAwareScrollView>
    );
  };

  useFocusEffect(
    useCallback(() => {
      const style = isLoading || !post?.imageUrl ? "dark" : "light";
      setStatusBarStyle(style);
      return () => setStatusBarStyle("auto");
    }, [isLoading, post?.imageUrl])
  );

  return (
    <View className="flex-1 bg-white">

      {renderContent()}

      <SafeAreaView className="absolute top-0 left-0 w-full" pointerEvents="box-none">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="ml-4 mt-2 w-10 h-10 rounded-full items-center justify-center bg-white/30 backdrop-blur-md border border-white/40"
          style={{
            marginTop: Platform.OS === "android" ? (RNStatusBar.currentHeight || 24) + 10 : 10,
          }}
        >
          <FontAwesome name="angle-left" size={24} color={isLoading || !post?.imageUrl ? "#374151" : "white"} style={{ marginRight: 2 }} />
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}