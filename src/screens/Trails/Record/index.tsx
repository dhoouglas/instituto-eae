import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  SafeAreaView,
  Platform,
  StatusBar,
  TouchableOpacity,
  Alert,
} from "react-native";
import MapView, { Polyline, PROVIDER_GOOGLE, Marker } from "react-native-maps";
import * as Location from "expo-location";
import { useNavigation } from "@react-navigation/native";
import { FontAwesome } from "@expo/vector-icons";
import { Header } from "@/components/Header";
import { TrailStackScreenProps } from "@/routes/types";
import { useMockedLocation } from "@/hooks/useMockedLocation";
import { useLocation } from "@/hooks/useLocation";
import { useStopwatch } from "@/hooks/useStopwatch";

type LocationCoord = {
  latitude: number;
  longitude: number;
};

export function RecordTrailScreen() {
  const navigation =
    useNavigation<TrailStackScreenProps<"RecordTrail">["navigation"]>();
  const [isRecording, setIsRecording] = useState(false);
  const [path, setPath] = useState<LocationCoord[]>([]);
  const [waypointOrders, setWaypointOrders] = useState<number[]>([]);
  const [currentLocation, setCurrentLocation] = useState<LocationCoord | null>(
    null
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // const [useSimulator, setUseSimulator] = useState(__DEV__); // simulador
  const [useSimulator, setUseSimulator] = useState(false); // GPS físico
  const {
    time,
    formattedTime,
    isActive,
    isPaused,
    start,
    pause,
    resume,
    reset,
  } = useStopwatch();
  const [duration, setDuration] = useState(0);

  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("A permissão para acessar a localização foi negada");
        Alert.alert(
          "Permissão Negada",
          "Para gravar uma trilha, precisamos da sua permissão para acessar a localização."
        );
        navigation.goBack();
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location.coords);
      mapRef.current?.animateToRegion({
        ...location.coords,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    })();
  }, []);

  const locationCallback = (location: Location.LocationObject) => {
    const newPoint = location.coords;
    if (isRecording) {
      setPath((prevPath) => [...prevPath, newPoint]);
    }
    setCurrentLocation(newPoint);
    mapRef.current?.animateToRegion(
      {
        ...newPoint,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      },
      500
    );
  };

  // Hook para localização real via GPS
  useLocation({
    enabled: isRecording && !useSimulator,
    requestBackground: true,
    onLocationUpdate: locationCallback,
    onError: (error) => {
      setErrorMsg(error);
      Alert.alert("Erro de Localização", error);
    },
  });

  // Hook para simular a localização em desenvolvimento
  useMockedLocation(
    {
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: 1000,
      distanceInterval: 10,
      enabled: isRecording && useSimulator,
    },
    locationCallback
  );

  const handleToggleRecording = () => {
    const newIsRecording = !isRecording;
    setIsRecording(newIsRecording);

    if (newIsRecording) {
      // Se estava pausado (ou no início), resume/inicia
      if (!isActive) {
        start();
      } else {
        resume();
      }
    } else {
      // Pausa a gravação
      pause();
    }
  };

  const handleFinishRecording = () => {
    if (path.length < 2) {
      Alert.alert("Nenhum Percurso", "Grave um percurso antes de finalizar.");
      return;
    }
    pause(); // Garante que o cronômetro pare ao finalizar
    setDuration(time); // Salva o tempo final
    navigation.navigate("TrailForm", {
      coordinates: path,
      waypointOrders: waypointOrders,
      duration: time, // Passa a duração para o formulário
    });
  };

  const handleDiscardRecording = () => {
    Alert.alert(
      "Descartar Gravação",
      "Tem certeza que deseja descartar o percurso atual?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Descartar",
          style: "destructive",
          onPress: () => {
            setIsRecording(false);
            setPath([]);
            setWaypointOrders([]);
            reset(); // Zera o cronômetro
          },
        },
      ]
    );
  };

  const handleCenterMap = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...currentLocation,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    }
  };

  const handleMarkWaypoint = () => {
    if (!isRecording || path.length === 0) {
      Alert.alert(
        "Ação Inválida",
        "Você precisa estar gravando um percurso para marcar um ponto."
      );
      return;
    }
    // A ordem do waypoint deve ser sequencial (1, 2, 3...), baseada na contagem atual de waypoints.
    const newWaypointOrder = waypointOrders.length + 1;
    const currentPathIndex = path.length; // O índice no array do trajeto

    // Armazena o índice do trajeto onde o waypoint foi marcado.
    // Isso mantém a associação entre o waypoint e sua localização no trajeto.
    setWaypointOrders((prev) => [...prev, currentPathIndex]);

    Alert.alert(
      "Ponto de Interesse Marcado!",
      `O Ponto de Interesse #${newWaypointOrder} foi marcado.`
    );
  };

  const handleZoom = async (type: "in" | "out") => {
    if (!mapRef.current) return;
    const camera = await mapRef.current.getCamera();
    if (camera.zoom) {
      camera.zoom = type === "in" ? camera.zoom + 1 : camera.zoom - 1;
      mapRef.current.animateCamera(camera);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View
        style={{
          paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
          flex: 1,
        }}
      >
        <Header title="Gravar Nova Trilha" showBackButton={true} />

        <View className="flex-1">
          {currentLocation ? (
            <MapView
              provider={PROVIDER_GOOGLE}
              ref={mapRef}
              style={{ flex: 1 }}
              mapType="hybrid"
              initialRegion={{
                ...currentLocation,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
              showsUserLocation
              followsUserLocation
            >
              <Polyline
                coordinates={path}
                strokeColor="#FF6347"
                strokeWidth={5}
              />
              {waypointOrders.map((pathIndex, index) => {
                const coordinate = path[pathIndex - 1];
                if (!coordinate) return null;
                const waypointNumber = index + 1; // A numeração sequencial correta
                return (
                  <Marker
                    key={`waypoint-${waypointNumber}`}
                    coordinate={coordinate}
                    pinColor="blue"
                    title={`Ponto de Interesse #${waypointNumber}`}
                  />
                );
              })}
            </MapView>
          ) : (
            <View className="flex-1 justify-center items-center">
              <Text>{errorMsg || "Obtendo localização..."}</Text>
            </View>
          )}

          {isActive && (
            <View className="absolute top-4 self-center bg-gray-800/90 p-2 px-4 rounded-lg">
              <Text className="text-xl font-bold text-white tracking-wider">
                {formattedTime}
              </Text>
            </View>
          )}

          {/* Map Control Buttons */}
          <View className="absolute bottom-40 right-4 gap-1">
            <TouchableOpacity
              onPress={() => handleZoom("in")}
              className="w-12 h-12 rounded-full items-center justify-center bg-white/80"
            >
              <FontAwesome name="plus" size={20} color="gray" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleZoom("out")}
              className="w-12 h-12 rounded-full items-center justify-center bg-white/80"
            >
              <FontAwesome name="minus" size={20} color="gray" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCenterMap}
              className="w-12 h-12 rounded-full items-center justify-center bg-white/80"
            >
              <FontAwesome name="crosshairs" size={20} color="gray" />
            </TouchableOpacity>
          </View>

          <View className="absolute bottom-0 left-0 right-0 bg-white/80 p-5">
            <View className="flex-row justify-evenly items-center">
              <TouchableOpacity
                onPress={handleToggleRecording}
                className={`w-20 h-20 rounded-full items-center justify-center ${
                  isRecording ? "bg-red-500" : "bg-green-500"
                }`}
              >
                <FontAwesome
                  name={isRecording ? "pause" : "play"}
                  size={24}
                  color="white"
                />
              </TouchableOpacity>

              {isRecording && path.length > 0 && (
                <TouchableOpacity
                  onPress={handleMarkWaypoint}
                  className="w-16 h-16 rounded-full items-center justify-center bg-blue-500"
                >
                  <FontAwesome name="map-marker" size={24} color="white" />
                </TouchableOpacity>
              )}

              {path.length > 0 && !isRecording && (
                <TouchableOpacity
                  onPress={handleDiscardRecording}
                  className="w-16 h-16 rounded-full items-center justify-center bg-yellow-500"
                >
                  <FontAwesome name="trash" size={24} color="white" />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={handleFinishRecording}
                disabled={isRecording || path.length < 2}
                className={`w-20 h-20 rounded-full items-center justify-center ${
                  isRecording || path.length < 2 ? "bg-gray-400" : "bg-blue-500"
                }`}
              >
                <FontAwesome name="check" size={24} color="white" />
              </TouchableOpacity>
            </View>
            {waypointOrders.length > 0 && (
              <Text className="text-center mt-2 text-gray-600">
                {waypointOrders.length} ponto(s) de interesse marcado(s).
              </Text>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
