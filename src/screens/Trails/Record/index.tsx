import React, { useState, useEffect, useRef, useCallback } from "react";
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
import { TrailStackScreenProps } from "@/routes/types";
import { useMockedLocation } from "@/hooks/useMockedLocation";
import { useLocation } from "@/hooks/useLocation";
import { useStopwatch } from "@/hooks/useStopwatch";
import * as Haptics from "expo-haptics";

type LocationCoord = {
  latitude: number;
  longitude: number;
  altitude?: number | null;
};

export function RecordTrailScreen() {
  const navigation =
    useNavigation<TrailStackScreenProps<"RecordTrail">["navigation"]>();
  const [isRecording, setIsRecording] = useState(false);
  const [path, setPath] = useState<LocationCoord[]>([]);
  const [waypoints, setWaypoints] = useState<LocationCoord[]>([]);
  const [currentLocation, setCurrentLocation] = useState<LocationCoord | null>(
    null
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
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

  const locationCallback = useCallback(
    (location: Location.LocationObject) => {
      const newPoint = location.coords;
      if (isRecording) {
        setPath((prevPath) => [...prevPath, newPoint]);
      }
      setCurrentLocation(newPoint);
    },
    [isRecording]
  );

  const handleLocationError = useCallback((error: string) => {
    setErrorMsg(error);
    Alert.alert("Erro de Localização", error);
  }, []);

  // Hook para localização real via GPS (background habilitado para gravar com tela desligada)
  const { hasPermission } = useLocation({
    enabled: isRecording && !useSimulator,
    requestBackground: true,
    onLocationUpdate: locationCallback,
    onError: handleLocationError,
  });

  useEffect(() => {
    if (hasPermission) {
      (async () => {
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setCurrentLocation(location.coords);
          if (location.coords.latitude && location.coords.longitude) {
            mapRef.current?.animateToRegion({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            });
          }
        } catch (e) {
          console.warn("Não foi possível obter a localização inicial", e);
        }
      })();
    }
  }, [hasPermission]);

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (path.length < 2) {
      Alert.alert("Nenhum Percurso", "Grave um percurso antes de finalizar.");
      return;
    }
    pause(); // Garante que o cronômetro pare ao finalizar
    setDuration(time); // Salva o tempo final

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

    let totalDistance = 0;
    let elevationGain = 0;
    let lastEle: number | null = null;

    for (let i = 0; i < path.length; i++) {
      const p = path[i];
      if (i > 0) {
        const prevP = path[i - 1];
        totalDistance += getDistance(prevP.latitude, prevP.longitude, p.latitude, p.longitude);
      }
      if (p.altitude != null) {
        if (lastEle !== null && p.altitude > lastEle) {
          elevationGain += (p.altitude - lastEle);
        }
        lastEle = p.altitude;
      }
    }

    const distanceKm = +(totalDistance / 1000).toFixed(2);
    const elevationGainInt = Math.round(elevationGain);
    const estimatedTimeMinutes = Math.round(time / 60);

    navigation.navigate("TrailForm", {
      coordinates: path,
      waypointOrders: waypoints.map((wp) =>
        path.findIndex(
          (p) => p.latitude === wp.latitude && p.longitude === wp.longitude
        ) + 1
      ),
      distance: distanceKm > 0 ? distanceKm : undefined,
      estimatedTime: estimatedTimeMinutes > 0 ? estimatedTimeMinutes : undefined,
      elevationGain: elevationGainInt > 0 ? elevationGainInt : undefined,
    });
  };

  const handleDiscardRecording = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
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
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            setIsRecording(false);
            setPath([]);
            setWaypoints([]);
            reset(); // Zera o cronômetro
          },
        },
      ]
    );
  };

  const handleCenterMap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...currentLocation,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    }
  };

  const handleMarkWaypoint = () => {
    if (!isRecording || path.length === 0 || !currentLocation) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Ação Inválida",
        "Você precisa estar gravando um percurso para marcar um ponto."
      );
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Salva a coordenada exata do usuário no momento da marcação
    const waypointNumber = waypoints.length + 1;
    setWaypoints((prev) => [...prev, { ...currentLocation }]);

    Alert.alert(
      "Ponto de Interesse Marcado!",
      `O Ponto de Interesse #${waypointNumber} foi marcado.`
    );
  };

  const handleZoom = async (type: "in" | "out") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!mapRef.current) return;
    const camera = await mapRef.current.getCamera();
    if (camera && camera.zoom !== undefined) {
      camera.zoom = type === "in" ? camera.zoom + 1 : camera.zoom - 1;
      mapRef.current.animateCamera(camera);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]">
      <View
        style={{
          paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
          flex: 1,
        }}
      >
        {/* PREMIUM HEADER */}
        <View className="px-6 pt-6 pb-4 flex-row items-center justify-between z-10 bg-[#F9FAFB]">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm border border-gray-200"
            activeOpacity={0.8}
          >
            <FontAwesome name="chevron-left" size={16} color="#374151" />
          </TouchableOpacity>
          <View className="flex-1 ml-4">
            <Text className="text-2xl font-black text-gray-900 tracking-tight">
              Gravar Trilha
            </Text>
          </View>
        </View>

        <View className="flex-1 relative rounded-t-3xl overflow-hidden shadow-sm">
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
              showsMyLocationButton={false}
              followsUserLocation={isRecording}
            >
              <Polyline
                coordinates={path}
                strokeColor="#f97316"
                strokeWidth={6}
                zIndex={2}
              />
              {waypoints.map((coord, index) => (
                <Marker
                  key={`waypoint-${index}`}
                  coordinate={coord}
                  pinColor="gold"
                  title={`Ponto de Interesse #${index + 1}`}
                />
              ))}
            </MapView>
          ) : (
            <View className="flex-1 justify-center items-center bg-gray-200">
              <Text className="text-gray-500 font-medium">
                {errorMsg || "Obtendo localização..."}
              </Text>
            </View>
          )}

          {/* TIMER OVERLAY (GLASSMORPHISM PILL) */}
          {isActive && (
            <View className="absolute top-6 self-center bg-black/70 px-5 py-2 rounded-full border border-white/20 shadow-lg backdrop-blur-md">
              <Text
                className="text-2xl font-black text-white tracking-widest"
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {formattedTime}
              </Text>
            </View>
          )}

          {/* MAP CONTROLS (RIGHT PANE) */}
          <View className="absolute bottom-40 right-4 bg-white/90 rounded-2xl p-1 shadow-md border border-gray-100 backdrop-blur-md">
            <TouchableOpacity
              onPress={handleCenterMap}
              className="w-10 h-10 items-center justify-center border-b border-gray-200"
            >
              <FontAwesome name="crosshairs" size={18} color="#374151" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleZoom("in")}
              className="w-10 h-10 items-center justify-center border-b border-gray-200"
            >
              <FontAwesome name="plus" size={16} color="#374151" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleZoom("out")}
              className="w-10 h-10 items-center justify-center"
            >
              <FontAwesome name="minus" size={16} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* BOTTOM CONTROLS (THUMB ZONE) */}
          <View className="absolute bottom-6 left-6 right-6">
            <View className="flex-row justify-center items-end gap-6">
              {path.length > 0 && !isRecording && (
                <TouchableOpacity
                  onPress={handleDiscardRecording}
                  className="w-14 h-14 rounded-full bg-white items-center justify-center shadow-sm border border-red-100 mb-2"
                  activeOpacity={0.8}
                >
                  <FontAwesome name="trash" size={20} color="#ef4444" />
                </TouchableOpacity>
              )}

              {/* WAYPOINT BUTTON */}
              {isRecording && path.length > 0 && (
                <TouchableOpacity
                  onPress={handleMarkWaypoint}
                  className="w-14 h-14 rounded-full bg-white items-center justify-center shadow-sm border border-blue-100 mb-2"
                  activeOpacity={0.8}
                >
                  <FontAwesome name="map-pin" size={20} color="#3b82f6" />
                  {waypoints.length > 0 && (
                    <View className="absolute -top-1 -right-1 bg-blue-600 w-5 h-5 rounded-full items-center justify-center border border-white">
                      <Text className="text-white text-[10px] font-bold">
                        {waypoints.length}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}

              {/* PLAY/PAUSE (PRIMARY) */}
              <TouchableOpacity
                onPress={handleToggleRecording}
                className={`w-20 h-20 rounded-full items-center justify-center shadow-lg border-4 border-white ${isRecording ? "bg-amber-500" : "bg-green-600"
                  }`}
                style={{
                  shadowColor: isRecording ? "#f59e0b" : "#16a34a",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.4,
                  shadowRadius: 8,
                  elevation: 6,
                }}
                activeOpacity={0.9}
              >
                <FontAwesome
                  name={isRecording ? "pause" : "play"}
                  size={28}
                  color="white"
                  style={{ marginLeft: isRecording ? 0 : 4 }}
                />
              </TouchableOpacity>

              {/* FINISH BUTTON */}
              <TouchableOpacity
                onPress={handleFinishRecording}
                disabled={isRecording || path.length < 2}
                className={`w-14 h-14 rounded-full items-center justify-center shadow-sm mb-2 ${isRecording || path.length < 2
                  ? "bg-gray-200 border border-gray-300"
                  : "bg-blue-600 border border-blue-700"
                  }`}
                activeOpacity={0.8}
              >
                <FontAwesome
                  name="check"
                  size={20}
                  color={isRecording || path.length < 2 ? "#9ca3af" : "white"}
                />
              </TouchableOpacity>
            </View>

            {/* INSTRUCTIONS */}
            <View className="mt-6 items-center self-center bg-white/90 px-4 py-2 rounded-full border border-gray-200 shadow-sm">
              <Text className="text-gray-600 text-xs font-bold uppercase tracking-wide">
                {isRecording
                  ? "Gravando em tempo real..."
                  : path.length > 0
                    ? "Gravação pausada"
                    : "Toque em iniciar para gravar a trilha"}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
