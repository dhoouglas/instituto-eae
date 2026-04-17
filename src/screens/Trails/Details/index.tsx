import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Platform,
  StatusBar,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Dimensions,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { FontAwesome } from "@expo/vector-icons";
import { TrailMap } from "@/components/TrailMap";
import api from "@/lib/api";
import { AppNavigatorRoutesProps, TrailStackParamList } from "@/routes/types";
import { useAuth } from "@clerk/clerk-expo";
import { formatTime } from "@/utils/formatters";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");

interface ApiWaypoint {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  order: number;
  coordinate: {
    latitude: number;
    longitude: number;
  };
}

interface Trail {
  id: string;
  name: string;
  description: string;
  distance: number;
  difficulty: string;
  estimatedTime: number;
  elevationGain: number;
  status: string;
  type: string;
  imageUrls: string[];
  coordinates: { latitude: number; longitude: number }[];
  waypoints: ApiWaypoint[];
}

const InfoCard = ({ icon, label, value, color = "#166534" }: any) => (
  <View className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex-row items-center m-1">
    <View
      className="w-10 h-10 rounded-full items-center justify-center mr-3"
      style={{ backgroundColor: `${color}15` }}
    >
      <FontAwesome name={icon} size={18} color={color} />
    </View>
    <View className="flex-1">
      <Text className="text-gray-500 text-[11px] font-semibold uppercase tracking-wider mb-0.5">
        {label}
      </Text>
      <Text className="text-gray-900 font-black text-sm tracking-tight">
        {value}
      </Text>
    </View>
  </View>
);

export function TrailDetails() {
  const route = useRoute<RouteProp<TrailStackParamList, "TrailDetails">>();
  const navigation = useNavigation<AppNavigatorRoutesProps>();
  const { getToken } = useAuth();
  const { trailId } = route.params;
  const [trail, setTrail] = useState<Trail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const openImageModal = (imageUrl: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedImage(imageUrl);
    setModalVisible(true);
  };

  const closeImageModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedImage(null);
    setModalVisible(false);
  };

  useEffect(() => {
    const fetchTrailDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await getToken({ template: "api-testing-token" });
        const response = await api.get(`/trails/${trailId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setTrail(response.data);
      } catch (err) {
        setError("Não foi possível carregar os detalhes da trilha.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (trailId) {
      fetchTrailDetails();
    }
  }, [trailId]);

  const initialRegion =
    trail?.coordinates && trail.coordinates.length > 0
      ? {
          latitude: trail.coordinates[0].latitude,
          longitude: trail.coordinates[0].longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }
      : null;

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#F9FAFB]">
        <ActivityIndicator size="large" color="#166534" />
      </View>
    );
  }

  if (error || !trail) {
    return (
      <SafeAreaView className="flex-1 bg-[#F9FAFB] justify-center items-center p-6">
        <Text className="text-red-500 text-center text-lg font-medium">
          {error || "Trilha não encontrada."}
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="mt-4 bg-gray-200 px-6 py-3 rounded-full"
        >
          <Text className="text-gray-800 font-bold">Voltar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* HERO IMAGE SECTION */}
        <View className="relative w-full h-[380px]">
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            className="w-full h-full"
          >
            {trail.imageUrls?.length > 0 ? (
              trail.imageUrls.map((url, index) => (
                <Image
                  key={index}
                  source={{ uri: url }}
                  className="w-screen h-full bg-gray-300"
                  resizeMode="cover"
                />
              ))
            ) : (
              <View className="w-screen h-full bg-green-900 justify-center items-center">
                <FontAwesome name="image" size={50} color="rgba(255,255,255,0.3)" />
              </View>
            )}
          </ScrollView>

          <LinearGradient
            colors={["rgba(0,0,0,0.6)", "transparent", "rgba(0,0,0,0.8)"]}
            style={{ position: "absolute", width: "100%", height: "100%" }}
            pointerEvents="none"
          />

          <View 
            className="absolute w-full flex-row justify-between px-4"
            style={{ top: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 16 : 48 }}
          >
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="w-10 h-10 rounded-full bg-black/40 items-center justify-center backdrop-blur-md"
            >
              <FontAwesome name="chevron-left" size={16} color="white" />
            </TouchableOpacity>
          </View>

          <View className="absolute bottom-6 left-6 right-6">
            <View className="bg-white/20 self-start px-3 py-1 rounded-full backdrop-blur-md mb-2 border border-white/30">
              <Text className="text-white text-xs font-bold uppercase tracking-wider">
                {trail.type.toLowerCase()}
              </Text>
            </View>
            <Text className="text-3xl font-black text-white leading-tight text-shadow-md">
              {trail.name}
            </Text>
          </View>
        </View>

        {/* OVERLAPPING CONTENT SURFACE */}
        <View className="bg-[#F9FAFB] rounded-t-3xl -mt-6 pt-6 px-4">
          <Text className="text-gray-600 text-base leading-relaxed px-2 mb-6">
            {trail.description}
          </Text>

          {/* 2x2 STATS GRID */}
          <View className="flex-row px-1">
            <InfoCard
              icon="map-signs"
              label="Distância"
              value={`${trail.distance} km`}
              color="#0ea5e9"
            />
            <InfoCard
              icon="clock-o"
              label="Duração"
              value={formatTime(trail.estimatedTime)}
              color="#f59e0b"
            />
          </View>
          <View className="flex-row px-1 mt-1 mb-6">
            <InfoCard
              icon="line-chart"
              label="Dificuldade"
              value={trail.difficulty.toLowerCase()}
              color={
                trail.difficulty === "FACIL"
                  ? "#16a34a"
                  : trail.difficulty === "MEDIO"
                  ? "#d97706"
                  : "#dc2626"
              }
            />
            <InfoCard
              icon="area-chart"
              label="Elevação"
              value={`${trail.elevationGain} m`}
              color="#8b5cf6"
            />
          </View>

          {/* MAP */}
          {initialRegion && (
            <View className="mb-8 px-2">
              <Text className="text-xl font-extrabold text-gray-900 mb-4 tracking-tight">
                Mapa do Percurso
              </Text>
              <View className="rounded-3xl overflow-hidden border border-gray-200 shadow-sm">
                <TrailMap
                  coordinates={trail.coordinates}
                  waypoints={trail.waypoints.map((wp, index) => ({
                    id: wp.id,
                    name: wp.name,
                    description: wp.description,
                    latitude: wp.coordinate.latitude,
                    longitude: wp.coordinate.longitude,
                    imageUrl: wp.imageUrl,
                    order: wp.order || index + 1,
                  }))}
                  onWaypointPress={(waypoint) => {
                    if (waypoint.imageUrl) {
                      openImageModal(waypoint.imageUrl);
                    }
                  }}
                />
              </View>
            </View>
          )}

          {/* WAYPOINTS TIMELINE */}
          {trail.waypoints?.length > 0 && (
            <View className="px-2 mb-6">
              <Text className="text-xl font-extrabold text-gray-900 mb-6 tracking-tight">
                Pontos de Interesse
              </Text>
              <View className="pl-4">
                {trail.waypoints.map((waypoint, index) => (
                  <View key={waypoint.id} className="relative pl-8 pb-8">
                    {/* Timeline Line */}
                    {index !== trail.waypoints.length - 1 && (
                      <View className="absolute left-[11px] top-8 bottom-0 w-0.5 bg-green-200" />
                    )}
                    {/* Timeline Dot */}
                    <View className="absolute left-0 top-1 w-6 h-6 rounded-full bg-green-100 border-2 border-green-600 items-center justify-center">
                      <Text className="text-green-800 text-[10px] font-bold">
                        {index + 1}
                      </Text>
                    </View>

                    <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                      <Text className="text-lg font-black text-gray-900 mb-1">
                        {waypoint.name}
                      </Text>
                      <Text className="text-gray-500 text-sm leading-relaxed">
                        {waypoint.description}
                      </Text>
                      {waypoint.imageUrl && (
                        <TouchableOpacity
                          onPress={() => openImageModal(waypoint.imageUrl!)}
                          className="mt-3"
                          activeOpacity={0.9}
                        >
                          <Image
                            source={{ uri: waypoint.imageUrl }}
                            className="w-full h-36 rounded-xl bg-gray-200"
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* FLOATING ACTION BUTTON BAR (THUMB ZONE) */}
      <LinearGradient
        colors={["transparent", "rgba(249, 250, 251, 0.9)", "#F9FAFB"]}
        className="absolute bottom-0 left-0 right-0 pt-10 pb-6 px-6"
      >
        <TouchableOpacity
          className="bg-green-700 py-4 rounded-full items-center justify-center shadow-lg flex-row"
          style={{ shadowColor: "#15803d", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 }}
          activeOpacity={0.9}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            (navigation as any).navigate("FollowTrail", { trailId: trail.id });
          }}
        >
          <FontAwesome name="play" size={18} color="white" className="mr-3" />
          <Text className="text-white font-black text-lg tracking-wide ml-2">
            SEGUIR TRILHA
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* IMAGE MODAL */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeImageModal}
      >
        <View className="flex-1 justify-center items-center bg-black/90">
          <TouchableOpacity
            className="absolute top-12 right-6 z-10 bg-white/20 w-10 h-10 rounded-full items-center justify-center"
            onPress={closeImageModal}
          >
            <FontAwesome name="close" size={20} color="white" />
          </TouchableOpacity>
          <Image
            source={{ uri: selectedImage || "" }}
            className="w-full h-3/4"
            resizeMode="contain"
          />
        </View>
      </Modal>
    </View>
  );
}