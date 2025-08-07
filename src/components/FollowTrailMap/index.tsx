import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  Animated,
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
  onFinish,
  onPause,
  onStart,
}: FollowTrailMapProps) {
  // console.log("Componente FollowTrailMap montado/renderizado");
  // console.log("Total de coordenadas recebidas:", coordinates.length);
  const [time, setTime] = useState(0);
  const [mapType, setMapType] = useState<MapType>("hybrid");
  const [visitedWaypoints, setVisitedWaypoints] = useState<Set<string>>(
    new Set()
  );
  const [selectedWaypoint, setSelectedWaypoint] = useState<Waypoint | null>(
    null
  );
  const [isOnTrack, setIsOnTrack] = useState(true);
  const [showOffTrackBanner, setShowOffTrackBanner] = useState(false);
  const hasGoneOffTrack = useRef(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mapRef = useRef<MapView>(null);

  // Finish trail proximity check
  useEffect(() => {
    if (!userLocation || !isStarted || coordinates.length === 0) return;

    const endPoint = coordinates[coordinates.length - 1];
    const R = 6371e3; // Earth's radius in metres
    const threshold = 20; // 20 meters

    const lat1 = userLocation.latitude * (Math.PI / 180);
    const lat2 = endPoint.latitude * (Math.PI / 180);
    const deltaLat =
      (endPoint.latitude - userLocation.latitude) * (Math.PI / 180);
    const deltaLon =
      (endPoint.longitude - userLocation.longitude) * (Math.PI / 180);

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(deltaLon / 2) *
        Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // console.log("--- Verificação de Fim de Trilha ---");
    // console.log(
    //   "Localização Atual:",
    //   userLocation.latitude,
    //   userLocation.longitude
    // );
    // console.log("Ponto Final:", endPoint.latitude, endPoint.longitude);
    // console.log("Distância Calculada:", distance);
    // console.log("------------------------------------");

    if (distance < threshold) {
      // console.log("!!! FIM DA TRILHA DETECTADO !!!");
      Alert.alert("Parabéns!", "Você finalizou a trilha.", [
        { text: "OK", onPress: onFinish },
      ]);
    }
  }, [userLocation, coordinates, isStarted, onFinish]);

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

  useEffect(() => {
    if (selectedWaypoint) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [selectedWaypoint]);

  // Waypoint proximity check
  useEffect(() => {
    if (!userLocation || !isStarted) return;

    const R = 6371e3; // Earth's radius in metres
    const threshold = 20; // 20 meters

    waypoints.forEach((waypoint) => {
      if (visitedWaypoints.has(waypoint.id)) return;

      const lat1 = userLocation.latitude * (Math.PI / 180);
      const lat2 = waypoint.latitude * (Math.PI / 180);
      const deltaLat =
        (waypoint.latitude - userLocation.latitude) * (Math.PI / 180);
      const deltaLon =
        (waypoint.longitude - userLocation.longitude) * (Math.PI / 180);

      const a =
        Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(lat1) *
          Math.cos(lat2) *
          Math.sin(deltaLon / 2) *
          Math.sin(deltaLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      if (distance < threshold) {
        setVisitedWaypoints((prev) => new Set(prev).add(waypoint.id));
        Alert.alert(
          "Ponto de Interesse Próximo!",
          `Você chegou em: ${waypoint.name}`,
          [{ text: "OK" }]
        );
      }
    });
  }, [userLocation, waypoints, isStarted, visitedWaypoints]);

  // Check if user is on the trail path
  useEffect(() => {
    if (!userLocation || !isStarted || coordinates.length < 2) return;

    const threshold = 10; // 10 meters tolerance

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

    if (isStarted) {
      if (!currentlyOnTrack && !hasGoneOffTrack.current) {
        setShowOffTrackBanner(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        hasGoneOffTrack.current = true;
      } else if (currentlyOnTrack) {
        setShowOffTrackBanner(false);
        hasGoneOffTrack.current = false;
      }
    } else {
      setShowOffTrackBanner(false);
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
    onPause();
    if (isPaused && userLocation) {
      // When resuming, center on user
      mapRef.current?.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.002,
        longitudeDelta: 0.002,
      });
    }
  };

  const handleStart = () => {
    onStart();
    if (mapRef.current && coordinates.length > 0) {
      mapRef.current.animateToRegion(
        {
          latitude: coordinates[0].latitude,
          longitude: coordinates[0].longitude,
          latitudeDelta: 0.002,
          longitudeDelta: 0.002,
        },
        1000
      );
    }
  };

  const handleZoom = async (direction: "in" | "out") => {
    if (!mapRef.current) return;
    const camera = await mapRef.current.getCamera();
    if (camera.zoom) {
      camera.zoom = direction === "in" ? camera.zoom + 1 : camera.zoom - 1;
      mapRef.current.animateCamera(camera);
    }
  };

  const centerMap = () => {
    if (mapRef.current && coordinates.length > 0) {
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  };

  const toggleMapType = () => {
    setMapType((prev) => (prev === "standard" ? "hybrid" : "standard"));
  };

  return (
    <View className="flex-1">
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        mapType={mapType}
        showsUserLocation
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
          strokeColor={
            isStarted ? (isOnTrack ? "#10B981" : "#ef4444") : "#FF6347"
          }
          strokeWidth={5}
        />

        {coordinates.length > 0 && (
          <>
            <Marker
              coordinate={coordinates[0]}
              title="Início da Trilha"
              anchor={{ x: 0.5, y: 1 }}
            >
              <View className="items-center">
                <View className="h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-green-500 shadow-lg shadow-black">
                  <FontAwesome name="play" size={16} color="white" />
                </View>
                <View
                  style={[styles.markerPin, { borderTopColor: "#10B981" }]}
                />
              </View>
            </Marker>
            {coordinates.length > 1 && (
              <Marker
                coordinate={coordinates[coordinates.length - 1]}
                title="Fim da Trilha"
                anchor={{ x: 0.5, y: 1 }}
              >
                <View className="items-center">
                  <View className="h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-black shadow-lg shadow-black">
                    <FontAwesome
                      name="flag-checkered"
                      size={16}
                      color="white"
                    />
                  </View>
                  <View
                    style={[styles.markerPin, { borderTopColor: "#000000" }]}
                  />
                </View>
              </Marker>
            )}
          </>
        )}

        {waypoints.map((waypoint) => (
          <Marker
            key={`waypoint-${waypoint.id}`}
            coordinate={{
              latitude: waypoint.latitude,
              longitude: waypoint.longitude,
            }}
            title={waypoint.name}
            description={waypoint.description}
            onPress={() => setSelectedWaypoint(waypoint)}
          >
            <View className="items-center justify-center">
              <FontAwesome
                name="map-marker"
                size={40}
                color={
                  visitedWaypoints.has(waypoint.id) ? "#FF6347" : "#FFC107"
                }
                style={styles.waypointIcon}
              />
              <Text
                className="absolute top-[6px] text-xs font-bold text-white"
                style={styles.waypointOrderText}
              >
                {waypoint.order}
              </Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {showOffTrackBanner && (
        <View className="absolute left-0 right-0 top-0 flex-row items-center justify-center bg-red-500 p-3 shadow-lg shadow-black">
          <FontAwesome name="warning" size={24} color="white" />
          <Text className="ml-2.5 text-base font-bold text-white">
            Você está saindo da rota!
          </Text>
        </View>
      )}

      {selectedWaypoint && (
        <Animated.View
          className="absolute left-[15%] right-[15%] top-[30%] items-center rounded-lg bg-white p-4 shadow-lg shadow-black"
          style={[{ opacity: fadeAnim }]}
        >
          <TouchableOpacity
            className="absolute right-1.5 top-1.5"
            onPress={() => setSelectedWaypoint(null)}
          >
            <FontAwesome name="close" size={20} color="#374151" />
          </TouchableOpacity>
          {selectedWaypoint.imageUrl && (
            <Image
              source={{ uri: selectedWaypoint.imageUrl }}
              className="mb-2.5 h-[100px] w-[180px] rounded-lg"
            />
          )}
          <Text className="mb-1.5 text-center text-base font-bold">
            {selectedWaypoint.name}
          </Text>
          <Text className="text-center text-sm">
            {selectedWaypoint.description}
          </Text>
        </Animated.View>
      )}

      <View className="absolute right-2.5 top-20 rounded-2xl bg-white/80 p-1.5">
        <TouchableOpacity
          onPress={centerMap}
          className="mb-1.5 h-10 w-10 items-center justify-center rounded-full"
        >
          <FontAwesome name="crosshairs" size={20} color="#374151" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={toggleMapType}
          className="mb-1.5 h-10 w-10 items-center justify-center rounded-full"
        >
          <FontAwesome name="map" size={20} color="#374151" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleZoom("in")}
          className="mb-1.5 h-10 w-10 items-center justify-center rounded-full"
        >
          <FontAwesome name="plus" size={20} color="#374151" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleZoom("out")}
          className="h-10 w-10 items-center justify-center rounded-full"
        >
          <FontAwesome name="minus" size={20} color="#374151" />
        </TouchableOpacity>
      </View>

      {isStarted ? (
        <>
          <View className="absolute top-5 self-center rounded-2xl bg-black/70 px-4 py-2">
            <Text className="text-2xl font-bold text-white">
              {formatTime(time)}
            </Text>
          </View>

          <View className="absolute bottom-[30px] left-0 right-0 flex-row justify-evenly">
            <TouchableOpacity
              onPress={handlePause}
              className={`h-[60px] w-[60px] items-center justify-center rounded-full shadow-lg shadow-black ${
                isPaused ? "bg-green-500" : "bg-amber-500"
              }`}
            >
              <FontAwesome
                name={isPaused ? "play" : "pause"}
                size={24}
                color="white"
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onFinish}
              className="h-[60px] w-[60px] items-center justify-center rounded-full bg-red-500 shadow-lg shadow-black"
            >
              <FontAwesome name="stop" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View className="absolute bottom-[30px] left-0 right-0 flex-row justify-evenly">
          <TouchableOpacity
            onPress={handleStart}
            className="h-[60px] w-[120px] flex-row items-center justify-center rounded-full bg-green-500 shadow-lg shadow-black"
          >
            <FontAwesome name="play" size={24} color="white" />
            <Text className="ml-2 text-lg font-bold text-white">Iniciar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  waypointIcon: {
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  waypointOrderText: {
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  markerPin: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    alignSelf: "center",
    marginTop: -2,
  },
});
