import React from "react";
import { TouchableOpacity } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { AppNavigatorRoutesProps } from "@/routes/types";

export function FloatingActionButton() {
  const navigation = useNavigation<AppNavigatorRoutesProps>();

  const handlePress = () => {
    navigation.navigate("trails", { screen: "TrailList" });
  };

  return (
    <TouchableOpacity
      className="absolute bottom-[100px] right-5 h-[60px] w-[60px] items-center justify-center rounded-full bg-[#488A35] shadow-lg shadow-black"
      onPress={handlePress}
    >
      <FontAwesome name="map-signs" size={24} color="white" />
    </TouchableOpacity>
  );
}
