import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  SafeAreaView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { useAuth } from "@clerk/clerk-expo";
import * as Location from "expo-location";
import { AppNavigatorRoutesProps, TrailStackParamList } from "@/routes/types";
import { FollowTrailMap } from "@/components/FollowTrailMap";
import { useLocation } from "@/hooks/useLocation";
import api from "@/lib/api";
import { Loading } from "@/components/Loading";
import { FontAwesome } from "@expo/vector-icons";

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
  coordinates: { latitude: number; longitude: number }[];
  waypoints: ApiWaypoint[];
}

export function FollowTrailScreen() {
  const route = useRoute<RouteProp<TrailStackParamList, "FollowTrail">>();
  const navigation = useNavigation<AppNavigatorRoutesProps>();
  const { getToken } = useAuth();
  const { trailId } = route.params;

  const [trail, setTrail] = useState<Trail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [userLocation, setUserLocation] =
    useState<Location.LocationObjectCoords | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLocating, setIsLocating] = useState(true);

  const handleLocationUpdate = useCallback(
    (location: Location.LocationObject) => {
      setUserLocation(location.coords);
    },
    []
  );

  // Busca a posição inicial uma vez ao montar a tela, antes de iniciar a trilha.
  // Assim, 'userLocation' nunca chega null no mapa no momento do clique em "Iniciar".
  useEffect(() => {
    let isMounted = true;
    const fetchInitialLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (isMounted) setUserLocation(loc.coords);
      } catch {
        // Localização indisponível — o botão mostrará aviso ao tentar iniciar
      } finally {
        if (isMounted) setIsLocating(false);
      }
    };
    fetchInitialLocation();
    return () => { isMounted = false; };
  }, []);

  useLocation({
    enabled: isStarted && !isPaused,
    requestBackground: true,
    onLocationUpdate: handleLocationUpdate,
    onError: (error) => {
      Alert.alert("Erro de Localização", error);
    },
  });

  useEffect(() => {
    const fetchTrailDetails = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const token = await getToken({ template: "api-testing-token" });
        const response = await api.get(`/trails/${trailId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setTrail(response.data);
      } catch (err) {
        setErrorMsg("Não foi possível carregar os dados da trilha.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (trailId) {
      fetchTrailDetails();
    }
  }, [trailId]);

  const handlePause = () => {
    setIsPaused((prev) => !prev);
  };

  const handleStart = () => {
    setIsStarted(true);
  };

  const handleFinish = () => {
    Alert.alert(
      "Finalizar Trilha",
      "Tem certeza de que deseja finalizar o percurso?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Finalizar",
          onPress: () => {
            // Lógica para finalizar a trilha
            console.log("Trilha finalizada");
            navigation.goBack();
          },
          style: "destructive",
        },
      ]
    );
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  if (errorMsg) {
    return (
      <SafeAreaView className="flex-1 bg-[#F9FAFB]">
        <View className="flex-1 justify-center items-center p-6">
          <Text className="text-red-500 text-center text-lg">{errorMsg}</Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mt-4 bg-gray-200 px-6 py-3 rounded-full"
          >
            <Text className="text-gray-800 font-bold">Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!trail) {
    return (
      <SafeAreaView className="flex-1 bg-[#F9FAFB]">
        <View className="flex-1 justify-center items-center p-6">
          <Text className="text-gray-600 text-lg">
            Os dados da trilha não puderam ser carregados.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mt-4 bg-gray-200 px-6 py-3 rounded-full"
          >
            <Text className="text-gray-800 font-bold">Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]">
      <View
        style={{
          paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
          flex: 1,
        }}
      >
        <View className="flex-1 relative">
          <FollowTrailMap
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
            userLocation={userLocation}
            isStarted={isStarted}
            isPaused={isPaused}
            isLocating={isLocating}
            onPause={handlePause}
            onFinish={handleFinish}
            onStart={handleStart}
          />

          {/* FLOATING HEADER CONTROLS (Top Left) */}
          <View
            className="absolute top-4 left-4 right-4 z-10 flex-row justify-between pointer-events-box-none"
          >
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md items-center justify-center shadow-md border border-gray-100"
              activeOpacity={0.8}
            >
              <FontAwesome name="chevron-left" size={16} color="#374151" style={{ marginLeft: -2 }} />
            </TouchableOpacity>

            <View className="bg-white/90 backdrop-blur-md px-4 rounded-full justify-center items-center shadow-md border border-gray-100 h-10 max-w-[220px]">
              <Text className="text-gray-900 font-bold text-sm truncate" numberOfLines={1}>
                {trail.name}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}