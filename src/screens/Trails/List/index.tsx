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
          />
        )}
      </View>
    </SafeAreaView>
  );
}
