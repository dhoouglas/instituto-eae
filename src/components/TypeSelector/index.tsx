import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

const TYPES = ["FAUNA", "FLORA"];

type TypeSelectorProps = {
  selectedValue: string;
  onSelectValue: (value: string) => void;
};

export function TypeSelector({
  selectedValue,
  onSelectValue,
}: TypeSelectorProps) {
  return (
    <View className="mb-4">
      <Text className="text-base font-bold text-gray-700 mb-2">Tipo</Text>
      <View className="flex-row flex-wrap gap-2">
        {TYPES.map((type) => {
          const isSelected = selectedValue === type;
          return (
            <TouchableOpacity
              key={type}
              onPress={() => onSelectValue(type)}
              className={`px-4 py-2 rounded-full border-2 ${isSelected ? "bg-green-logo border-green-logo" : "border-gray-300"}`}
            >
              <Text
                className={`font-bold ${isSelected ? "text-white" : "text-gray-600"}`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
