import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

const CATEGORIES = ["CONSERVAÇÃO", "EDUCAÇÃO", "EVENTO", "COMUNIDADE"];

type CategorySelectorProps = {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
};

export function CategorySelector({
  selectedCategory,
  onSelectCategory,
}: CategorySelectorProps) {
  return (
    <View className="mb-4">
      <Text className="text-base font-bold text-gray-700 mb-2">Categoria</Text>
      <View className="flex-row flex-wrap gap-2">
        {CATEGORIES.map((category) => {
          const isSelected = selectedCategory === category;
          return (
            <TouchableOpacity
              key={category}
              onPress={() => onSelectCategory(category)}
              className={`px-4 py-2 rounded-full border-2 ${isSelected ? "bg-green-logo border-green-logo" : "border-gray-300"}`}
            >
              <Text
                className={`font-bold ${isSelected ? "text-white" : "text-gray-600"}`}
              >
                {category}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
