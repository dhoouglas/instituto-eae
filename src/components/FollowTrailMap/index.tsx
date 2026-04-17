import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  Animated,
  ActivityIndicator,
  Platform,
  Modal,
} from "react-native";
import MapView, {
  Polyline,
  Marker,
  PROVIDER_GOOGLE,
  MapType,
} from "react-native-maps";
import { FontAwesome } from "@expo/vector-icons";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";

interface Waypoint {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  imageUrl?: string;
  order: number;
}

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface FollowTrailMapProps {
  coordinates: Coordinate[];
  waypoints: Waypoint[];
  userLocation: Location.LocationObjectCoords | null;
  isStarted: boolean;
  isPaused: boolean;
  isLocating: boolean;
  onFinish: () => void;
  onPause: () => void;
  onStart: () => void;
}

export function FollowTrailMap({
  coordinates,
  waypoints,
  userLocation,
  isStarted,
  isPaused,
  isLocating,
  onFinish,
  onPause,
  onStart,
}: FollowTrailMapProps) {
  const [time, setTime] = useState(0);
  const [mapType, setMapType] = useState<MapType>("hybrid");
  const [visitedWaypoints, setVisitedWaypoints] = useState<Set<string>>(
    new Set()
  );
  const [selectedWaypoint, setSelectedWaypoint] = useState<Waypoint | null>(
    null
  );
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [isOnTrack, setIsOnTrack] = useState(true);
  const [showOffTrackBanner, setShowOffTrackBanner] = useState(false);
  const [showFarFromStartBanner, setShowFarFromStartBanner] = useState(false);
  const [userPath, setUserPath] = useState<Coordinate[]>([]);
  const [hasLeftStartArea, setHasLeftStartArea] = useState(false);
  const hasGoneOffTrack = useRef(false);
  const hasReachedTrail = useRef(false);

  // Animation refs
  const bottomSheetTranslateY = useRef(new Animated.Value(400)).current;

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mapRef = useRef<MapView>(null);

  const getDistance = (p1: Coordinate, p2: Coordinate) => {
    const R = 6371e3;
    const φ1 = (p1.latitude * Math.PI) / 180;
    const φ2 = (p2.latitude * Math.PI) / 180;
    const Δφ = ((p2.latitude - p1.latitude) * Math.PI) / 180;
    const Δλ = ((p2.longitude - p1.longitude) * Math.PI) / 180;
    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    if (!userLocation || !isStarted || coordinates.length === 0) return;

    const startPoint = coordinates[0];
    const distFromStart = getDistance(
      { latitude: userLocation.latitude, longitude: userLocation.longitude },
      startPoint
    );

    if (distFromStart > 30 && !hasLeftStartArea) {
      setHasLeftStartArea(true);
    }

    const endPoint = coordinates[coordinates.length - 1];
    const distanceToEnd = getDistance(
      { latitude: userLocation.latitude, longitude: userLocation.longitude },
      endPoint
    );

    if (distanceToEnd < 20 && hasLeftStartArea) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Parabéns!", "Você finalizou a trilha.", [
        { text: "OK", onPress: onFinish },
      ]);
    }
  }, [userLocation, coordinates, isStarted, onFinish, hasLeftStartArea]);

  useEffect(() => {
    if (isStarted && !isPaused) {
      timerRef.current = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isStarted, isPaused]);

  useEffect(() => {
    if (mapRef.current && coordinates.length > 0) {
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(coordinates, {
          edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
          animated: true,
        });
      }, 500);
    }
  }, [coordinates]);

  const openWaypointModal = (wp: Waypoint) => {
    Haptics.selectionAsync();
    setSelectedWaypoint(wp);
    Animated.spring(bottomSheetTranslateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 10,
    }).start();
  };

  const closeWaypointModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(bottomSheetTranslateY, {
      toValue: 400,
      useNativeDriver: true,
      tension: 65,
      friction: 10,
    }).start(() => setSelectedWaypoint(null));
  };

  useEffect(() => {
    if (!userLocation || !isStarted) return;

    const threshold = 20;

    waypoints.forEach((waypoint) => {
      if (visitedWaypoints.has(waypoint.id)) return;

      const distance = getDistance(
        { latitude: userLocation.latitude, longitude: userLocation.longitude },
        { latitude: waypoint.latitude, longitude: waypoint.longitude }
      );

      if (distance < threshold) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setVisitedWaypoints((prev) => new Set(prev).add(waypoint.id));
        Alert.alert(
          "Ponto de Interesse Próximo!",
          `Você chegou em: ${waypoint.name}`,
          [{ text: "OK" }]
        );
      }
    });
  }, [userLocation, waypoints, isStarted, visitedWaypoints]);

  useEffect(() => {
    if (isStarted && !isPaused && userLocation) {
      const newCoord = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      };

      setUserPath((prev) => {
        if (prev.length === 0) return [newCoord];
        const lastCoord = prev[prev.length - 1];
        const dist = getDistance(lastCoord, newCoord);
        if (dist > 2) {
          return [...prev, newCoord];
        }
        return prev;
      });
    }
  }, [userLocation, isStarted, isPaused]);

  useEffect(() => {
    if (!userLocation || !isStarted || coordinates.length < 2) return;

    const threshold = 20;

    const pointToLineSegmentDistance = (
      p: Location.LocationObjectCoords,
      a: Coordinate,
      b: Coordinate
    ) => {
      const pCoord = { latitude: p.latitude, longitude: p.longitude };
      const l2 =
        (b.latitude - a.latitude) ** 2 + (b.longitude - a.longitude) ** 2;
      if (l2 === 0) return getDistance(pCoord, a);
      let t =
        ((p.latitude - a.latitude) * (b.latitude - a.latitude) +
          (p.longitude - a.longitude) * (b.longitude - a.longitude)) /
        l2;
      t = Math.max(0, Math.min(1, t));
      const projection = {
        latitude: a.latitude + t * (b.latitude - a.latitude),
        longitude: a.longitude + t * (b.longitude - a.longitude),
      };
      return getDistance(pCoord, projection);
    };

    let minDistance = Infinity;
    for (let i = 0; i < coordinates.length - 1; i++) {
      const distance = pointToLineSegmentDistance(
        userLocation,
        coordinates[i],
        coordinates[i + 1]
      );
      if (distance < minDistance) {
        minDistance = distance;
      }
    }

    const currentlyOnTrack = minDistance < threshold;
    setIsOnTrack(currentlyOnTrack);

    if (currentlyOnTrack) {
      hasReachedTrail.current = true;
    }

    if (isStarted) {
      if (currentlyOnTrack) {
        setShowOffTrackBanner(false);
        setShowFarFromStartBanner(false);
        hasGoneOffTrack.current = false;
      } else {
        if (!hasReachedTrail.current) {
          const startDistance = getDistance(
            { latitude: userLocation.latitude, longitude: userLocation.longitude },
            coordinates[0]
          );
          if (startDistance > 50) {
            setShowFarFromStartBanner(true);
            setShowOffTrackBanner(false);
          } else {
            setShowFarFromStartBanner(false);
            setShowOffTrackBanner(false);
          }
        } else {
          setShowFarFromStartBanner(false);
          if (!hasGoneOffTrack.current) {
            setShowOffTrackBanner(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            hasGoneOffTrack.current = true;
          }
        }
      }
    } else {
      setShowOffTrackBanner(false);
      setShowFarFromStartBanner(false);
      hasReachedTrail.current = false;
    }
  }, [userLocation, coordinates, isStarted]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [hours, minutes, seconds]
      .map((v) => (v < 10 ? "0" + v : v))
      .join(":");
  };

  const handlePause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPause();
    if (isPaused && userLocation) {
      mapRef.current?.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.002,
        longitudeDelta: 0.002,
      });
    }
  };

  const PROXIMITY_THRESHOLD_METERS = 150;

  const handleStart = () => {
    // GPS ainda não fixou posição
    if (!userLocation) {
      Alert.alert(
        "Aguardando GPS",
        "Ainda estamos obtendo sua localização. Aguarde alguns segundos e tente novamente."
      );
      return;
    }

    // Verifica se o usuário está próximo do início da trilha
    if (coordinates.length > 0) {
      const distToStart = getDistance(
        { latitude: userLocation.latitude, longitude: userLocation.longitude },
        coordinates[0]
      );
      if (distToStart > PROXIMITY_THRESHOLD_METERS) {
        Alert.alert(
          "Longe do início",
          `Você está a ${Math.round(distToStart)}m do início da trilha. Dirija-se ao ponto de partida (marcador verde) para começar.`
        );
        return;
      }
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onStart();
    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.002,
          longitudeDelta: 0.002,
        },
        1000
      );
    }
  };

  const handleZoom = async (direction: "in" | "out") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!mapRef.current) return;
    const camera = await mapRef.current.getCamera();
    if (camera && camera.zoom !== undefined) {
      camera.zoom = direction === "in" ? camera.zoom + 1 : camera.zoom - 1;
      mapRef.current.animateCamera(camera);
    }
  };

  const centerMap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (mapRef.current && coordinates.length > 0) {
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  };

  const toggleMapType = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMapType((prev) => (prev === "standard" ? "hybrid" : "standard"));
  };

  return (
    <View className="flex-1 relative">
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        mapType={mapType}
        showsUserLocation
        followsUserLocation={isStarted && !isPaused}
        showsMyLocationButton={false}
        initialRegion={
          coordinates.length > 0
            ? {
              latitude: coordinates[0].latitude,
              longitude: coordinates[0].longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }
            : undefined
        }
      >
        <Polyline
          coordinates={coordinates}
          strokeColor="#f97316"
          strokeWidth={6}
          zIndex={1}
          lineCap="round"
          lineJoin="round"
        />

        {userPath.length > 0 && (
          <Polyline
            coordinates={userPath}
            strokeColor={isOnTrack ? "#10B981" : "#ef4444"}
            strokeWidth={4}
            zIndex={2}
          />
        )}

        {coordinates.length > 0 && (
          <>
            <Marker coordinate={coordinates[0]} title="Início" pinColor="green" />
            <Marker coordinate={coordinates[coordinates.length - 1]} title="Fim" pinColor="red" />
          </>
        )}

        {waypoints.map((waypoint) => (
          <Marker
            key={`waypoint-${waypoint.id}`}
            coordinate={{
              latitude: waypoint.latitude,
              longitude: waypoint.longitude,
            }}
            title={waypoint.name || `Ponto de Interesse #${waypoint.order}`}
            description={waypoint.description}
            pinColor="blue"
            opacity={visitedWaypoints.has(waypoint.id) ? 0.4 : 1}
            onPress={(e) => {
              e.stopPropagation();
              openWaypointModal(waypoint);
            }}
            tracksViewChanges={false}
          />
        ))}
      </MapView>

      {/* DYNAMIC ISLAND STYLE BANNERS */}
      {showOffTrackBanner && (
        <View className="absolute top-20 left-4 right-4 items-center z-10 pointer-events-none">
          <View className="bg-red-600/90 backdrop-blur-md px-4 py-3 rounded-full flex-row items-center shadow-lg border border-red-500">
            <FontAwesome name="map-signs" size={16} color="white" />
            <Text className="text-white font-bold ml-2 text-sm">Você está fora da rota principal!</Text>
          </View>
        </View>
      )}

      {showFarFromStartBanner && (
        <View className="absolute top-20 left-4 right-4 items-center z-10 pointer-events-none">
          <View className="bg-amber-500/90 backdrop-blur-md px-4 py-3 rounded-full flex-row items-center shadow-lg border border-amber-400">
            <FontAwesome name="exclamation-triangle" size={16} color="white" />
            <Text className="text-white font-bold ml-2 text-sm">Você está longe do início da trilha.</Text>
          </View>
        </View>
      )}

      {/* TIMER PILL */}
      {isStarted && (
        <View className="absolute top-8 self-center bg-black/70 backdrop-blur-md px-5 py-2 rounded-full border border-white/20 shadow-lg z-10">
          <Text
            className="text-2xl font-black text-white tracking-widest"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {formatTime(time)}
          </Text>
        </View>
      )}

      {/* MAP CONTROLS RIGHT PANE */}
      <View className="absolute bottom-40 right-4 bg-white/90 backdrop-blur-md rounded-2xl p-1 shadow-md border border-gray-100 z-10">
        <TouchableOpacity
          onPress={centerMap}
          className="w-10 h-10 items-center justify-center border-b border-gray-200"
        >
          <FontAwesome name="crosshairs" size={18} color="#374151" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={toggleMapType}
          className="w-10 h-10 items-center justify-center border-b border-gray-200"
        >
          <FontAwesome name="map" size={16} color="#374151" />
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

      {/* THUMB ZONE ACTIONS (BOTTOM) */}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.4)", "rgba(0,0,0,0.8)"]}
        className="absolute bottom-0 left-0 right-0 pt-16 pb-8 px-6 z-10"
        pointerEvents="box-none"
      >
        <View className="flex-row justify-center items-end gap-6">
          {!isStarted ? (
            <TouchableOpacity
              onPress={handleStart}
              disabled={isLocating}
              className={`w-full h-16 rounded-full items-center justify-center shadow-lg flex-row ${isLocating ? "bg-green-400" : "bg-green-600"
                }`}
              style={{ shadowColor: "#16a34a", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 }}
              activeOpacity={0.9}
            >
              {isLocating ? (
                <>
                  <ActivityIndicator size="small" color="white" />
                  <Text className="text-white font-black text-xl ml-3 tracking-wide">
                    OBTENDO GPS...
                  </Text>
                </>
              ) : (
                <>
                  <FontAwesome name="play" size={20} color="white" />
                  <Text className="text-white font-black text-xl ml-3 tracking-wide">
                    INICIAR TRILHA
                  </Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <>
              {/* PAUSE/RESUME */}
              <TouchableOpacity
                onPress={handlePause}
                className={`w-16 h-16 rounded-full items-center justify-center shadow-lg border-2 border-white ${isPaused ? "bg-green-600" : "bg-amber-500"
                  }`}
                activeOpacity={0.8}
              >
                <FontAwesome
                  name={isPaused ? "play" : "pause"}
                  size={24}
                  color="white"
                  style={{ marginLeft: isPaused ? 4 : 0 }}
                />
              </TouchableOpacity>

              {/* STOP/FINISH */}
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                  onFinish();
                }}
                className="w-16 h-16 rounded-full bg-red-600 items-center justify-center shadow-lg border-2 border-white"
                activeOpacity={0.8}
              >
                <FontAwesome name="stop" size={24} color="white" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </LinearGradient>

      {/* WAYPOINT BOTTOM SHEET */}
      <Animated.View
        style={{
          transform: [{ translateY: bottomSheetTranslateY }],
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "white",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          elevation: 20,
          zIndex: 50,
          minHeight: 250,
        }}
      >
        <View className="items-center pt-3 pb-2">
          <View className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </View>

        <View className="p-6 pt-2">
          <View className="flex-row justify-between items-start mb-4">
            <View className="flex-1 pr-4">
              <Text className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">
                Ponto de Interesse #{selectedWaypoint?.order}
              </Text>
              <Text className="text-2xl font-black text-gray-900 leading-tight">
                {selectedWaypoint?.name}
              </Text>
            </View>
            <TouchableOpacity
              onPress={closeWaypointModal}
              className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
            >
              <FontAwesome name="times" size={16} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {selectedWaypoint?.imageUrl && (
            <TouchableOpacity activeOpacity={0.8} onPress={() => setIsImageModalVisible(true)}>
              <Image
                source={{ uri: selectedWaypoint.imageUrl }}
                className="w-full h-40 rounded-xl mb-4 bg-gray-200"
                resizeMode="cover"
              />
            </TouchableOpacity>
          )}
          <Text className="text-gray-600 text-base leading-relaxed mb-6">
            {selectedWaypoint?.description || "Nenhuma descrição disponível."}
          </Text>
        </View>
      </Animated.View>

      {/* FULL SCREEN IMAGE MODAL */}
      <Modal
        visible={isImageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsImageModalVisible(false)}
      >
        <View className="flex-1 bg-black/95 justify-center items-center">
          <TouchableOpacity
            className="absolute top-12 right-4 z-10 p-5"
            onPress={() => setIsImageModalVisible(false)}
          >
            <FontAwesome name="times" size={28} color="white" />
          </TouchableOpacity>
          {selectedWaypoint?.imageUrl && (
            <Image
              source={{ uri: selectedWaypoint.imageUrl }}
              className="w-full h-4/5"
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}