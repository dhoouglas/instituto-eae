import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { FontAwesome } from "@expo/vector-icons";

type ImagePickerProps = {
  assets: ImagePicker.ImagePickerAsset[];
  onAssetsChange: (assets: ImagePicker.ImagePickerAsset[]) => void;
  existingImageUrls?: string[];
  onExistingImageUrlsChange?: (urls: string[]) => void;
  maxImages?: number;
};

export function ImagePickerComponent({
  assets,
  onAssetsChange,
  existingImageUrls = [],
  onExistingImageUrlsChange = () => {},
  maxImages = 3,
}: ImagePickerProps) {
  const totalImages = assets.length + existingImageUrls.length;

  const pickImage = async () => {
    if (totalImages >= maxImages) {
      Alert.alert(
        "Limite atingido",
        `Você só pode selecionar até ${maxImages} imagens.`
      );
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permissão necessária",
        "Precisamos de permissão para acessar sua galeria."
      );
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
      allowsMultipleSelection: true,
      selectionLimit: maxImages - totalImages,
    });

    if (!result.canceled) {
      onAssetsChange([...assets, ...result.assets]);
    }
  };

  const removeNewAsset = (index: number) => {
    const newAssets = [...assets];
    newAssets.splice(index, 1);
    onAssetsChange(newAssets);
  };

  const removeExistingUrl = (index: number) => {
    const newUrls = [...existingImageUrls];
    newUrls.splice(index, 1);
    onExistingImageUrlsChange(newUrls);
  };

  return (
    <View className="mb-4">
      <Text className="text-base font-bold text-gray-700 mb-2">Imagens</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {existingImageUrls.map((uri, index) => (
          <View key={`existing-${index}`} className="mr-2 relative">
            <Image source={{ uri }} className="w-24 h-24 rounded-lg" />
            <TouchableOpacity
              onPress={() => removeExistingUrl(index)}
              className="absolute top-1 right-1 bg-red-500/80 rounded-full w-6 h-6 items-center justify-center"
            >
              <FontAwesome name="close" size={14} color="white" />
            </TouchableOpacity>
          </View>
        ))}
        {assets.map((asset, index) => (
          <View key={`new-${index}`} className="mr-2 relative">
            <Image
              source={{ uri: asset.uri }}
              className="w-24 h-24 rounded-lg"
            />
            <TouchableOpacity
              onPress={() => removeNewAsset(index)}
              className="absolute top-1 right-1 bg-red-500/80 rounded-full w-6 h-6 items-center justify-center"
            >
              <FontAwesome name="close" size={14} color="white" />
            </TouchableOpacity>
          </View>
        ))}
        {totalImages < maxImages && (
          <TouchableOpacity
            onPress={pickImage}
            className="w-24 h-24 rounded-lg bg-gray-200 items-center justify-center border-2 border-dashed border-gray-400"
          >
            <FontAwesome name="plus" size={24} color="#6B7280" />
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}
