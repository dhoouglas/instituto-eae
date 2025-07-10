import React, { useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  Platform,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import Toast from "react-native-toast-message";

import { Header } from "@/components/Header";
import { FaunaFloraStackParamList } from "@/routes/types";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { TypeSelector } from "@/components/TypeSelector";
import { ConservationStatusSelector } from "@/components/ConservationStatusSelector";
import { ImagePickerComponent } from "@/components/ImagePicker";
import { faunaFloraSchema } from "@/utils/schemas/faunaFloraSchemas";
import api from "@/lib/api";
import { useAuth } from "@clerk/clerk-expo";
import { isAxiosError } from "axios";
import { useStorage } from "@/hooks/useStorage";
import * as ImagePicker from "expo-image-picker";

type FormData = z.infer<typeof faunaFloraSchema>;

type FaunaFloraFormRouteProp = RouteProp<
  FaunaFloraStackParamList,
  "editFaunaFlora"
>;

function FaunaSpecificFields({
  control,
  errors,
}: {
  control: any;
  errors: any;
}) {
  return (
    <>
      <View className="mb-4">
        <Text className="text-base font-bold text-gray-700 mb-2">Habitat</Text>
        <Controller
          control={control}
          name="habitat"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              placeholder="Ex: Floresta Amazônica"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
        {errors.habitat && (
          <Text className="text-red-500 text-sm mt-1">
            {errors.habitat.message}
          </Text>
        )}
      </View>

      <Controller
        control={control}
        name="conservationStatus"
        render={({ field: { onChange, value } }) => (
          <ConservationStatusSelector
            selectedValue={value}
            onSelectValue={onChange}
          />
        )}
      />
      {errors.conservationStatus && (
        <Text className="text-red-500 text-sm mb-2">
          {errors.conservationStatus.message}
        </Text>
      )}
    </>
  );
}

function FloraSpecificFields({
  control,
  errors,
}: {
  control: any;
  errors: any;
}) {
  return (
    <View className="mb-4">
      <Text className="text-base font-bold text-gray-700 mb-2">Família</Text>
      <Controller
        control={control}
        name="family"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            placeholder="Ex: Bromeliaceae"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
      />
      {errors.family && (
        <Text className="text-red-500 text-sm mt-1">
          {errors.family.message}
        </Text>
      )}
    </View>
  );
}

export function FaunaFloraFormScreen() {
  const navigation = useNavigation();
  const route = useRoute<FaunaFloraFormRouteProp>();
  const { getToken } = useAuth();
  const { uploadImage, isUploading } = useStorage();

  const { faunaFloraId, type } = route.params || {};
  const isEditing = !!faunaFloraId;

  const [imageAssets, setImageAssets] = useState<
    ImagePicker.ImagePickerAsset[]
  >([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(isEditing);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(faunaFloraSchema),
    defaultValues: {
      type: "FAUNA",
      name: "",
      scientificName: "",
      description: "",
      habitat: "",
      conservationStatus: "POUCO_PREOCUPANTE",
    },
  });

  const selectedType = useWatch({
    control,
    name: "type",
  });

  React.useEffect(() => {
    if (isEditing && faunaFloraId && type) {
      const fetchFaunaFloraDetails = async () => {
        try {
          const endpoint = type === "FAUNA" ? "/fauna" : "/flora";
          const response = await api.get(`${endpoint}/${faunaFloraId}`);
          const data = response.data;

          const { imageUrls, ...formData } = data;

          let defaultData: any = {
            type: type,
            name: formData.name || "",
            scientificName: formData.scientificName || "",
            description: formData.description || "",
          };

          if (type === "FAUNA") {
            defaultData = {
              ...defaultData,
              habitat: formData.habitat || "",
              conservationStatus:
                formData.conservationStatus || "POUCO_PREOCUPANTE",
              family: undefined,
            };
          } else {
            defaultData = {
              ...defaultData,
              family: formData.family || "",
              habitat: undefined,
              conservationStatus: undefined,
            };
          }

          reset(defaultData as FormData);
          setExistingImageUrls(imageUrls || []);
        } catch (error) {
          Toast.show({
            type: "error",
            text1: "Erro ao carregar dados",
            text2: "Não foi possível carregar os dados para edição.",
          });
        } finally {
          setIsLoading(false);
        }
      };
      fetchFaunaFloraDetails();
    }
  }, [isEditing, faunaFloraId, reset]);

  const onSubmit = async (data: FormData) => {
    if (imageAssets.length === 0 && existingImageUrls.length === 0) {
      Toast.show({
        type: "error",
        text1: "Selecione ao menos uma imagem.",
      });
      return;
    }

    try {
      const token = await getToken({ template: "api-testing-token" });
      const uploadedImageUrls: string[] = [];

      for (const asset of imageAssets) {
        const url = await uploadImage(asset);
        if (url) {
          uploadedImageUrls.push(url);
        } else {
          throw new Error("Falha no upload de uma ou mais imagens.");
        }
      }

      const payload = {
        ...data,
        imageUrls: [...existingImageUrls, ...uploadedImageUrls],
      };

      const { type, ...restOfPayload } = payload;
      let finalPayload: any = { type, ...restOfPayload };

      if (type === "FAUNA") {
        delete finalPayload.family;
      } else {
        delete finalPayload.habitat;
        finalPayload.conservationStatus = "Status de Conservação";
      }

      const originalType = route.params?.type;

      if (isEditing && originalType && originalType !== payload.type) {
        const deleteEndpoint = originalType === "FAUNA" ? "/fauna" : "/flora";
        await api.delete(`${deleteEndpoint}/${faunaFloraId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const createEndpoint = payload.type === "FAUNA" ? "/fauna" : "/flora";
        await api.post(createEndpoint, finalPayload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        const endpoint = payload.type === "FAUNA" ? "/fauna" : "/flora";
        const apiCall = isEditing
          ? api.put(`${endpoint}/${faunaFloraId}`, finalPayload, {
              headers: { Authorization: `Bearer ${token}` },
            })
          : api.post(endpoint, finalPayload, {
              headers: { Authorization: `Bearer ${token}` },
            });

        await apiCall;
      }

      Toast.show({
        type: "success",
        text1: "Sucesso!",
        text2: `Espécie ${isEditing ? "atualizada" : "salva"} com sucesso.`,
      });
      navigation.goBack();
    } catch (error) {
      let message = "Não foi possível salvar a espécie.";
      if (isAxiosError(error) && error.response?.data?.message) {
        message = error.response.data.message;
      }
      Toast.show({
        type: "error",
        text1: "Erro ao salvar",
        text2: message,
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View
          style={{
            paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
            flex: 1,
          }}
        >
          <Header title="Catalogar Espécie" showBackButton={true} />
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ padding: 24 }}
            showsVerticalScrollIndicator={false}
          >
            <View className="mb-6">
              <Text className="text-xl font-bold text-gray-800">
                Catalogar Nova Espécie
              </Text>
              <Text className="text-base text-gray-600 mt-1">
                Preencha os dados para adicionar um novo item ao nosso catálogo
                ambiental.
              </Text>
            </View>

            <View className="mb-4">
              <Text className="text-base font-bold text-gray-700 mb-2">
                Nome Popular
              </Text>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    placeholder="Ex: Onça-pintada"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {errors.name && (
                <Text className="text-red-500 text-sm mt-1">
                  {errors.name.message}
                </Text>
              )}
            </View>

            <View className="mb-4">
              <Text className="text-base font-bold text-gray-700 mb-2">
                Nome Científico
              </Text>
              <Controller
                control={control}
                name="scientificName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    placeholder="Ex: Panthera onca"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {errors.scientificName && (
                <Text className="text-red-500 text-sm mt-1">
                  {errors.scientificName.message}
                </Text>
              )}
            </View>

            <Controller
              control={control}
              name="type"
              render={({ field: { onChange, value } }) => (
                <TypeSelector selectedValue={value} onSelectValue={onChange} />
              )}
            />
            {errors.type && (
              <Text className="text-red-500 text-sm mb-2">
                {errors.type.message}
              </Text>
            )}

            {selectedType === "FAUNA" ? (
              <FaunaSpecificFields control={control} errors={errors} />
            ) : (
              <FloraSpecificFields control={control} errors={errors} />
            )}

            <View className="mb-4">
              <Text className="text-base font-bold text-gray-700 mb-2">
                Descrição
              </Text>
              <Controller
                control={control}
                name="description"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    placeholder="Fale sobre a espécie..."
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    multiline
                    numberOfLines={5}
                    textAlignVertical="top"
                    className="h-32"
                  />
                )}
              />
              {errors.description && (
                <Text className="text-red-500 text-sm mt-1">
                  {errors.description.message}
                </Text>
              )}
            </View>

            <ImagePickerComponent
              assets={imageAssets}
              onAssetsChange={setImageAssets}
              existingImageUrls={existingImageUrls}
              onExistingImageUrlsChange={setExistingImageUrls}
            />

            <View className="mt-8">
              <Button
                title={isEditing ? "Salvar Alterações" : "Salvar Espécie"}
                onPress={handleSubmit(onSubmit)}
                isLoading={isSubmitting || isLoading || isUploading}
                className="bg-green-logo py-4 rounded-xl items-center justify-center"
                textClassName="text-white text-lg font-bold"
                hasShadow
                shadowColor="#4b8c34"
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
