import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

type Option<T extends string> = {
  value: T;
  label: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
};

type OptionSelectorProps<T extends string> = {
  options: Option<T>[];
  selectedValue: T;
  onSelect: (value: T) => void;
};

export function OptionSelector<T extends string>({
  options,
  selectedValue,
  onSelect,
}: OptionSelectorProps<T>) {
  return (
    <View className="flex-row justify-between my-2 gap-2">
      {options.map(({ value, label, icon }) => (
        <TouchableOpacity
          key={value}
          onPress={() => onSelect(value)}
          className={`flex-1 items-center justify-center py-3 rounded-lg border-2 ${
            selectedValue === value
              ? "bg-green-800 border-green-800"
              : "bg-white border-gray-200"
          }`}
        >
          {icon && (
            <MaterialIcons
              name={icon}
              size={24}
              className={
                selectedValue === value ? "text-white" : "text-gray-500"
              }
            />
          )}
          <Text
            className={`font-bold ${
              selectedValue === value ? "text-white" : "text-gray-700"
            }`}
          >
            {label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
