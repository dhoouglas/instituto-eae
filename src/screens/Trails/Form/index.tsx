import React, { useEffect, useRef, useState, useCallback, memo } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Platform,
  StatusBar,
  TouchableOpacity,
  KeyboardAvoidingView,
  FlatList,
  Modal,
  Image,
} from "react-native";
import { Feather, FontAwesome } from "@expo/vector-icons";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { useAuth, useUser } from "@clerk/clerk-expo";
import Toast from "react-native-toast-message";
import { isAxiosError } from "axios";

import { AppNavigatorRoutesProps } from "@/routes/types";
import api from "@/lib/api";
import { useStorage } from "@/hooks/useStorage";

import { Header } from "@/components/Header";
import { TrailMap } from "@/components/TrailMap";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { ImagePickerComponent } from "@/components/ImagePicker";
import { OptionSelector } from "@/components/OptionSelector";
import {
  WaypointForm,
  waypointSchema,
  WaypointFormData,
  EMPTY_WAYPOINT_DATA,
} from "@/components/WaypointForm";

const trailSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
  description: z
    .string()
    .min(10, "A descrição deve ter pelo menos 10 caracteres."),
  distance: z.coerce
    .number({ invalid_type_error: "A distância deve ser um número." })
    .positive("A distância deve ser um número positivo."),
  estimatedTime: z.coerce
    .number({ invalid_type_error: "A duração deve ser um número." })
    .positive("A duração deve ser um número positivo."),
  elevationGain: z.coerce
    .number({
      invalid_type_error: "A elevação deve ser um número.",
    })
    .positive("A elevação deve ser um número positivo."),
  difficulty: z.enum(["FACIL", "MEDIO", "DIFICIL"], {
    errorMap: () => ({ message: "Selecione a dificuldade." }),
  }),
  type: z.enum(["CAMINHADA", "CICLISMO", "MISTA"], {
    errorMap: () => ({ message: "Selecione o tipo de trilha." }),
  }),
  status: z.enum(["ABERTA", "FECHADA", "MANUTENCAO"], {
    errorMap: () => ({ message: "Selecione o status da trilha." }),
  }),
  coordinates: z
    .array(
      z.object({
        latitude: z.number(),
        longitude: z.number(),
        order: z.number().optional(),
      })
    )
    .min(1, "A trilha deve ter pelo menos 1 ponto."),
  waypoints: z.array(waypointSchema).optional(),
});

type TrailFormData = z.infer<typeof trailSchema>;
type Difficulty = "FACIL" | "MEDIO" | "DIFICIL";
type TrailType = "CAMINHADA" | "CICLISMO" | "MISTA";
type TrailStatus = "ABERTA" | "FECHADA" | "MANUTENCAO";

export function TrailForm() {
  const route = useRoute();
  const navigation = useNavigation<AppNavigatorRoutesProps>();
  const waypointsDataRef = useRef<Record<number, WaypointFormData>>({});
  const { getToken } = useAuth();
  const { user } = useUser();
  const { uploadImage, isUploading } = useStorage();

  const isAdmin = (user?.publicMetadata as any)?.role === "admin";

  const {
    trailId,
    coordinates: draftPath,
    waypointOrders: draftWaypointOrders,
  } = (route.params as {
    trailId?: string;
    coordinates?: { latitude: number; longitude: number; order: number }[];
    waypointOrders?: number[];
  }) || {};
  const isEditing = !!trailId;

  const [imageAssets, setImageAssets] = useState<
    ImagePicker.ImagePickerAsset[]
  >([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [waypointOrders, setWaypointOrders] = useState<number[]>(
    draftWaypointOrders || []
  );
  const [isPreviewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [mapInteractionMode, setMapInteractionMode] = useState<
    "drawTrail" | "addWaypoint"
  >("drawTrail");

  useEffect(() => {
    if (
      draftWaypointOrders &&
      Object.keys(waypointsDataRef.current).length === 0
    ) {
      const initialWaypoints = draftWaypointOrders.reduce(
        (acc, order) => {
          acc[order] = { ...EMPTY_WAYPOINT_DATA };
          return acc;
        },
        {} as Record<number, WaypointFormData>
      );
      waypointsDataRef.current = initialWaypoints;
    }
  }, [draftWaypointOrders]);

  const handleWaypointChange = useCallback(
    (order: number, data: WaypointFormData) => {
      waypointsDataRef.current[order] = data;
    },
    []
  );

  const handleAddWaypoint = (coordinate: {
    latitude: number;
    longitude: number;
  }) => {
    const newCoordinates = [...trailPath, coordinate];
    const newWaypointOrder = newCoordinates.length;

    if (waypointOrders.includes(newWaypointOrder)) {
      Toast.show({
        type: "error",
        text1: "Ponto de Interesse já existe neste local.",
      });
      return;
    }

    setValue("coordinates", newCoordinates, { shouldValidate: true });

    waypointsDataRef.current[newWaypointOrder] = { ...EMPTY_WAYPOINT_DATA };
    setWaypointOrders((prev) => [...prev, newWaypointOrder]);

    setMapInteractionMode("drawTrail");

    Toast.show({
      type: "info",
      text1: `Ponto de Interesse #${newWaypointOrder} adicionado.`,
      text2: "Preencha os detalhes abaixo.",
    });
  };

  const handleUndo = () => {
    if (trailPath.length === 0) return;

    const lastPointOrder = trailPath.length;

    if (waypointOrders.includes(lastPointOrder)) {
      setWaypointOrders((prev) => prev.filter((o) => o !== lastPointOrder));
      delete waypointsDataRef.current[lastPointOrder];
    }

    const newCoordinates = trailPath.slice(0, -1);
    setValue("coordinates", newCoordinates, { shouldValidate: true });
  };

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TrailFormData>({
    resolver: zodResolver(trailSchema),
    defaultValues: {
      name: "",
      description: "",
      distance: undefined,
      estimatedTime: undefined,
      elevationGain: undefined,
      difficulty: "FACIL",
      type: "CAMINHADA",
      status: "ABERTA",
      coordinates: draftPath || [],
    },
  });

  const trailPath = watch("coordinates");

  useEffect(() => {
    if (isEditing) {
      const fetchTrailDetails = async () => {
        try {
          const response = await api.get(`/trails/${trailId}`);
          const { imageUrls, waypoints, ...trailData } = response.data;

          reset(trailData);

          if (imageUrls) {
            setExistingImageUrls(imageUrls);
          }

          if (waypoints && waypoints.length > 0) {
            const loadedWaypointOrders = waypoints.map(
              (wp: any) => wp.coordinate.order
            );
            setWaypointOrders(loadedWaypointOrders);

            const waypointsData = waypoints.reduce((acc: any, wp: any) => {
              acc[wp.coordinate.order] = {
                id: wp.id,
                name: wp.name,
                description: wp.description,
                existingImageUrl: wp.imageUrl,
              };
              return acc;
            }, {});
            waypointsDataRef.current = waypointsData;
          }
        } catch (error) {
          Toast.show({
            type: "error",
            text1: "Erro ao carregar dados",
            text2: "Não foi possível carregar os dados da trilha.",
          });
        } finally {
          setIsLoading(false);
        }
      };
      fetchTrailDetails();
    }
  }, [isEditing, trailId, reset]);

  const onSubmit = async (data: TrailFormData) => {
    // 1. Validação
    if (imageAssets.length === 0 && existingImageUrls.length === 0) {
      Toast.show({
        type: "error",
        text1: "Selecione ao menos uma imagem para a trilha.",
      });
      return;
    }

    const waypointEntries = Object.entries(waypointsDataRef.current)
      .map(([order, data]) => {
        // Ignore waypoints that are completely empty
        if (!data.name && !data.description && !data.image) {
          return null;
        }
        return [order, data];
      })
      .filter(Boolean) as [string, WaypointFormData][];

    for (const [order, waypoint] of waypointEntries) {
      const validation = waypointSchema.safeParse(waypoint);
      if (!validation.success) {
        Toast.show({
          type: "error",
          text1: `Erro no Ponto de Interesse #${order}`,
          text2: validation.error.errors[0].message,
        });
        return;
      }
    }

    try {
      const token = await getToken({ template: "api-testing-token" });

      // 2. Upload de imagens da trilha
      const uploadedTrailImageUrls: string[] = [];
      for (const asset of imageAssets) {
        const url = await uploadImage(asset);
        if (url) {
          uploadedTrailImageUrls.push(url);
        } else {
          throw new Error("Falha no upload da imagem da trilha.");
        }
      }

      // 3. Filtrar coordenadas para manter apenas as que são waypoints
      const finalCoordinates = waypointOrders
        .map((order) => {
          const coord = data.coordinates[order - 1];
          return coord ? { ...coord, originalOrder: order } : null;
        })
        .filter(Boolean) as {
        latitude: number;
        longitude: number;
        originalOrder: number;
      }[];

      // 4. Preparar payload dos Waypoints com base nas coordenadas filtradas
      const waypointsPayload = await Promise.all(
        finalCoordinates.map(async (coord, index) => {
          const waypointData = waypointsDataRef.current[coord.originalOrder];
          let waypointImageUrl = waypointData.existingImageUrl || "";

          if (waypointData.image) {
            const url = await uploadImage(
              waypointData.image as ImagePicker.ImagePickerAsset
            );
            if (url) {
              waypointImageUrl = url;
            } else {
              console.warn(
                `Falha no upload da imagem para o waypoint #${index + 1}`
              );
            }
          }

          return {
            id: waypointData.id,
            name: waypointData.name,
            description: waypointData.description,
            imageUrl: waypointImageUrl,
            order: index + 1, // Nova ordem sequencial
          };
        })
      );

      // 5. Criar/Atualizar a trilha com os dados corretos
      const trailPayload = {
        ...data,
        imageUrls: [...existingImageUrls, ...uploadedTrailImageUrls],
        coordinates: finalCoordinates.map((coord, index) => ({
          latitude: coord.latitude,
          longitude: coord.longitude,
          order: index + 1,
        })),
        waypoints: waypointsPayload,
      };

      console.log(
        "Enviando para a API:",
        JSON.stringify(trailPayload, null, 2)
      );

      const response = isEditing
        ? await api.put(`/trails/${trailId}`, trailPayload, {
            headers: { Authorization: `Bearer ${token}` },
          })
        : await api.post("/trails", trailPayload, {
            headers: { Authorization: `Bearer ${token}` },
          });

      Toast.show({
        type: "success",
        text1: "Sucesso!",
        text2: `Trilha ${isEditing ? "atualizada" : "criada"} com sucesso.`,
      });
      navigation.navigate("trails", { screen: "TrailList" });
    } catch (error) {
      let message = "Não foi possível salvar a trilha.";
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

  const FormSection = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <View className="bg-white p-4 rounded-xl shadow-sm mb-6">
      <Text className="text-lg font-bold text-gray-800 mb-3">{title}</Text>
      {children}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={
          Platform.OS === "ios" ? 0 : -(StatusBar.currentHeight || 0)
        }
      >
        <View
          style={{
            paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
            flex: 1,
          }}
        >
          <Header
            title={isEditing ? "Editar Trilha" : "Nova Trilha"}
            showBackButton={true}
          />
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 16,
              paddingBottom: 100,
            }}
            showsVerticalScrollIndicator={false}
          >
            <FormSection title="Informações Básicas">
              <View>
                <Text className="text-base font-semibold text-gray-700 mb-1">
                  Nome da Trilha
                </Text>
                <Controller
                  control={control}
                  name="name"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      placeholder="Ex: Trilha do Sol"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />
                {errors.name && (
                  <Text className="text-red-500 mt-1">
                    {errors.name.message}
                  </Text>
                )}
              </View>
              <View className="h-4" />
              <View>
                <Text className="text-base font-semibold text-gray-700 mb-1">
                  Descrição
                </Text>
                <Controller
                  control={control}
                  name="description"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      placeholder="Descreva os detalhes da trilha..."
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      multiline
                      numberOfLines={8}
                      textAlignVertical="top"
                      className="h-32"
                    />
                  )}
                />
                {errors.description && (
                  <Text className="text-red-500 mt-1">
                    {errors.description.message}
                  </Text>
                )}
              </View>
            </FormSection>

            <FormSection title="Imagens da Trilha">
              <ImagePickerComponent
                assets={imageAssets}
                onAssetsChange={setImageAssets}
                existingImageUrls={existingImageUrls}
                onExistingImageUrlsChange={setExistingImageUrls}
              />
            </FormSection>

            <FormSection title="Traçado da Trilha">
              <TrailMap
                coordinates={trailPath}
                waypoints={
                  waypointOrders
                    ?.map((order) => {
                      const waypointData = waypointsDataRef.current[order];
                      const coordinate = trailPath[order - 1];

                      if (!waypointData || !coordinate) return null;

                      let imageUrl = waypointData.existingImageUrl;
                      if (waypointData.image) {
                        imageUrl = (waypointData.image as any).uri;
                      }

                      return {
                        id: waypointData.id || String(order),
                        name: waypointData.name,
                        description: waypointData.description,
                        latitude: coordinate.latitude,
                        longitude: coordinate.longitude,
                        order: order,
                        imageUrl: imageUrl,
                      };
                    })
                    .filter(Boolean) as any[]
                }
                isEditing={isAdmin}
                interactionMode={mapInteractionMode}
                onInteractionModeChange={setMapInteractionMode}
                onCoordinatesChange={(newCoords) =>
                  setValue("coordinates", newCoords, { shouldValidate: true })
                }
                onAddWaypoint={handleAddWaypoint}
                onWaypointPress={(waypoint) => {
                  if (waypoint.imageUrl) {
                    setPreviewImageUrl(waypoint.imageUrl);
                    setPreviewModalVisible(true);
                  }
                }}
                onUndo={handleUndo}
              />
              {errors.coordinates && (
                <Text className="text-red-500 mt-1">
                  {errors.coordinates.message}
                </Text>
              )}
            </FormSection>

            {waypointOrders && waypointOrders.length > 0 && (
              <FormSection title="Pontos de Interesse">
                <FlatList
                  data={waypointOrders}
                  keyExtractor={(item) => item.toString()}
                  renderItem={({ item: order, index }) => (
                    <WaypointForm
                      order={order}
                      displayOrder={index + 1}
                      initialData={
                        waypointsDataRef.current[order] || EMPTY_WAYPOINT_DATA
                      }
                      onDataChange={handleWaypointChange}
                    />
                  )}
                  // Opcional: para evitar que a FlatList tenha seu próprio scroll
                  // se a ScrollView principal já cuida disso.
                  scrollEnabled={false}
                />
              </FormSection>
            )}

            <FormSection title="Detalhes da Trilha">
              <View>
                <Text className="text-base font-semibold text-gray-700 mb-1">
                  Distância (km)
                </Text>
                <Controller
                  control={control}
                  name="distance"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      placeholder="Ex: 5.2"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={
                        value === undefined || value === null
                          ? ""
                          : String(value)
                      }
                      keyboardType="numeric"
                    />
                  )}
                />
                {errors.distance && (
                  <Text className="text-red-500 mt-1">
                    {errors.distance.message}
                  </Text>
                )}
              </View>
              <View className="h-4" />
              <View>
                <Text className="text-base font-semibold text-gray-700 mb-1">
                  Duração Estimada (minutos)
                </Text>
                <Controller
                  control={control}
                  name="estimatedTime"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      placeholder="Ex: 120"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={
                        value === undefined || value === null
                          ? ""
                          : String(value)
                      }
                      keyboardType="numeric"
                    />
                  )}
                />
                {errors.estimatedTime && (
                  <Text className="text-red-500 mt-1">
                    {errors.estimatedTime.message}
                  </Text>
                )}
              </View>
              <View className="h-4" />
              <View>
                <Text className="text-base font-semibold text-gray-700 mb-1">
                  Ganho de Elevação (metros)
                </Text>
                <Controller
                  control={control}
                  name="elevationGain"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      placeholder="Ex: 450"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={
                        value === undefined || value === null
                          ? ""
                          : String(value)
                      }
                      keyboardType="numeric"
                    />
                  )}
                />
                {errors.elevationGain && (
                  <Text className="text-red-500 mt-1">
                    {errors.elevationGain.message}
                  </Text>
                )}
              </View>
              <View className="h-4" />
              <Text className="text-base font-semibold text-gray-700 mb-1">
                Dificuldade
              </Text>
              <Controller
                control={control}
                name="difficulty"
                render={({ field }) => (
                  <OptionSelector
                    selectedValue={field.value}
                    onSelect={field.onChange}
                    options={[
                      {
                        value: "FACIL",
                        label: "Fácil",
                        icon: "sentiment-very-satisfied",
                      },
                      {
                        value: "MEDIO",
                        label: "Médio",
                        icon: "sentiment-neutral",
                      },
                      {
                        value: "DIFICIL",
                        label: "Difícil",
                        icon: "sentiment-very-dissatisfied",
                      },
                    ]}
                  />
                )}
              />
              {errors.difficulty && (
                <Text className="text-red-500 mt-1">
                  {errors.difficulty.message}
                </Text>
              )}
              <View className="h-4" />
              <Text className="text-base font-semibold text-gray-700 mb-1">
                Tipo de Trilha
              </Text>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <OptionSelector
                    selectedValue={field.value}
                    onSelect={field.onChange}
                    options={[
                      { value: "CAMINHADA", label: "Caminhada" },
                      { value: "CICLISMO", label: "Ciclismo" },
                      { value: "MISTA", label: "Mista" },
                    ]}
                  />
                )}
              />
              {errors.type && (
                <Text className="text-red-500 mt-1">{errors.type.message}</Text>
              )}
              <View className="h-4" />
              <Text className="text-base font-semibold text-gray-700 mb-1 ">
                Status da Trilha
              </Text>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <OptionSelector
                    selectedValue={field.value}
                    onSelect={field.onChange}
                    options={[
                      { value: "ABERTA", label: "Aberta" },
                      { value: "FECHADA", label: "Fechada" },
                      { value: "MANUTENCAO", label: "Manutenção" },
                    ]}
                  />
                )}
              />
              {errors.status && (
                <Text className="text-red-500 mt-1">
                  {errors.status.message}
                </Text>
              )}
            </FormSection>
          </ScrollView>

          <View className="absolute bottom-0 left-0 right-0 p-4 bg-gray-100 border-t border-gray-200">
            <Button
              title={isEditing ? "Salvar Alterações" : "Criar Trilha"}
              onPress={handleSubmit(onSubmit)}
              isLoading={isSubmitting || isUploading || isLoading}
              className="w-full h-14 bg-green-800 rounded-xl justify-center items-center"
              textClassName="text-white font-bold text-lg"
            />
          </View>
        </View>
      </KeyboardAvoidingView>
      <Modal
        animationType="slide"
        transparent={true}
        visible={isPreviewModalVisible}
        onRequestClose={() => setPreviewModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/80">
          <TouchableOpacity
            className="absolute top-10 right-6 z-10"
            onPress={() => setPreviewModalVisible(false)}
          >
            <FontAwesome name="close" size={30} color="white" />
          </TouchableOpacity>
          <Image
            source={{ uri: previewImageUrl || "" }}
            className="w-11/12 h-3/4"
            resizeMode="contain"
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}
