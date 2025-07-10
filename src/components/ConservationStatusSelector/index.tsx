import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

const STATUS_OPTIONS = {
  POUCO_PREOCUPANTE: "Pouco preocupante",
  AMEACADA: "Ameaçada",
  EXTINTA: "Extinta",
} as const;

type StatusKey = keyof typeof STATUS_OPTIONS;

const STATUS_VALUES = Object.keys(STATUS_OPTIONS) as StatusKey[];

type ConservationStatusSelectorProps = {
  selectedValue: string;
  onSelectValue: (value: string) => void;
};

export function ConservationStatusSelector({
  selectedValue,
  onSelectValue,
}: ConservationStatusSelectorProps) {
  return (
    <View className="mb-4">
      <Text className="text-base font-bold text-gray-700 mb-2">
        Estado de Conservação
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {STATUS_VALUES.map((status: StatusKey) => {
          const isSelected = selectedValue === status;
          return (
            <TouchableOpacity
              key={status}
              onPress={() => onSelectValue(status)}
              className={`px-4 py-2 rounded-full border-2 ${
                isSelected
                  ? "bg-green-logo border-green-logo"
                  : "border-gray-300"
              }`}
            >
              <Text
                className={`font-bold ${
                  isSelected ? "text-white" : "text-gray-600"
                }`}
              >
                {STATUS_OPTIONS[status]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
