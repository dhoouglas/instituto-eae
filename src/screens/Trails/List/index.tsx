import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  Image,
  ListRenderItem,
  Alert,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { TrailStackScreenProps } from "@/routes/types";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { FontAwesome } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { Header } from "@/components/Header";
import { SpeedDial } from "@/components/SpeedDial";
import { Loading } from "@/components/Loading";
import api from "@/lib/api";
import { formatTime } from "@/utils/formatters";
import Toast from "react-native-toast-message";

type Trail = {
  id: string;
  name: string;
  description: string;
  distance: number;
  estimatedTime: number;
  difficulty: "FACIL" | "MEDIO" | "DIFICIL";
  imageUrls: string[];
};

const TrailCard = ({
  item,
  onPress,
  onEdit,
  onDelete,
  isAdmin,
}: {
  item: Trail;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isAdmin: boolean;
}) => (
  <TouchableOpacity
    onPress={onPress}
    className="bg-white rounded-xl shadow-md mb-5 overflow-hidden"
    activeOpacity={0.8}
  >
    {isAdmin && (
      <View className="absolute bottom-3 right-3 flex-row gap-1 z-10">
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="bg-green-800/80 w-8 h-8 rounded-lg items-center justify-center shadow"
        >
          <FontAwesome name="pencil" size={16} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="bg-green-800/80 w-8 h-8 rounded-lg items-center justify-center shadow"
        >
          <FontAwesome name="trash" size={16} color="white" />
        </TouchableOpacity>
      </View>
    )}
    <Image
      source={{ uri: item.imageUrls?.[0] }}
      className="w-full h-32 bg-gray-200"
      resizeMode="cover"
    />
    <View className="p-4">
      <Text className="text-lg font-bold text-gray-800 leading-tight">
        {item.name}
      </Text>
      <View className="flex-row items-center mt-2">
        <FontAwesome name="map-signs" size={14} color="#6B7280" />
        <Text className="text-base text-gray-600 ml-2">{item.distance} km</Text>
      </View>
      <View className="flex-row items-center mt-1">
        <FontAwesome name="line-chart" size={14} color="#6B7280" />
        <Text className="text-base text-gray-600 ml-2 capitalize">
          {item.difficulty.toLowerCase()}
        </Text>
      </View>
      <View className="flex-row items-center mt-1">
        <FontAwesome name="clock-o" size={14} color="#6B7280" />
        <Text className="text-base text-gray-600 ml-2">
          {formatTime(item.estimatedTime)}
        </Text>
      </View>
    </View>
  </TouchableOpacity>
);

export function TrailList() {
  const navigation =
    useNavigation<TrailStackScreenProps<"TrailList">["navigation"]>();
  const { user } = useUser();
  const { getToken } = useAuth();
  const isAdmin = user?.publicMetadata?.role === "admin";

  const [trails, setTrails] = useState<Trail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken({ template: "api-testing-token" });
      const response = await api.get("/trails", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setTrails(response.data);
    } catch (err) {
      setError("Não foi possível carregar as trilhas.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTrails();
    }, [fetchTrails])
  );

  const handleDelete = async (trailId: string) => {
    Alert.alert(
      "Confirmar Exclusão",
      "Tem certeza de que deseja excluir esta trilha?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await getToken({ template: "api-testing-token" });
              await api.delete(`/trails/${trailId}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              setTrails((prevTrails) =>
                prevTrails.filter((trail) => trail.id !== trailId)
              );
              Toast.show({
                type: "success",
                text1: "Sucesso!",
                text2: "A trilha foi excluída.",
              });
            } catch (err) {
              Toast.show({
                type: "error",
                text1: "Erro",
                text2: "Não foi possível excluir a trilha.",
              });
              console.error(err);
            }
          },
        },
      ]
    );
  };

  const renderItem: ListRenderItem<Trail> = ({ item }) => (
    <TrailCard
      item={item}
      onPress={() => navigation.navigate("TrailDetails", { trailId: item.id })}
      onEdit={() => navigation.navigate("TrailForm", { trailId: item.id })}
      onDelete={() => handleDelete(item.id)}
      isAdmin={isAdmin}
    />
  );

  const handlePressRecord = () => {
    navigation.navigate("RecordTrail", {});
  };

  const handlePressPlan = () => {
    navigation.navigate("TrailForm", {});
  };

  const handlePressImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const file = result.assets[0];
      if (!file.name.toLowerCase().endsWith(".gpx")) {
        Toast.show({
          type: "error",
          text1: "Arquivo inválido",
          text2: "Por favor, selecione um arquivo .gpx válido.",
        });
        return;
      }

      const fileContent = await FileSystem.readAsStringAsync(file.uri);

      // Função auxiliar para calcular distância (Haversine)
      const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371e3;
        const φ1 = (lat1 * Math.PI) / 180;
        const φ2 = (lat2 * Math.PI) / 180;
        const Δφ = ((lat2 - lat1) * Math.PI) / 180;
        const Δλ = ((lon2 - lon1) * Math.PI) / 180;
        const a =
          Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };

      // Parse coordinates (trkpt) e extração de dados
      const trkptRegex = /<trkpt\s+lat="([^"]+)"\s+lon="([^"]+)"(?:>([\s\S]*?)<\/trkpt>|\s*\/>)/g;
      const eleRegex = /<ele>([\s\S]*?)<\/ele>/;
      const timeRegex = /<time>([\s\S]*?)<\/time>/;

      const coordinates: { latitude: number; longitude: number; order: number }[] = [];
      let match;
      let orderCounter = 1;
      let totalDistance = 0;
      let elevationGain = 0;
      let firstTime: Date | null = null;
      let lastTime: Date | null = null;
      let lastEle: number | null = null;

      while ((match = trkptRegex.exec(fileContent)) !== null) {
        const lat = parseFloat(match[1]);
        const lon = parseFloat(match[2]);
        const innerContent = match[3] || "";

        coordinates.push({
          latitude: lat,
          longitude: lon,
          order: orderCounter++,
        });

        // Distância
        if (coordinates.length > 1) {
          const prev = coordinates[coordinates.length - 2];
          totalDistance += getDistance(prev.latitude, prev.longitude, lat, lon);
        }

        // Elevação
        const eleMatch = eleRegex.exec(innerContent);
        if (eleMatch) {
          const ele = parseFloat(eleMatch[1]);
          if (!isNaN(ele)) {
            if (lastEle !== null && ele > lastEle) {
              elevationGain += (ele - lastEle);
            }
            lastEle = ele;
          }
        }

        // Tempo
        const timeMatch = timeRegex.exec(innerContent);
        if (timeMatch) {
          const time = new Date(timeMatch[1].trim());
          if (!isNaN(time.getTime())) {
            if (!firstTime) firstTime = time;
            lastTime = time;
          }
        }
      }

      if (coordinates.length === 0) {
        Toast.show({
          type: "error",
          text1: "Nenhuma rota encontrada",
          text2: "O arquivo GPX não possui pontos de trilha (trkpt).",
        });
        return;
      }

      let estimatedTimeMinutes = 0;
      if (firstTime && lastTime) {
        estimatedTimeMinutes = Math.round((lastTime.getTime() - firstTime.getTime()) / 60000);
      }
      
      const distanceKm = +(totalDistance / 1000).toFixed(2);
      const elevationGainInt = Math.round(elevationGain);

      // Parse waypoints (wpt)
      const wptRegex = /<wpt\s+lat="([^"]+)"\s+lon="([^"]+)">([\s\S]*?)<\/wpt>/g;
      const nameRegex = /<name>([\s\S]*?)<\/name>/;
      const descRegex = /<desc>([\s\S]*?)<\/desc>/;
      
      const waypointOrders: number[] = [];
      const waypointsData: Record<number, { name: string; description: string }> = {};

      let wptMatch;
      while ((wptMatch = wptRegex.exec(fileContent)) !== null) {
        const lat = parseFloat(wptMatch[1]);
        const lon = parseFloat(wptMatch[2]);
        const content = wptMatch[3];

        const nameMatch = nameRegex.exec(content);
        const descMatch = descRegex.exec(content);

        const name = nameMatch ? nameMatch[1].trim() : "";
        const description = descMatch ? descMatch[1].trim() : "";

        // Encontrar a coordenada (trkpt) mais próxima para "ancorar" o waypoint na linha
        let closestOrder = 1;
        let minDistance = Infinity;

        for (const coord of coordinates) {
          const dist = getDistance(lat, lon, coord.latitude, coord.longitude);
          if (dist < minDistance) {
            minDistance = dist;
            closestOrder = coord.order;
          }
        }

        // Se já existe um waypoint nesta exata ordem, procuramos o próximo index vazio
        let finalOrder = closestOrder;
        while (waypointOrders.includes(finalOrder) && finalOrder <= coordinates.length) {
          finalOrder++;
        }

        waypointOrders.push(finalOrder);
        waypointsData[finalOrder] = { name, description };
      }

      navigation.navigate("TrailForm", {
        coordinates: coordinates,
        waypointOrders: waypointOrders.length > 0 ? waypointOrders : undefined,
        waypointsData: Object.keys(waypointsData).length > 0 ? waypointsData : undefined,
        distance: distanceKm > 0 ? distanceKm : undefined,
        estimatedTime: estimatedTimeMinutes > 0 ? estimatedTimeMinutes : undefined,
        elevationGain: elevationGainInt > 0 ? elevationGainInt : undefined,
      });
      
      Toast.show({
        type: "success",
        text1: "Arquivo importado!",
        text2: `${coordinates.length} pontos, ${distanceKm}km processados.`,
      });

    } catch (error) {
      console.error(error);
      Toast.show({
        type: "error",
        text1: "Erro ao importar",
        text2: "Não foi possível ler o arquivo GPX.",
      });
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Loading />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-red-500">{error}</Text>
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
        <Header title="Trilhas" showBackButton={true} />
        <FlatList
          data={trails}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: 150,
          }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View className="flex-1 justify-center items-center mt-20">
              <FontAwesome name="map-o" size={40} color="#9CA3AF" />
              <Text className="text-gray-500 text-lg mt-4">
                Nenhuma trilha encontrada.
              </Text>
              <Text className="text-gray-400 mt-1">
                Crie a primeira trilha no botão abaixo!
              </Text>
            </View>
          )}
        />

        {isAdmin && (
          <SpeedDial
            onPressRecord={handlePressRecord}
            onPressPlan={handlePressPlan}
            onPressImport={handlePressImport}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
