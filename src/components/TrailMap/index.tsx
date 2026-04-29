import React, { useRef, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";

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
  const [hasLocationPermission, setHasLocationPermission] = React.useState(false);

  useEffect(() => {
    (async () => {
      try {
        // Just check the status, don't request it here to avoid unexpected prompts
        const { status } = await Location.getForegroundPermissionsAsync();
        setHasLocationPermission(status === "granted");
      } catch (e) {
        console.warn("Could not check location permission in TrailMap", e);
      }
    })();
  }, []);

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

  const handleMapPress = (event: { nativeEvent: { coordinate: any } }) => {
    if (!isEditing) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const { coordinate } = event.nativeEvent;

    if (interactionMode === "drawTrail" && onCoordinatesChange) {
      const newCoordinates = [...coordinates, coordinate];
      onCoordinatesChange(newCoordinates);
    } else if (interactionMode === "addWaypoint" && onAddWaypoint) {
      onAddWaypoint(coordinate);
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

  if (coordinates.length === 0 && !isEditing) {
    return (
      <View className="h-[300px] w-full rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center">
        <Text className="text-gray-500 font-bold text-lg">Mapa indisponível.</Text>
        <Text className="text-gray-400 text-sm mt-1">
          Não há um traçado para esta trilha.
        </Text>
      </View>
    );
  }

  return (
    <View className="h-[340px] w-full rounded-2xl overflow-hidden bg-[#e5e7eb] relative">
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
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
        showsUserLocation={hasLocationPermission}
        showsMyLocationButton={false}
      >
        <Polyline
          coordinates={coordinates}
          strokeColor="#f97316"
          strokeWidth={5}
          lineCap="round"
          lineJoin="round"
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
                pinColor="blue"
                title={waypoint.name || `Ponto de Interesse #${waypoint.order}`}
                description={waypoint.description}
                onPress={(e) => {
                  e.stopPropagation();
                  if (onWaypointPress) {
                    Haptics.selectionAsync();
                    onWaypointPress(waypoint);
                  }
                }}
              />
            );
          }
          return null;
        })}

        {/* Start/End Markers */}
        {coordinates.length > 0 && (
          <>
            <Marker coordinate={coordinates[0]} pinColor="green" title="Início" />
            {coordinates.length > 1 && (
              <Marker coordinate={coordinates[coordinates.length - 1]} pinColor="red" title="Fim" />
            )}
          </>
        )}
      </MapView>

      {/* Floating Controls Right */}
      <View className="absolute top-3 right-3 bg-white/90 backdrop-blur-md rounded-2xl p-1 shadow-sm border border-gray-100">
        {isEditing && (
          <>
            <TouchableOpacity
              onPress={() => onInteractionModeChange?.("drawTrail")}
              className={`w-9 h-9 rounded-full items-center justify-center mb-1 ${interactionMode === "drawTrail" ? "bg-green-700" : ""
                }`}
            >
              <FontAwesome
                name="pencil"
                size={16}
                color={interactionMode === "drawTrail" ? "white" : "#4b5563"}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onInteractionModeChange?.("addWaypoint")}
              className={`w-9 h-9 rounded-full items-center justify-center mb-1 ${interactionMode === "addWaypoint" ? "bg-green-700" : ""
                }`}
            >
              <FontAwesome
                name="map-marker"
                size={16}
                color={interactionMode === "addWaypoint" ? "white" : "#4b5563"}
              />
            </TouchableOpacity>

            <View className="h-px w-6 bg-gray-200 self-center my-1" />
          </>
        )}

        <TouchableOpacity
          onPress={() => handleZoom("in")}
          className="w-9 h-9 rounded-full items-center justify-center mb-1"
        >
          <FontAwesome name="plus" size={16} color="#4b5563" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleZoom("out")}
          className="w-9 h-9 rounded-full items-center justify-center mb-1"
        >
          <FontAwesome name="minus" size={16} color="#4b5563" />
        </TouchableOpacity>

        <View className="h-px w-6 bg-gray-200 self-center my-1" />

        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            fitMapToCoordinates();
          }}
          className="w-9 h-9 rounded-full items-center justify-center"
        >
          <FontAwesome name="crosshairs" size={16} color="#4b5563" />
        </TouchableOpacity>
      </View>

      {/* Floating Bottom Left Controls */}
      {isEditing && (
        <View className="absolute bottom-3 left-3 flex-row items-end gap-2">
          {coordinates.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onUndo?.();
              }}
              className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md items-center justify-center shadow-sm border border-gray-100"
            >
              <MaterialCommunityIcons name="undo" size={20} color="#ef4444" />
            </TouchableOpacity>
          )}

          <View className="bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
            <Text className="text-white text-xs font-bold tracking-wider">
              {interactionMode === "drawTrail" ? "DESENHANDO" : "MARCANDO PONTO"}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
