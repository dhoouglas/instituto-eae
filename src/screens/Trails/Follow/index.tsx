import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  SafeAreaView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { useAuth } from "@clerk/clerk-expo";
import * as Location from "expo-location";
import { AppNavigatorRoutesProps, TrailStackParamList } from "@/routes/types";
import { Header } from "@/components/Header";
import { FollowTrailMap } from "@/components/FollowTrailMap";
import { useLocation } from "@/hooks/useLocation";
import api from "@/lib/api";

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

  const handleLocationUpdate = useCallback(
    (location: Location.LocationObject) => {
      setUserLocation(location.coords);
    },
    []
  );

  useLocation({
    enabled: isStarted && !isPaused,
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
            // Lógica para finalizar a trilha (a ser implementada)
            console.log("Trilha finalizada");
            navigation.goBack();
          },
          style: "destructive",
        },
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#166534" />
      </View>
    );
  }

  if (errorMsg) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View
          style={{
            paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
          }}
        >
          <Header title="Erro" showBackButton />
        </View>
        <View className="flex-1 justify-center items-center p-6">
          <Text className="text-red-500 text-center text-lg">{errorMsg}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!trail) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View
          style={{
            paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
          }}
        >
          <Header title="Trilha não encontrada" showBackButton />
        </View>
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-600 text-lg">
            Os dados da trilha não puderam ser carregados.
          </Text>
        </View>
      </SafeAreaView>
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
          onPause={handlePause}
          onFinish={handleFinish}
          onStart={handleStart}
        />
      </View>
    </SafeAreaView>
  );
}
