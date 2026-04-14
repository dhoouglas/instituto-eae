import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
  TouchableOpacity,
  Image,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useAuth } from "@clerk/clerk-expo";
import Toast from "react-native-toast-message";

import { NewsStackScreenProps } from "@/routes/types";
import {
  createNewsPostSchema,
  updateNewsPostSchema,
} from "@/utils/schemas/newsSchemas";

import { Button } from "@/components/Button";
import api from "@/lib/api";
import { Header } from "@/components/Header";
import { CategorySelector } from "@/components/CategorySelector";
import { useStorage } from "@/hooks/useStorage";

import * as ImagePicker from "expo-image-picker";
import { FontAwesome } from "@expo/vector-icons";

type Props = NewsStackScreenProps<"createNews" | "editNews">;

export function NewsFormScreen({ route, navigation }: Props) {
  const { getToken } = useAuth();
  const { uploadImage, isUploading } = useStorage();

  const newsId =
    route.params && "newsId" in route.params ? route.params.newsId : undefined;
  const isEditMode = !!newsId;

  const [isFetchingData, setIsFetchingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    content: "",
  });
  const [imageAsset, setImageAsset] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isEditMode) {
      const fetchNewsData = async () => {
        try {
          const response = await api.get(`/news/${newsId}`);
          const newsPost = response.data.newsPost;
          setFormData({
            title: newsPost.title,
            category: newsPost.category,
            content: newsPost.content,
          });
          if (newsPost.imageUrl) {
            setExistingImageUrl(newsPost.imageUrl);
          }
        } catch (error) {
          Toast.show({ type: "error", text1: "Erro ao carregar dados." });
          navigation.goBack();
        } finally {
          setIsFetchingData(false);
        }
      };
      fetchNewsData();
    } else {
      setIsFetchingData(false);
    }
  }, [isEditMode, newsId, navigation]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelectImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(
        "Permissão necessária",
        "É preciso permitir o acesso à galeria para escolher uma imagem."
      );
      return;
    }
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!pickerResult.canceled) {
      setImageAsset(pickerResult.assets[0]);
    }
  };

  const handleRemoveImage = () => {
    setImageAsset(null);
    setExistingImageUrl(null);
  };

  const handleSaveNews = async () => {
    setIsSubmitting(true);
    const schema = isEditMode ? updateNewsPostSchema : createNewsPostSchema;

    const validation = schema.safeParse(formData);

    if (!validation.success) {
      Toast.show({
        type: "error",
        text1: "Dados Inválidos",
        text2: validation.error.errors[0].message,
      });
      setIsSubmitting(false);
      return;
    }

    if (!isEditMode && !imageAsset) {
      Toast.show({
        type: "error",
        text1: "Imagem Obrigatória",
        text2: "Por favor, selecione uma imagem de capa.",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const token = await getToken({ template: "api-testing-token" });
      let finalImageUrl = existingImageUrl;

      if (imageAsset) {
        const uploadedUrl = await uploadImage(imageAsset);
        if (!uploadedUrl) {
          Toast.show({
            type: "error",
            text1: "Erro no Upload",
            text2: "Não foi possível carregar a imagem. Tente novamente.",
          });
          setIsSubmitting(false);
          return;
        }
        finalImageUrl = uploadedUrl;
      }

      const dataPayload = { ...validation.data, imageUrl: finalImageUrl };

      if (isEditMode) {
        await api.put(`/news/${newsId}`, dataPayload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        Toast.show({
          type: "success",
          text1: "Sucesso!",
          text2: "Notícia atualizada.",
        });
      } else {
        await api.post("/news", dataPayload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        Toast.show({
          type: "success",
          text1: "Sucesso!",
          text2: "Notícia criada.",
        });
      }
      navigation.goBack();
    } catch (error: any) {
      console.error("Erro completo ao salvar notícia:", error);
      const errorMessage =
        error.response?.data?.message || "Não foi possível salvar a notícia.";
      Toast.show({
        type: "error",
        text1: "Erro ao Salvar",
        text2: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isFetchingData) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#166534" />
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
          title={isEditMode ? "Editar Notícia" : "Nova Notícia"}
          showBackButton={true}
        />

        <View className="flex-1">
          <KeyboardAwareScrollView
            resetScrollToCoords={{ x: 0, y: 0 }}
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingTop: 16,
              paddingBottom: 120, // Espaço para o botão fixo e margem
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            enableOnAndroid={true}
            extraScrollHeight={120}
          >
            {/* Image Picker */}
            <View className="mb-6">
              <Text className="text-sm font-[Inter_700Bold] text-gray-700 mb-2 ml-1 uppercase tracking-wider">
                Capa da Notícia
              </Text>
              {imageAsset || existingImageUrl ? (
                <View className="w-full h-48 rounded-3xl overflow-hidden shadow-sm border border-gray-100">
                  <Image
                    source={{ uri: imageAsset ? imageAsset.uri : existingImageUrl! }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    onPress={handleRemoveImage}
                    className="absolute top-3 right-3 bg-red-500/90 w-10 h-10 rounded-full items-center justify-center backdrop-blur-md"
                  >
                    <FontAwesome name="trash" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={handleSelectImage}
                  activeOpacity={0.7}
                  className="w-full h-48 bg-white rounded-3xl border-2 border-dashed border-green-300 items-center justify-center shadow-sm"
                >
                  <View className="bg-green-50 w-16 h-16 rounded-full items-center justify-center mb-3">
                    <FontAwesome name="camera" size={24} color="#166534" />
                  </View>
                  <Text className="text-gray-500 font-[Inter_500Medium]">
                    Toque para adicionar uma capa
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Title */}
            <View className="mb-5">
              <Text className="text-sm font-[Inter_700Bold] text-gray-700 mb-2 ml-1 uppercase tracking-wider">
                Título Principal
              </Text>
              <TextInput
                value={formData.title}
                onChangeText={(val) => handleInputChange("title", val)}
                placeholder="Ex: Novo mutirão de plantio..."
                placeholderTextColor="#9CA3AF"
                className="bg-white px-5 py-4 rounded-2xl text-lg font-[Inter_600SemiBold] text-gray-800 shadow-sm border border-gray-100"
              />
            </View>

            {/* Category */}
            <View className="mb-5">
              <Text className="text-sm font-[Inter_700Bold] text-gray-700 mb-2 ml-1 uppercase tracking-wider">
                Categoria
              </Text>
              <CategorySelector
                selectedCategory={formData.category}
                onSelectCategory={(category) =>
                  handleInputChange("category", category)
                }
              />
            </View>

            {/* Content */}
            <View className="mb-8">
              <Text className="text-sm font-[Inter_700Bold] text-gray-700 mb-2 ml-1 uppercase tracking-wider">
                Conteúdo
              </Text>
              <TextInput
                placeholder="Escreva a notícia completa aqui..."
                placeholderTextColor="#9CA3AF"
                value={formData.content}
                onChangeText={(val) => handleInputChange("content", val)}
                multiline
                numberOfLines={10}
                className="bg-white px-5 py-4 rounded-2xl text-base font-[Inter_400Regular] text-gray-700 h-64 align-top shadow-sm border border-gray-100 leading-relaxed"
                textAlignVertical="top"
              />
            </View>
          </KeyboardAwareScrollView>

          {/* Sticky Bottom Button */}
          <View className="absolute bottom-0 left-0 right-0 p-5 bg-gray-50/90 backdrop-blur-xl border-t border-gray-200/50">
            <Button
              title={isEditMode ? "Salvar Alterações" : "Publicar Notícia"}
              onPress={handleSaveNews}
              isLoading={isUploading || isSubmitting}
              className="bg-green-700 h-14 rounded-full items-center justify-center shadow-lg shadow-green-900/20"
              textClassName="text-white text-lg font-[Inter_700Bold]"
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}