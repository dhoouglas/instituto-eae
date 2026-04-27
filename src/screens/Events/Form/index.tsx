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
import { Loading } from "@/components/Loading";

const InputWithLabel = ({
  label,
  icon,
  ...props
}: TextInputProps & {
  label: string;
  icon?: keyof typeof FontAwesome.glyphMap;
}) => (
  <View className="mb-5">
    <Text className="text-sm font-[Inter_700Bold] text-gray-700 mb-2 ml-1 uppercase tracking-wider">
      {label}
    </Text>
    <View className="flex-row items-center w-full bg-white border border-gray-100 shadow-sm rounded-2xl px-5 h-16">
      {icon && <FontAwesome name={icon} size={20} color="#9CA3AF" />}
      <Input
        className="flex-1 bg-transparent border-none p-0 ml-3 text-lg font-[Inter_600SemiBold] text-gray-800"
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

  const handleRemoveImage = () => {
    setImageAsset(null);
    setExistingImageUrl(null);
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
    return <Loading fullScreen />;
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
          title={isEditMode ? "Editar Evento" : "Novo Evento"}
          showBackButton={true}
        />

        <View className="flex-1">
          <KeyboardAwareScrollView
            resetScrollToCoords={{ x: 0, y: 0 }}
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingTop: 16,
              paddingBottom: 120, // Espaço para o botão fixo
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            enableOnAndroid={true}
            extraScrollHeight={120}
          >
            {/* Image Picker */}
            <View className="mb-6">
              <Text className="text-sm font-[Inter_700Bold] text-gray-700 mb-2 ml-1 uppercase tracking-wider">
                Capa do Evento
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

            <InputWithLabel
              label="Título do Evento"
              icon="pencil"
              placeholder="Ex: Mutirão de Limpeza..."
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

            <View className="mb-5">
              <Text className="text-sm font-[Inter_700Bold] text-gray-700 mb-2 ml-1 uppercase tracking-wider">
                Data do Evento
              </Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
                className="w-full bg-white border border-gray-100 shadow-sm rounded-2xl px-5 flex-row items-center h-16"
              >
                <FontAwesome name="calendar" size={20} color="#9CA3AF" />
                <Text className="text-lg text-gray-800 font-[Inter_600SemiBold] ml-3">
                  {formData.date.toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </Text>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={formData.date}
                mode="date"
                display="default"
                onChange={onChangeDate}
                minimumDate={new Date()} // Não permite datas passadas
              />
            )}

            <View className="mb-8">
              <Text className="text-sm font-[Inter_700Bold] text-gray-700 mb-2 ml-1 uppercase tracking-wider">
                Descrição Detalhada
              </Text>
              <TextInput
                placeholder="Descreva a programação e os detalhes do evento..."
                placeholderTextColor="#9CA3AF"
                value={formData.description}
                onChangeText={(text) => handleInputChange("description", text)}
                multiline
                numberOfLines={12}
                className="bg-white px-5 py-4 rounded-2xl text-base font-[Inter_400Regular] text-gray-700 h-80 align-top shadow-sm border border-gray-100 leading-relaxed"
                textAlignVertical="top"
              />
            </View>
          </KeyboardAwareScrollView>

          {/* Sticky Bottom Button */}
          <View className="absolute bottom-0 left-0 right-0 p-5 bg-gray-50/90 backdrop-blur-xl border-t border-gray-200/50">
            <Button
              title={isEditMode ? "Salvar Alterações" : "Criar Evento"}
              onPress={handleSaveEvent}
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