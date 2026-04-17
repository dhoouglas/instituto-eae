import React, { useState } from "react";
import { View, Text, TouchableOpacity, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { FontAwesome } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

type SpeedDialProps = {
  onPressRecord: () => void;
  onPressPlan: () => void;
  onPressImport?: () => void;
};

export function SpeedDial({
  onPressRecord,
  onPressPlan,
  onPressImport,
}: SpeedDialProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const rotation = useSharedValue(0);
  const recordButtonY = useSharedValue(0);
  const drawButtonY = useSharedValue(0);
  const importButtonY = useSharedValue(0);
  const menuOpacity = useSharedValue(0);
  const menuScale = useSharedValue(0);

  const toggleMenu = () => {
    Haptics.selectionAsync(); // Haptic feedback on open/close
    const toValue = menuOpen ? 0 : 1;
    // Tighter springs for a snappier, premium feel
    rotation.value = withSpring(toValue * 45, { damping: 15, stiffness: 150 });
    recordButtonY.value = withSpring(toValue * -76, { damping: 14, stiffness: 150 });
    drawButtonY.value = withSpring(toValue * -140, { damping: 13, stiffness: 140 });
    importButtonY.value = withSpring(toValue * -204, { damping: 12, stiffness: 130 });
    menuOpacity.value = withSpring(toValue, { damping: 20 });
    menuScale.value = withSpring(toValue, { damping: 15, stiffness: 150 });
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

  const ActionLabel = ({ text }: { text: string }) => (
    <View className="bg-white px-3 py-1.5 rounded-full mr-3 shadow-sm border border-gray-100 flex-row items-center">
      <Text className="font-bold text-gray-800 text-sm">{text}</Text>
    </View>
  );

  return (
    <View
      className="absolute bottom-8 right-6 items-end justify-end"
      style={{ zIndex: 10, height: 300, width: 200 }}
      pointerEvents="box-none"
    >
      {onPressImport && (
        <Animated.View
          style={[
            importButtonStyle,
            { position: "absolute", bottom: 4, right: 4, zIndex: 1 },
          ]}
          pointerEvents={menuOpen ? "auto" : "none"}
        >
          <View className="flex-row items-center">
            <ActionLabel text="Importar GPX" />
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                toggleMenu();
                onPressImport();
              }}
              className="bg-white w-12 h-12 rounded-full items-center justify-center shadow-md border border-gray-100"
              activeOpacity={0.8}
            >
              <FontAwesome name="upload" size={18} color="#166534" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      <Animated.View
        style={[
          drawButtonStyle,
          { position: "absolute", bottom: 4, right: 4, zIndex: 1 },
        ]}
        pointerEvents={menuOpen ? "auto" : "none"}
      >
        <View className="flex-row items-center">
          <ActionLabel text="Planejar Trilha" />
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              toggleMenu();
              onPressPlan();
            }}
            className="bg-white w-12 h-12 rounded-full items-center justify-center shadow-md border border-gray-100"
            activeOpacity={0.8}
          >
            <FontAwesome name="compass" size={20} color="#166534" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.View
        style={[
          recordButtonStyle,
          { position: "absolute", bottom: 4, right: 4, zIndex: 1 },
        ]}
        pointerEvents={menuOpen ? "auto" : "none"}
      >
        <View className="flex-row items-center">
          <ActionLabel text="Gravar Percurso" />
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              toggleMenu();
              onPressRecord();
            }}
            className="bg-white w-12 h-12 rounded-full items-center justify-center shadow-md border border-gray-100"
            activeOpacity={0.8}
          >
            <FontAwesome name="map-marker" size={20} color="#166534" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <TouchableOpacity
        onPress={toggleMenu}
        className="bg-green-700 w-16 h-16 rounded-full items-center justify-center shadow-lg absolute bottom-0 right-0 border-2 border-white/20"
        activeOpacity={0.9}
        style={{
          zIndex: 10,
          shadowColor: "#166534",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 5,
          elevation: 8,
        }}
      >
        <Animated.View style={rotationStyle}>
          <FontAwesome name="plus" size={24} color="white" />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}