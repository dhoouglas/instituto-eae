import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
  TextInputProps,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Toast from "react-native-toast-message";
import { FontAwesome } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import {
  createEventSchema,
  updateEventSchema,
} from "@/utils/schemas/eventSchemas";
import { useAuth } from "@clerk/clerk-expo";
import api from "@/lib/api";
import { EventsStackScreenProps } from "@/routes/types";
import { Header } from "@/components/Header";
import { useStorage } from "@/hooks/useStorage";

const InputWithLabel = ({
  label,
  icon,
  ...props
}: TextInputProps & {
  label: string;
  icon?: keyof typeof FontAwesome.glyphMap;
}) => (
  <View className="mb-4">
    <Text className="text-base font-bold text-gray-700 mb-2">{label}</Text>
    <View className="flex-row items-center w-full bg-gray-100 border border-gray-300 rounded-xl px-4 h-[58px]">
      {icon && <FontAwesome name={icon} size={20} color="#6B7280" />}
      <Input
        className="flex-1 bg-transparent border-none p-0 ml-3 text-lg"
        placeholderTextColor="#9CA3AF"
        {...props}
      />
    </View>
  </View>
);

type Props = EventsStackScreenProps<"createEvent" | "editEvent">;

export function EventFormScreen({ route, navigation }: Props) {
  const { getToken } = useAuth();
  const { uploadImage, isUploading } = useStorage();
  const eventId =
    route.params && "eventId" in route.params
      ? route.params.eventId
      : undefined;
  const isEditMode = !!eventId;

  const [isFetchingData, setIsFetchingData] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    location: "",
    description: "",
    date: new Date(),
  });

  const [showDatePicker, setShowDatePicker] = useState(false);

  const [imageAsset, setImageAsset] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

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

  const onChangeDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      handleInputChange("date", selectedDate);
    }
  };

  const handleInputChange = (
    field: keyof typeof formData,
    value: string | Date
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  async function handleSaveEvent() {
    setIsSubmitting(true);
    const schema = isEditMode ? updateEventSchema : createEventSchema;
    const validation = schema.safeParse({
      ...formData,
      date: formData.date.toISOString(),
    });

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
        await api.put(`/events/${eventId}`, dataPayload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        Toast.show({
          type: "success",
          text1: "Sucesso!",
          text2: "Evento atualizado com sucesso.",
        });
      } else {
        await api.post("/events", dataPayload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        Toast.show({
          type: "success",
          text1: "Sucesso!",
          text2: "Evento criado com sucesso.",
        });
      }
      navigation.goBack();
    } catch (error: any) {
      console.error("Erro completo ao salvar evento:", error);
      const errorMessage =
        error.response?.data?.message || "Não foi possível salvar o evento.";
      Toast.show({
        type: "error",
        text1: "Erro ao Salvar",
        text2: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    if (isEditMode && eventId) {
      const fetchEventData = async () => {
        setIsFetchingData(true);
        try {
          const response = await api.get(`/events/${eventId}`);
          const event = response.data.event;

          setFormData({
            title: event.title,
            location: event.location,
            description: event.description,
            date: new Date(event.date),
          });

          if (event.imageUrl) {
            setExistingImageUrl(event.imageUrl);
          }
        } catch (error) {
          Toast.show({
            type: "error",
            text1: "Erro ao carregar dados",
            text2: "Não foi possível encontrar os dados do evento.",
          });
          navigation.goBack();
        } finally {
          setIsFetchingData(false);
        }
      };
      fetchEventData();
    }
  }, [eventId, isEditMode, navigation]);

  if (isFetchingData) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
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
          title={isEditMode ? "Editar Evento" : "Criar Novo Evento"}
          subtitle="Preencha os detalhes abaixo"
          showBackButton={true}
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
          <View className="p-6 pt-2">
            <Text className="text-base font-bold text-gray-700 mb-2">
              Imagem de Capa
            </Text>
            <TouchableOpacity
              onPress={handleSelectImage}
              className="w-full h-48 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 items-center justify-center mb-6"
            >
              {imageAsset ? (
                <Image
                  source={{ uri: imageAsset.uri }}
                  className="w-full h-full rounded-xl"
                  resizeMode="cover"
                />
              ) : existingImageUrl ? (
                <Image
                  source={{ uri: existingImageUrl }}
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

            <InputWithLabel
              label="Título do Evento"
              icon="pencil"
              placeholder="Ex: Mutirão de Limpeza"
              value={formData.title}
              onChangeText={(val) => handleInputChange("title", val)}
            />
            <InputWithLabel
              label="Localização"
              icon="map-marker"
              placeholder="Ex: Parque Ibirapuera, SP"
              value={formData.location}
              onChangeText={(text) => handleInputChange("location", text)}
            />

            <Text className="text-base font-bold text-gray-700 mb-2">
              Data do Evento
            </Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              className="w-full bg-gray-100 border border-gray-300 rounded-xl p-4 flex-row items-center mb-4 h-[58px]"
            >
              <FontAwesome name="calendar" size={20} color="#6B7280" />
              <Text className="text-lg text-gray-800 ml-3">
                {formData.date.toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={formData.date}
                mode="date"
                display="default"
                onChange={onChangeDate}
                minimumDate={new Date()} // Opcional: não permite datas passadas
              />
            )}

            <Text className="text-base font-bold text-gray-700 mb-2">
              Descrição Detalhada
            </Text>
            <TextInput
              placeholder="Descreva os detalhes do evento..."
              value={formData.description}
              onChangeText={(text) => handleInputChange("description", text)}
              multiline
              numberOfLines={6}
              className="w-full border border-gray-300 rounded-xl p-4 text-base h-36 bg-gray-100"
              textAlignVertical="top"
            />

            <View className="mt-8 mb-4">
              <Button
                title={isEditMode ? "Salvar Alterações" : "Criar Evento"}
                onPress={handleSaveEvent}
                isLoading={isUploading || isSubmitting} // Loading unificado
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
