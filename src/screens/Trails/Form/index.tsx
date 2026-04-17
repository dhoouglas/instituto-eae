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
  Alert,
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
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

import { AppNavigatorRoutesProps } from "@/routes/types";
import api from "@/lib/api";
import { useStorage } from "@/hooks/useStorage";

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
    waypointsData: draftWaypointsData,
    distance: draftDistance,
    estimatedTime: draftEstimatedTime,
    elevationGain: draftElevationGain,
  } = (route.params as {
    trailId?: string;
    coordinates?: { latitude: number; longitude: number; order: number }[];
    waypointOrders?: number[];
    waypointsData?: Record<number, { name: string; description: string }>;
    distance?: number;
    estimatedTime?: number;
    elevationGain?: number;
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
          const prefill = draftWaypointsData?.[order];
          acc[order] = {
            ...EMPTY_WAYPOINT_DATA,
            name: prefill?.name || "",
            description: prefill?.description || ""
          };
          return acc;
        },
        {} as Record<number, WaypointFormData>
      );
      waypointsDataRef.current = initialWaypoints;
    }
  }, [draftWaypointOrders, draftWaypointsData]);

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
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      distance: draftDistance !== undefined ? draftDistance : undefined,
      estimatedTime: draftEstimatedTime !== undefined ? draftEstimatedTime : undefined,
      elevationGain: draftElevationGain !== undefined ? draftElevationGain : undefined,
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (imageAssets.length === 0 && existingImageUrls.length === 0) {
      Toast.show({
        type: "error",
        text1: "Selecione ao menos uma imagem para a trilha.",
      });
      return;
    }

    const waypointEntries = Object.entries(waypointsDataRef.current)
      .map(([order, data]) => {
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

      const uploadedTrailImageUrls: string[] = [];
      for (const asset of imageAssets) {
        const url = await uploadImage(asset);
        if (url) {
          uploadedTrailImageUrls.push(url);
        } else {
          throw new Error("Falha no upload da imagem da trilha.");
        }
      }

      const finalCoordinates = data.coordinates.map((coord, index) => ({
        latitude: coord.latitude,
        longitude: coord.longitude,
        order: index + 1,
      }));

      const waypointsPayload = await Promise.all(
        waypointOrders.map(async (order) => {
          const waypointData = waypointsDataRef.current[order];
          if (!waypointData) return null;

          let waypointImageUrl = waypointData.existingImageUrl || "";

          if (waypointData.image) {
            const url = await uploadImage(
              waypointData.image as ImagePicker.ImagePickerAsset
            );
            if (url) {
              waypointImageUrl = url;
            } else {
              console.warn(
                `Falha no upload da imagem para o waypoint #${order}`
              );
            }
          }

          return {
            id: waypointData.id,
            name: waypointData.name,
            description: waypointData.description || undefined,
            imageUrl: waypointImageUrl || undefined,
            order: order,
          };
        })
      ).then(results => results.filter(Boolean));

      const trailPayload = {
        ...data,
        imageUrls: [...existingImageUrls, ...uploadedTrailImageUrls],
        coordinates: finalCoordinates,
        waypoints: waypointsPayload,
      };

      const response = isEditing
        ? await api.put(`/trails/${trailId}`, trailPayload, {
          headers: { Authorization: `Bearer ${token}` },
        })
        : await api.post("/trails", trailPayload, {
          headers: { Authorization: `Bearer ${token}` },
        });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: "success",
        text1: "Sucesso!",
        text2: `Trilha ${isEditing ? "atualizada" : "criada"} com sucesso.`,
      });
      navigation.navigate("trails", { screen: "TrailList" });
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
    icon,
    children,
  }: {
    title: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <View className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 mb-6">
      <View className="flex-row items-center mb-4">
        {icon && <View className="w-8 h-8 rounded-full bg-green-50 items-center justify-center mr-3">{icon}</View>}
        <Text className="text-xl font-extrabold text-gray-900 tracking-tight">{title}</Text>
      </View>
      {children}
    </View>
  );

  const Label = ({ text }: { text: string }) => (
    <Text className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">
      {text}
    </Text>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]">
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
          {/* PREMIUM HEADER */}
          <View className="px-6 pt-6 pb-4 flex-row items-center justify-between bg-[#F9FAFB] z-10">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm border border-gray-200"
              activeOpacity={0.8}
            >
              <FontAwesome name="chevron-left" size={16} color="#374151" />
            </TouchableOpacity>
            <View className="flex-1 ml-4">
              <Text className="text-2xl font-black text-gray-900 tracking-tight">
                {isEditing ? "Editar Trilha" : "Nova Trilha"}
              </Text>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 8,
              paddingBottom: 150,
            }}
            showsVerticalScrollIndicator={false}
          >
            <FormSection
              title="Informações Básicas"
              icon={<FontAwesome name="pencil" size={14} color="#166534" />}
            >
              <View className="mb-4">
                <Label text="Nome da Trilha" />
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
                  <Text className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.name.message}</Text>
                )}
              </View>
              <View>
                <Label text="Descrição" />
                <Controller
                  control={control}
                  name="description"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      placeholder="Descreva os detalhes da aventura..."
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      multiline
                      numberOfLines={6}
                      textAlignVertical="top"
                      className="h-28 pt-3"
                    />
                  )}
                />
                {errors.description && (
                  <Text className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.description.message}</Text>
                )}
              </View>
            </FormSection>

            <FormSection
              title="Galeria"
              icon={<FontAwesome name="image" size={14} color="#166534" />}
            >
              <ImagePickerComponent
                assets={imageAssets}
                onAssetsChange={setImageAssets}
                existingImageUrls={existingImageUrls}
                onExistingImageUrlsChange={setExistingImageUrls}
              />
            </FormSection>

            <FormSection
              title="Traçado do Percurso"
              icon={<FontAwesome name="map" size={14} color="#166534" />}
            >
              <View className="rounded-2xl overflow-hidden border border-gray-200">
                <TrailMap
                  coordinates={trailPath}
                  waypoints={
                    waypointOrders
                      ?.map((order, index) => {
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
                          order: index + 1,
                          imageUrl: imageUrl,
                        };
                      })
                      .filter(Boolean) as any[]
                  }
                  isEditing={isAdmin}
                  interactionMode={mapInteractionMode}
                  onInteractionModeChange={(mode) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setMapInteractionMode(mode);
                  }}
                  onCoordinatesChange={(newCoords) =>
                    setValue("coordinates", newCoords, { shouldValidate: true })
                  }
                  onAddWaypoint={handleAddWaypoint}
                  onWaypointPress={(waypoint) => {
                    if (waypoint.imageUrl) {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setPreviewImageUrl(waypoint.imageUrl);
                      setPreviewModalVisible(true);
                    } else if (waypoint.description) {
                      Alert.alert(waypoint.name || `Ponto #${waypoint.order}`, waypoint.description);
                    }
                  }}
                  onUndo={handleUndo}
                />
              </View>
              {errors.coordinates && (
                <Text className="text-red-500 text-xs mt-2 ml-1 font-medium">{errors.coordinates.message}</Text>
              )}
            </FormSection>

            {waypointOrders && waypointOrders.length > 0 && (
              <FormSection
                title="Pontos de Interesse"
                icon={<FontAwesome name="map-marker" size={14} color="#166534" />}
              >
                <FlatList
                  data={waypointOrders}
                  keyExtractor={(item) => item.toString()}
                  renderItem={({ item: order, index }) => (
                    <View className="mb-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <WaypointForm
                        order={order}
                        displayOrder={index + 1}
                        initialData={
                          waypointsDataRef.current[order] || EMPTY_WAYPOINT_DATA
                        }
                        onDataChange={handleWaypointChange}
                      />
                    </View>
                  )}
                  scrollEnabled={false}
                />
              </FormSection>
            )}

            <FormSection
              title="Especificações Técnicas"
              icon={<FontAwesome name="list-alt" size={14} color="#166534" />}
            >
              <View className="flex-row gap-4 mb-4">
                <View className="flex-1">
                  <Label text="Distância (km)" />
                  <Controller
                    control={control}
                    name="distance"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        placeholder="Ex: 5.2"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value === undefined || value === null ? "" : String(value)}
                        keyboardType="numeric"
                      />
                    )}
                  />
                  {errors.distance && <Text className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.distance.message}</Text>}
                </View>
                <View className="flex-1">
                  <Label text="Tempo (min)" />
                  <Controller
                    control={control}
                    name="estimatedTime"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        placeholder="Ex: 120"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value === undefined || value === null ? "" : String(value)}
                        keyboardType="numeric"
                      />
                    )}
                  />
                  {errors.estimatedTime && <Text className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.estimatedTime.message}</Text>}
                </View>
              </View>

              <View className="mb-6">
                <Label text="Elevação (m)" />
                <Controller
                  control={control}
                  name="elevationGain"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      placeholder="Ex: 450"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value === undefined || value === null ? "" : String(value)}
                      keyboardType="numeric"
                    />
                  )}
                />
                {errors.elevationGain && <Text className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.elevationGain.message}</Text>}
              </View>

              <View className="mb-6">
                <Label text="Dificuldade" />
                <Controller
                  control={control}
                  name="difficulty"
                  render={({ field }) => (
                    <OptionSelector
                      selectedValue={field.value}
                      onSelect={(val) => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        field.onChange(val);
                      }}
                      options={[
                        { value: "FACIL", label: "Fácil", icon: "leaf" },
                        { value: "MEDIO", label: "Médio", icon: "fire" },
                        { value: "DIFICIL", label: "Difícil", icon: "lightning-bolt" },
                      ]}
                    />
                  )}
                />
                {errors.difficulty && <Text className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.difficulty.message}</Text>}
              </View>

              <View className="mb-6">
                <Label text="Tipo de Trilha" />
                <Controller
                  control={control}
                  name="type"
                  render={({ field }) => (
                    <OptionSelector
                      selectedValue={field.value}
                      onSelect={(val) => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        field.onChange(val);
                      }}
                      options={[
                        { value: "CAMINHADA", label: "Caminhada", icon: "walk" },
                        { value: "CICLISMO", label: "Ciclismo", icon: "bike" },
                        { value: "MISTA", label: "Mista", icon: "shuffle" },
                      ]}
                    />
                  )}
                />
                {errors.type && <Text className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.type.message}</Text>}
              </View>

              <View>
                <Label text="Status" />
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <OptionSelector
                      selectedValue={field.value}
                      onSelect={(val) => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        field.onChange(val);
                      }}
                      options={[
                        { value: "ABERTA", label: "Aberta", icon: "check-circle" },
                        { value: "FECHADA", label: "Fechada", icon: "close-circle" },
                        { value: "MANUTENCAO", label: "Manutenção", icon: "wrench" },
                      ]}
                    />
                  )}
                />
                {errors.status && <Text className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.status.message}</Text>}
              </View>
            </FormSection>
          </ScrollView>

          {/* THUMB ZONE SAVE BUTTON */}
          <View className="absolute bottom-6 left-6 right-6">
            <Button
              title={isEditing ? "Salvar Alterações" : "Criar Trilha"}
              onPress={handleSubmit(onSubmit)}
              isLoading={isSubmitting || isUploading || isLoading}
              className="w-full h-14 bg-green-700 rounded-full justify-center items-center shadow-lg"
              style={{ shadowColor: "#15803d", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 }}
              textClassName="text-white font-black text-lg tracking-wide"
            />
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* PREVIEW MODAL */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isPreviewModalVisible}
        onRequestClose={() => setPreviewModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/90">
          <TouchableOpacity
            className="absolute top-12 right-6 z-10 bg-white/20 w-10 h-10 rounded-full items-center justify-center"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setPreviewModalVisible(false);
            }}
          >
            <FontAwesome name="close" size={20} color="white" />
          </TouchableOpacity>
          <Image
            source={{ uri: previewImageUrl || "" }}
            className="w-full h-3/4"
            resizeMode="contain"
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}
