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
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { FontAwesome } from "@expo/vector-icons";
import { Header } from "@/components/Header";
import { TrailMap } from "@/components/TrailMap";
import api from "@/lib/api";
import { AppNavigatorRoutesProps, TrailStackParamList } from "@/routes/types";
import { useAuth } from "@clerk/clerk-expo";
import { formatTime } from "@/utils/formatters";

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

// Mock data for a single trail
const mockTrailDetails: Trail = {
  id: "c0921fb3-6677-46df-9ea1-ab6633456f55",
  name: "Trilha da Cachoeira Escondida",
  description:
    "Uma trilha de nível médio que serpenteia pela floresta densa, culminando em uma cachoeira deslumbrante, perfeita para um mergulho refrescante. O percurso é bem sinalizado e oferece vistas espetaculares da fauna e flora locais.",
  distance: 7.2,
  difficulty: "MEDIO",
  estimatedTime: 180, // in minutes
  elevationGain: 450, // in meters
  status: "ATIVO",
  type: "CAMINHADA",
  imageUrls: ["https://i.ibb.co/dGA1hXJ/placeholder-image.png"],
  coordinates: [
    { latitude: -23.563, longitude: -46.655 },
    { latitude: -23.56, longitude: -46.658 },
    { latitude: -23.565, longitude: -46.669 },
    { latitude: -23.561, longitude: -46.652 },
  ],
  waypoints: [
    {
      id: "73082405-cba4-45bd-b1fa-64c65e63d615",
      name: "Mirante Principal",
      description: "Vista panorâmica do vale.",
      order: 1,
      coordinate: {
        latitude: -23.563,
        longitude: -46.655,
      },
      imageUrl: "https://i.ibb.co/dGA1hXJ/placeholder-image.png",
    },
  ],
};

const InfoCard = ({ icon, label, value }: any) => (
  <View className="flex-row items-center">
    <FontAwesome name={icon} size={20} color="#166534" />
    <View className="ml-3">
      <Text className="text-gray-500 text-xs">{label}</Text>
      <Text className="text-gray-800 font-bold text-sm">{value}</Text>
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
    setSelectedImage(imageUrl);
    setModalVisible(true);
  };

  const closeImageModal = () => {
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
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#166534" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 p-6">
        <Text className="text-red-500 text-center text-lg">{error}</Text>
      </View>
    );
  }

  if (!trail) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-gray-600 text-lg">Trilha não encontrada.</Text>
      </View>
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
        <Header title={trail.name} showBackButton={true} />
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            className="h-56"
          >
            {trail.imageUrls?.map((url, index) => (
              <Image
                key={index}
                source={{ uri: url }}
                className="w-screen h-56 bg-gray-200"
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          <View className="p-6">
            <View className="flex-row gap-3 mb-6">
              <View className="flex-1 bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <InfoCard
                  icon="map-signs"
                  label="Distância"
                  value={`${trail.distance} km`}
                />
                <View className="border-t border-gray-100 my-3" />
                <InfoCard
                  icon="line-chart"
                  label="Dificuldade"
                  value={trail.difficulty}
                />
                <View className="border-t border-gray-100 my-3" />
                <InfoCard
                  icon="check-circle"
                  label="Status"
                  value={trail.status}
                />
              </View>
              <View className="flex-1 bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <InfoCard
                  icon="clock-o"
                  label="Tempo Est."
                  value={formatTime(trail.estimatedTime)}
                />
                <View className="border-t border-gray-100 my-3" />
                <InfoCard
                  icon="area-chart"
                  label="Elevação"
                  value={`${trail.elevationGain} m`}
                />
                <View className="border-t border-gray-100 my-3" />
                <InfoCard icon="tree" label="Tipo" value={trail.type} />
              </View>
            </View>

            <Text className="text-gray-700 text-base leading-relaxed">
              {trail.description}
            </Text>
          </View>

          {initialRegion && (
            <View className="px-6">
              <Text className="text-xl font-bold text-gray-800 mb-4">
                Mapa do Percurso
              </Text>
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
          )}

          <View className="p-6">
            <Text className="text-xl font-bold text-gray-800 mb-4">
              Pontos de Interesse
            </Text>
            {trail.waypoints?.map((waypoint: ApiWaypoint, index: number) => (
              <View
                key={waypoint.id}
                className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-3 flex-row items-start"
              >
                <View className="bg-green-100 w-10 h-10 rounded-full items-center justify-center mr-4">
                  <Text className="text-green-800 font-bold">{index + 1}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-green-800">
                    {waypoint.name}
                  </Text>
                  <Text className="text-gray-600 mt-1">
                    {waypoint.description}
                  </Text>
                  {waypoint.imageUrl && (
                    <TouchableOpacity
                      onPress={() => openImageModal(waypoint.imageUrl!)}
                      className="mt-2"
                    >
                      <Image
                        source={{ uri: waypoint.imageUrl }}
                        className="w-full h-32 rounded-lg bg-gray-200"
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
        <View className="p-6 bg-white border-t border-gray-200">
          <TouchableOpacity
            className="bg-green-700 py-4 rounded-lg items-center justify-center"
            onPress={() =>
              navigation.navigate("trails", {
                screen: "FollowTrail",
                params: { trailId: trail.id },
              })
            }
          >
            <Text className="text-white font-bold text-lg">Seguir Trilha</Text>
          </TouchableOpacity>
        </View>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={closeImageModal}
        >
          <View className="flex-1 justify-center items-center bg-black/80">
            <TouchableOpacity
              className="absolute top-10 right-6 z-10"
              onPress={closeImageModal}
            >
              <FontAwesome name="close" size={30} color="white" />
            </TouchableOpacity>
            <Image
              source={{ uri: selectedImage || "" }}
              className="w-11/12 h-3/4"
              resizeMode="contain"
            />
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}
