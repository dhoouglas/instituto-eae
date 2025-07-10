import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  SafeAreaView,
  Platform,
  StatusBar,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { RouteProp } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import PagerView from "react-native-pager-view";

import { Header } from "@/components/Header";
import { FaunaFloraStackParamList } from "@/routes/types";
import api from "@/lib/api";
import { Button } from "@/components/Button";

type FaunaFloraDetailsRouteProp = RouteProp<
  FaunaFloraStackParamList,
  "faunaFloraDetails"
>;

type FaunaFloraItem = {
  id: string;
  name: string;
  scientificName: string;
  type: "FAUNA" | "FLORA";
  description: string;
  habitat?: string;
  family?: string;
  conservationStatus:
    | "POUCO_PREOCUPANTE"
    | "AMEACADA"
    | "EXTINTA"
    | "Status de Conservação";
  imageUrls: string[];
};

const { width } = Dimensions.get("window");

export function FaunaFloraDetailsScreen() {
  const route = useRoute<FaunaFloraDetailsRouteProp>();
  const { faunaFloraId, type } = route.params;

  const [item, setItem] = useState<FaunaFloraItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchDetails = useCallback(async () => {
    if (!type || !faunaFloraId) {
      setFetchError("Dados insuficientes para carregar detalhes.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setFetchError(null);
    try {
      const endpoint = type.toUpperCase() === "FAUNA" ? "/fauna" : "/flora";
      const response = await api.get(`${endpoint}/${faunaFloraId}`);
      setItem({ ...response.data, type });
    } catch (error) {
      const errorMessage = "Não foi possível carregar os detalhes.";
      setFetchError(errorMessage);
      Toast.show({ type: "error", text1: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }, [faunaFloraId, type]);

  useFocusEffect(
    useCallback(() => {
      fetchDetails();
    }, [fetchDetails])
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#488A35" />
        </View>
      );
    }

    if (fetchError || !item) {
      return (
        <View className="flex-1 justify-center items-center p-6">
          <Text className="text-lg text-red-500 text-center mb-4">
            {fetchError || "Item não encontrado."}
          </Text>
          <Button title="Tentar Novamente" onPress={fetchDetails} />
        </View>
      );
    }

    return (
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {item.imageUrls && item.imageUrls.length > 0 && (
          <PagerView style={{ width, height: width * 0.75 }} initialPage={0}>
            {item.imageUrls.map((url, index) => (
              <View key={index}>
                <Image
                  source={{ uri: url }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </View>
            ))}
          </PagerView>
        )}
        <View className="p-6">
          <Text className="text-sm font-bold text-green-logo uppercase">
            {item.type?.toUpperCase() === "FAUNA" ? "Fauna" : "Flora"}
          </Text>
          <Text className="text-3xl font-bold text-gray-800 mt-1">
            {item.name}
          </Text>
          <Text className="text-lg italic text-gray-600 mt-1">
            {item.scientificName}
          </Text>
          <View className="h-px bg-gray-200 my-6" />

          {item.type === "FAUNA" ? (
            <>
              <View className="mb-4">
                <Text className="text-lg font-bold text-gray-800 mb-1">
                  Estado de Conservação
                </Text>
                <View
                  className={`self-start px-3 py-1 rounded-full ${
                    item.conservationStatus === "AMEACADA"
                      ? "bg-red-100"
                      : item.conservationStatus === "EXTINTA"
                        ? "bg-gray-800"
                        : "bg-green-100"
                  }`}
                >
                  <Text
                    className={`font-bold ${
                      item.conservationStatus === "AMEACADA"
                        ? "text-red-800"
                        : item.conservationStatus === "EXTINTA"
                          ? "text-white"
                          : "text-green-800"
                    }`}
                  >
                    {item.conservationStatus?.replace("_", " ")}
                  </Text>
                </View>
              </View>

              <View className="mb-4">
                <Text className="text-lg font-bold text-gray-800 mb-1">
                  Habitat
                </Text>
                <Text className="text-base text-gray-700">{item.habitat}</Text>
              </View>
            </>
          ) : (
            <View className="mb-4">
              <Text className="text-lg font-bold text-gray-800 mb-1">
                Família
              </Text>
              <Text className="text-base text-gray-700">{item.family}</Text>
            </View>
          )}

          <View className="mb-4">
            <Text className="text-lg font-bold text-gray-800 mb-1">
              Descrição
            </Text>
            <Text className="text-base text-gray-700 leading-relaxed">
              {item.description}
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View
        style={{
          paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
          flex: 1,
        }}
      >
        <Header title="Detalhes" showBackButton={true} />
        {renderContent()}
      </View>
    </SafeAreaView>
  );
}
