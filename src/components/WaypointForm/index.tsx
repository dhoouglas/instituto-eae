import React, { memo, useState, useEffect } from "react";
import { View, Text } from "react-native";
import { z } from "zod";
import * as ImagePicker from "expo-image-picker";

import { Input } from "@/components/Input";
import { ImagePickerComponent } from "@/components/ImagePicker";

export const waypointSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
  description: z
    .string()
    .min(10, "A descrição deve ter pelo menos 10 caracteres."),
  image: z.any().optional(),
  existingImageUrl: z.string().optional(),
});

export type WaypointFormData = z.infer<typeof waypointSchema>;

export const EMPTY_WAYPOINT_DATA: WaypointFormData = {
  name: "",
  description: "",
};

export const WaypointForm = memo(
  ({
    order,
    displayOrder,
    initialData,
    onDataChange,
  }: {
    order: number;
    displayOrder: number;
    initialData: WaypointFormData;
    onDataChange: (order: number, data: WaypointFormData) => void;
  }) => {
    const [name, setName] = useState(initialData.name);
    const [description, setDescription] = useState(initialData.description);
    const [image, setImage] = useState<ImagePicker.ImagePickerAsset[]>(
      initialData?.image ? [initialData.image] : []
    );
    const [existingImageUrl, setExistingImageUrl] = useState(
      initialData?.existingImageUrl
    );

    useEffect(() => {
      onDataChange(order, {
        id: initialData?.id,
        name,
        description,
        image: image.length > 0 ? image[0] : undefined,
        existingImageUrl,
      });
    }, [
      name,
      description,
      image,
      order,
      onDataChange,
      initialData?.id,
      existingImageUrl,
    ]);

    return (
      <View className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
        <Text className="text-lg font-bold text-green-800 mb-3">
          Ponto de Interesse #{displayOrder}
        </Text>
        <Input
          placeholder="Nome do Ponto de Interesse"
          value={name}
          onChangeText={setName}
        />
        <View className="h-4" />
        <Input
          placeholder="Descrição do Ponto de Interesse"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          className="h-24"
        />
        <View className="h-4" />
        <ImagePickerComponent
          assets={image}
          onAssetsChange={setImage}
          existingImageUrls={existingImageUrl ? [existingImageUrl] : []}
          onExistingImageUrlsChange={(urls) =>
            setExistingImageUrl(urls.length > 0 ? urls[0] : undefined)
          }
          maxImages={1}
        />
      </View>
    );
  }
);
