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
import { Input } from "@/components/Input";
import api from "@/lib/api";
import { Header } from "@/components/Header";
import { CategorySelector } from "@/components/CategorySelector";

import * as ImagePicker from "expo-image-picker";
import { FontAwesome } from "@expo/vector-icons";

type Props = NewsStackScreenProps<"createNews" | "editNews">;

export function NewsFormScreen({ route, navigation }: Props) {
  const { getToken } = useAuth();

  const newsId =
    route.params && "newsId" in route.params ? route.params.newsId : undefined;
  const isEditMode = !!newsId;

  const [isFetchingData, setIsFetchingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    content: "",
    // imageUrl: "",
  });
  const [image, setImage] = useState<{ uri: string; isNew: boolean } | null>(
    null
  );

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
            setImage({ uri: newsPost.imageUrl, isNew: false });
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
  }, [isEditMode, newsId]);

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
      quality: 0.7,
    });
    if (!pickerResult.canceled) {
      setImage({ uri: pickerResult.assets[0].uri, isNew: true });
    }
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

    try {
      const token = await getToken({ template: "api-testing-token" });
      let finalImageUrl: string | null | undefined =
        image && !image.isNew ? image.uri : undefined;

      if (image && image.isNew) {
        // TODO: Lógica real de upload da 'image.uri' para o Supabase Storage aqui.
        console.log("Simulando upload de nova imagem...");
        finalImageUrl = `https://picsum.photos/seed/${Date.now()}/800/600`;
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
    } catch (error) {
      let errorMessage = "Não foi possível salvar a notícia.";

      if (error && typeof error === "object" && "response" in error) {
        console.error("Erro ao salvar notícia:", (error as any).response?.data);
      } else {
        console.error("Erro ao salvar notícia:", error);
      }

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
      <SafeAreaView className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#4b8c34" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View
        style={{
          paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
          flex: 1,
        }}
      >
        <Header
          title={isEditMode ? "Editar Notícia" : "Criar Nova Notícia"}
          showBackButton={true}
          subtitle="Preencha os detalhes abaixo"
        />

        <KeyboardAwareScrollView
          resetScrollToCoords={{ x: 0, y: 0 }}
          contentContainerStyle={{
            justifyContent: "center",
            paddingBottom: 255,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="p-6">
            <Text className="text-base font-bold text-gray-700 mb-2">
              Imagem de Capa
            </Text>
            <TouchableOpacity
              onPress={handleSelectImage}
              className="w-full h-48 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 items-center justify-center mb-6"
            >
              {image ? (
                <Image
                  source={{ uri: image.uri }}
                  className="w-full h-full rounded-xl"
                  resizeMode="cover"
                />
              ) : (
                <View className="items-center">
                  <FontAwesome name="image" size={40} color="#9CA3AF" />
                  <Text className="text-gray-500 mt-2">
                    Clique para escolher uma imagem
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <Input
              value={formData.title}
              onChangeText={(val) => handleInputChange("title", val)}
              placeholder="Título da notícia"
              className="mb-4"
            />
            <CategorySelector
              selectedCategory={formData.category}
              onSelectCategory={(category) =>
                handleInputChange("category", category)
              }
            />

            <TextInput
              placeholder="Conteúdo completo da notícia..."
              value={formData.content}
              onChangeText={(val) => handleInputChange("content", val)}
              multiline
              numberOfLines={10}
              className="w-full border border-gray-300 rounded-xl p-4 text-base h-56 bg-gray-100 align-top"
              textAlignVertical="top"
            />

            <View className="mt-8">
              <Button
                title={isEditMode ? "Salvar Alterações" : "Publicar Notícia"}
                onPress={handleSaveNews}
                isLoading={isSubmitting}
                className="bg-green-logo py-4 rounded-xl items-center justify-center"
                textClassName="text-white text-lg font-bold"
                hasShadow
                shadowColor="#4b8c34"
              />
            </View>
          </View>
        </KeyboardAwareScrollView>
      </View>
    </SafeAreaView>
  );
}
