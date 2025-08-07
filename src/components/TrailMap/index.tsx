import React, { useRef, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons";

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface Waypoint {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  order: number;
  imageUrl?: string;
}

type InteractionMode = "drawTrail" | "addWaypoint";

interface TrailMapProps {
  coordinates?: Coordinate[];
  waypoints?: Waypoint[];
  isEditing?: boolean;
  interactionMode?: InteractionMode;
  onCoordinatesChange?: (coordinates: Coordinate[]) => void;
  onWaypointPress?: (waypoint: Waypoint) => void;
  onAddWaypoint?: (coordinate: Coordinate) => void;
  onInteractionModeChange?: (mode: InteractionMode) => void;
  onUndo?: () => void;
}

export function TrailMap({
  coordinates = [],
  waypoints = [],
  isEditing = false,
  interactionMode = "drawTrail",
  onCoordinatesChange,
  onWaypointPress,
  onAddWaypoint,
  onInteractionModeChange,
  onUndo,
}: TrailMapProps) {
  const mapRef = useRef<MapView>(null);

  const fitMapToCoordinates = useCallback(() => {
    if (coordinates.length > 0 && mapRef.current) {
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    } else if (mapRef.current) {
      // If no coordinates, fit to a default view of Brazil, for example
      mapRef.current.animateToRegion({
        latitude: -14.235,
        longitude: -51.9253,
        latitudeDelta: 25,
        longitudeDelta: 25,
      });
    }
  }, [coordinates]);

  useEffect(() => {
    // A small delay to ensure the map layout is ready
    const timer = setTimeout(() => {
      fitMapToCoordinates();
    }, 500);

    return () => clearTimeout(timer);
  }, [fitMapToCoordinates]);

  const handleMapPress = (event: { nativeEvent: { coordinate: any } }) => {
    if (!isEditing) return;

    const { coordinate } = event.nativeEvent;

    if (interactionMode === "drawTrail" && onCoordinatesChange) {
      const newCoordinates = [...coordinates, coordinate];
      onCoordinatesChange(newCoordinates);
    } else if (interactionMode === "addWaypoint" && onAddWaypoint) {
      onAddWaypoint(coordinate);
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

  if (coordinates.length === 0 && !isEditing) {
    return (
      <View className="h-80 rounded-xl overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center">
        <Text className="text-gray-500">Mapa indisponível.</Text>
        <Text className="text-gray-400 text-sm mt-1">
          Não há um traçado para esta trilha.
        </Text>
      </View>
    );
  }

  return (
    <View className="h-80 rounded-xl overflow-hidden border border-gray-200">
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        provider={PROVIDER_GOOGLE}
        mapType="hybrid"
        initialRegion={{
          latitude: coordinates[0]?.latitude || -14.235,
          longitude: coordinates[0]?.longitude || -51.9253,
          latitudeDelta: coordinates.length > 0 ? 0.02 : 25,
          longitudeDelta: coordinates.length > 0 ? 0.02 : 25,
        }}
        onMapReady={fitMapToCoordinates}
        onPress={handleMapPress}
        showsUserLocation
        showsMyLocationButton={false}
      >
        <Polyline
          coordinates={coordinates}
          strokeColor="#FF6347"
          strokeWidth={4}
        />

        {/* Waypoints */}
        {waypoints.map((waypoint) => {
          if (waypoint.latitude != null && waypoint.longitude != null) {
            return (
              <Marker
                key={`waypoint-${waypoint.id}`}
                coordinate={{
                  latitude: waypoint.latitude,
                  longitude: waypoint.longitude,
                }}
                title={waypoint.name}
                description={waypoint.description}
                onPress={() => onWaypointPress?.(waypoint)}
                anchor={{ x: 0.5, y: 1 }}
              >
                <View className="items-center justify-center">
                  <FontAwesome
                    name="map-marker"
                    size={40}
                    color="#FFC107"
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
            );
          }
          return null;
        })}

        {/* Start and End Markers */}
        {coordinates.length > 0 && (
          <>
            <Marker
              coordinate={coordinates[0]}
              title="Início da Trilha"
              anchor={{ x: 0.5, y: 1 }}
            >
              <View className="items-center">
                <View className="h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#10B981] shadow-lg shadow-black">
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
                  <View className="h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#000000] shadow-lg shadow-black">
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
      </MapView>
      <View className="absolute top-2 right-2 flex-col items-end">
        <TouchableOpacity
          onPress={fitMapToCoordinates}
          className="w-10 h-10 rounded-full items-center justify-center bg-white/80 mb-2"
        >
          <FontAwesome name="crosshairs" size={20} color="gray" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleZoom("in")}
          className="w-10 h-10 rounded-full items-center justify-center bg-white/80 mb-2"
        >
          <FontAwesome name="plus" size={20} color="gray" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleZoom("out")}
          className="w-10 h-10 rounded-full items-center justify-center bg-white/80 mb-2"
        >
          <FontAwesome name="minus" size={20} color="gray" />
        </TouchableOpacity>

        {isEditing && (
          <>
            <TouchableOpacity
              onPress={() => onInteractionModeChange?.("drawTrail")}
              className={`w-10 h-10 rounded-full items-center justify-center mb-2 ${
                interactionMode === "drawTrail" ? "bg-blue-500" : "bg-white/80"
              }`}
            >
              <MaterialCommunityIcons
                name="vector-polyline"
                size={22}
                color={interactionMode === "drawTrail" ? "white" : "gray"}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onInteractionModeChange?.("addWaypoint")}
              className={`w-10 h-10 rounded-full items-center justify-center mb-2 ${
                interactionMode === "addWaypoint"
                  ? "bg-blue-500"
                  : "bg-white/80"
              }`}
            >
              <FontAwesome
                name="map-marker"
                size={22}
                color={interactionMode === "addWaypoint" ? "white" : "gray"}
              />
            </TouchableOpacity>

            {coordinates.length > 0 && (
              <TouchableOpacity
                onPress={onUndo}
                className="w-10 h-10 rounded-full items-center justify-center bg-white/80"
              >
                <MaterialCommunityIcons name="undo" size={22} color="gray" />
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
      {isEditing && (
        <View className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 px-4 py-2 rounded-full">
          <Text className="text-white font-semibold">
            {interactionMode === "drawTrail"
              ? "Modo: Desenhar Trilha"
              : "Modo: Adicionar Ponto de Interesse"}
          </Text>
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
