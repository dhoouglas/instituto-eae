import React, { useState } from "react";
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
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { FontAwesome } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { createEventSchema } from "@/utils/schemas/eventSchemas";
import { useAuth } from "@clerk/clerk-expo";
import api from "@/lib/api";

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

export function CreateEventScreen() {
  const { getToken } = useAuth();
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

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
      // verificar depois mediaTypes: [ImagePicker.MediaType.IMAGE] ,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!pickerResult.canceled) {
      setImage(pickerResult.assets[0]);
    }
  };

  const onChangeDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  async function handleCreateEvent() {
    setIsLoading(true);

    if (!image) {
      Toast.show({
        type: "error",
        text1: "Imagem Obrigatória",
        text2: "Por favor, selecione uma imagem de capa para o evento.",
      });
      setIsLoading(false);
      return;
    }

    const validation = createEventSchema.safeParse({
      title,
      date: date.toISOString(),
      location,
      description,
    });

    if (!validation.success) {
      Toast.show({
        type: "error",
        text1: "Dados Inválidos",
        text2: validation.error.errors[0].message,
      });
      setIsLoading(false);
      return;
    }

    try {
      const token = await getToken({ template: "api-testing-token" });
      if (!token) {
        throw new Error("Não foi possível obter o token de autenticação.");
      }

      // --- PASSO 3: UPLOAD DA IMAGEM (LÓGICA FUTURA) ---
      // TODO: Aqui entrará a lógica para fazer o upload do arquivo 'image.uri'
      // para o Supabase Storage. Esta lógica retornará a URL pública da imagem.
      // Exemplo: const imageUrl = await uploadParaSupabase(image.uri);

      // Por enquanto, estou usando uma URL de placeholder para simular o sucesso.
      const imageUrl = `https://picsum.photos/seed/${Date.now()}/400/300`;

      await api.post(
        "/events",
        {
          ...validation.data,
          imageUrl: imageUrl,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Toast.show({
        type: "success",
        text1: "Sucesso!",
        text2: "O evento foi criado e publicado.",
      });

      navigation.goBack();
    } catch (error) {
      console.error("Erro completo ao criar evento:", error);
      Toast.show({
        type: "error",
        text1: "Erro ao Criar Evento",
        text2: "Não foi possível salvar o evento. Tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View
        style={{
          paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
          flex: 1,
        }}
      >
        <View className="px-6 pt-6 pb-4">
          <Text className="text-3xl font-bold text-gray-800 font-[Inter_700Bold]">
            Criar Novo Evento
          </Text>
          <Text className="text-base text-gray-500 mt-1">
            Preencha os detalhes para divulgar uma nova ação ou evento.
          </Text>
        </View>

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

            <InputWithLabel
              label="Título do Evento"
              icon="pencil"
              placeholder="Ex: Mutirão de Limpeza"
              value={title}
              onChangeText={setTitle}
            />
            <InputWithLabel
              label="Localização"
              icon="map-marker"
              placeholder="Ex: Parque Ibirapuera, SP"
              value={location}
              onChangeText={setLocation}
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
                {date.toLocaleDateString("pt-BR", { dateStyle: "long" })}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={onChangeDate}
              />
            )}

            <Text className="text-base font-bold text-gray-700 mb-2">
              Descrição Detalhada
            </Text>
            <TextInput
              placeholder="Descreva os detalhes do evento..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={6}
              className="w-full border border-gray-300 rounded-xl p-4 text-base h-36 bg-gray-100 align-top"
              textAlignVertical="top"
            />

            <View className="mt-8 mb-4">
              <Button
                title="Salvar Evento"
                onPress={handleCreateEvent}
                isLoading={isLoading}
                className="bg-green-logo py-4 rounded-xl items-center justify-center"
                textClassName="text-white text-lg font-bold"
                hasShadow
                shadowColor="#2A9D8F"
              />
            </View>
          </View>
        </KeyboardAwareScrollView>
      </View>
    </SafeAreaView>
  );
}
