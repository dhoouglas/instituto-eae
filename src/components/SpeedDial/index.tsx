import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { FontAwesome } from "@expo/vector-icons";

type SpeedDialProps = {
  onPressRecord: () => void;
  onPressPlan: () => void;
  onPressImport?: () => void;
};

export function SpeedDial({ onPressRecord, onPressPlan, onPressImport }: SpeedDialProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const rotation = useSharedValue(0);
  const recordButtonY = useSharedValue(0);
  const drawButtonY = useSharedValue(0);
  const importButtonY = useSharedValue(0);
  const menuOpacity = useSharedValue(0);
  const menuScale = useSharedValue(0);

  const toggleMenu = () => {
    const toValue = menuOpen ? 0 : 1;
    rotation.value = withSpring(toValue * 45, { damping: 15 });
    recordButtonY.value = withSpring(toValue * -20, { damping: 15 });
    drawButtonY.value = withSpring(toValue * -80, { damping: 15 });
    importButtonY.value = withSpring(toValue * -140, { damping: 15 });
    menuOpacity.value = withSpring(toValue, { damping: 15 });
    menuScale.value = withSpring(toValue, { damping: 15 });
    setMenuOpen(!menuOpen);
  };

  const rotationStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const recordButtonStyle = useAnimatedStyle(() => {
    return {
      opacity: menuOpacity.value,
      transform: [
        { translateY: recordButtonY.value },
        { scale: menuScale.value },
      ],
    };
  });

  const drawButtonStyle = useAnimatedStyle(() => {
    return {
      opacity: menuOpacity.value,
      transform: [
        { translateY: drawButtonY.value },
        { scale: menuScale.value },
      ],
    };
  });

  const importButtonStyle = useAnimatedStyle(() => {
    return {
      opacity: menuOpacity.value,
      transform: [
        { translateY: importButtonY.value },
        { scale: menuScale.value },
      ],
    };
  });

  return (
    <View
      className="absolute bottom-8 right-6 items-end justify-end"
      style={{ zIndex: 10, height: 300, width: 200 }}
      pointerEvents="box-none"
    >
      {onPressImport && (
        <Animated.View style={[importButtonStyle, { position: 'absolute', bottom: 4, right: 4, zIndex: 1 }]} pointerEvents={menuOpen ? "auto" : "none"}>
          <View className="flex-row items-center">
            <View className="p-2 rounded-md mr-1">
              <Text
                className="font-bold text-black"
                style={{
                  textShadowColor: "rgba(0, 0, 0, 0.25)",
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 2,
                }}
              >
                Importar GPX
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                toggleMenu();
                onPressImport();
              }}
              className="bg-green-800 w-14 h-14 rounded-full items-center justify-center shadow-lg"
              activeOpacity={0.8}
            >
              <FontAwesome name="upload" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      <Animated.View style={[drawButtonStyle, { position: 'absolute', bottom: 4, right: 4, zIndex: 1 }]} pointerEvents={menuOpen ? "auto" : "none"}>
        <View className="flex-row items-center">
          <View className="p-2 rounded-md mr-1">
            <Text
              className="font-bold text-black"
              style={{
                textShadowColor: "rgba(0, 0, 0, 0.25)",
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
              }}
            >
              Planejar Trilha
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              toggleMenu();
              onPressPlan();
            }}
            className="bg-green-800 w-14 h-14 rounded-full items-center justify-center shadow-lg"
            activeOpacity={0.8}
          >
            <FontAwesome name="compass" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.View style={[recordButtonStyle, { position: 'absolute', bottom: 4, right: 4, zIndex: 1 }]} pointerEvents={menuOpen ? "auto" : "none"}>
        <View className="flex-row items-center">
          <View className="p-2 rounded-md mr-1">
            <Text
              className="font-bold text-black"
              style={{
                textShadowColor: "rgba(0, 0, 0, 0.25)",
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
              }}
            >
              Gravar Percurso
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              toggleMenu();
              onPressRecord();
            }}
            className="bg-green-800 w-14 h-14 rounded-full items-center justify-center shadow-lg"
            activeOpacity={0.8}
          >
            <FontAwesome name="map-marker" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <TouchableOpacity
        onPress={toggleMenu}
        className="bg-green-800 w-16 h-16 rounded-full items-center justify-center shadow-lg absolute bottom-0 right-0"
        activeOpacity={0.8}
        style={{ zIndex: 10 }}
      >
        <Animated.View style={rotationStyle}>
          <FontAwesome name="plus" size={24} color="white" />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}
