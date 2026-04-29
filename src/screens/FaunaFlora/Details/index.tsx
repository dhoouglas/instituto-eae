import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  SafeAreaView,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { useFocusEffect, useRoute, useNavigation, useIsFocused } from "@react-navigation/native";
import { RouteProp } from "@react-navigation/native";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import Toast from "react-native-toast-message";
import PagerView from "react-native-pager-view";
import { FontAwesome } from "@expo/vector-icons";

import { FaunaFloraStackParamList } from "@/routes/types";
import api from "@/lib/api";
import { Button } from "@/components/Button";
import { Loading } from "@/components/Loading";

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

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export function FaunaFloraDetailsScreen() {
  const route = useRoute<FaunaFloraDetailsRouteProp>();
  const navigation = useNavigation();
  const { faunaFloraId, type } = route.params;

  const [item, setItem] = useState<FaunaFloraItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(0);

  const isFocused = useIsFocused();

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
      return <Loading fullScreen />;
    }

    if (fetchError || !item) {
      return (
        <View className="flex-1 justify-center items-center p-6 bg-white">
          <FontAwesome name="leaf" size={48} color="#D1D5DB" />
          <Text className="text-xl font-[Inter_700Bold] text-gray-800 mt-4 text-center">
            {fetchError || "Espécie não encontrada."}
          </Text>
          <Button title="Voltar" onPress={() => navigation.goBack()} className="mt-6 bg-green-700 w-full" />
        </View>
      );
    }

    const getStatusConfig = (status: string) => {
      switch (status) {
        case "AMEACADA":
          return { color: "text-red-800", bg: "bg-red-100", icon: "warning" };
        case "EXTINTA":
          return { color: "text-gray-900", bg: "bg-gray-800", icon: "times-circle" };
        default:
          return { color: "text-green-800", bg: "bg-green-100", icon: "check-circle" };
      }
    };

    const statusConfig = getStatusConfig(item.conservationStatus);

    return (
      <ScrollView showsVerticalScrollIndicator={false} bounces={false} className="bg-white">
        <View style={{ height: screenHeight * 0.45 }}>
          {item.imageUrls && item.imageUrls.length > 0 ? (
            <View style={{ flex: 1 }}>
              <PagerView
                style={{ flex: 1 }}
                initialPage={0}
                onPageSelected={(e) => setCurrentPage(e.nativeEvent.position)}
              >
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
              {item.imageUrls.length > 1 && (
                <View className="absolute bottom-8 left-0 right-0 flex-row justify-center items-center gap-2.5 z-10">
                  {item.imageUrls.map((_, index) => (
                    <View
                      key={index}
                      className="rounded-full bg-white"
                      style={{
                        height: 8,
                        width: currentPage === index ? 32 : 8,
                        opacity: currentPage === index ? 1 : 0.6,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.5,
                        shadowRadius: 3,
                        elevation: 5,
                      }}
                    />
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View className="w-full h-full bg-green-50 items-center justify-center pt-10">
              <FontAwesome name="leaf" size={60} color="#166534" opacity={0.4} />
            </View>
          )}
          <View className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 to-transparent" pointerEvents="none" />
        </View>

        <View className="bg-white -mt-8 rounded-t-[32px] pt-8 px-6 pb-20">
          <View className="flex-row items-center mb-4">
            <View className="bg-green-100 px-3 py-1.5 rounded-full mr-3">
              <Text className="text-xs font-[Inter_800ExtraBold] text-green-800 uppercase tracking-wider">
                {item.type?.toUpperCase() === "FAUNA" ? "Fauna" : "Flora"}
              </Text>
            </View>
          </View>

          <Text className="text-3xl font-[Inter_800ExtraBold] text-gray-900 leading-tight">
            {item.name}
          </Text>
          <Text className="text-lg font-[Inter_500Medium] italic text-gray-500 mt-1 mb-6">
            {item.scientificName}
          </Text>

          <View className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-6">
            {item.type === "FAUNA" ? (
              <>
                <View className="flex-row items-center mb-4">
                  <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-3">
                    <FontAwesome name="map-o" size={18} color="#166534" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-gray-500 font-[Inter_600SemiBold] uppercase tracking-wider mb-0.5">
                      Habitat
                    </Text>
                    <Text className="text-base text-gray-800 font-[Inter_600SemiBold]">
                      {item.habitat || "Não informado"}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center">
                  <View className={`w-10 h-10 ${statusConfig.bg} rounded-full items-center justify-center mr-3`}>
                    <FontAwesome name={statusConfig.icon as any} size={18} color={statusConfig.color.includes('red') ? '#991B1B' : statusConfig.color.includes('green') ? '#166534' : '#FFFFFF'} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-gray-500 font-[Inter_600SemiBold] uppercase tracking-wider mb-0.5">
                      Conservação
                    </Text>
                    <Text className={`text-base font-[Inter_700Bold] ${statusConfig.color}`}>
                      {item.conservationStatus?.replace("_", " ")}
                    </Text>
                  </View>
                </View>
              </>
            ) : (
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-3">
                  <FontAwesome name="sitemap" size={18} color="#166534" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 font-[Inter_600SemiBold] uppercase tracking-wider mb-0.5">
                    Família
                  </Text>
                  <Text className="text-base text-gray-800 font-[Inter_600SemiBold]">
                    {item.family || "Não informada"}
                  </Text>
                </View>
              </View>
            )}
          </View>

          <View className="w-12 h-1.5 bg-green-600 rounded-full mb-6" />

          <Text className="text-2xl font-[Inter_800ExtraBold] text-gray-900 mb-3">
            Sobre a Espécie
          </Text>
          <Text className="text-[17px] text-gray-700 leading-relaxed font-[Inter_400Regular] mb-8">
            {item.description}
          </Text>
        </View>
      </ScrollView>
    );
  };

  return (
    <View className="flex-1 bg-white">
      {/* StatusBar scoped to this screen via isFocused — auto-restores when navigating back */}
      {isFocused && (
        <ExpoStatusBar
          style={isLoading || !item?.imageUrls?.length ? "dark" : "light"}
          translucent
        />
      )}

      {renderContent()}

      <SafeAreaView className="absolute top-0 left-0 w-full" pointerEvents="box-none">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="ml-4 mt-2 w-10 h-10 rounded-full items-center justify-center bg-white/30 backdrop-blur-md border border-white/40"
          style={{
            marginTop: Platform.OS === "android" ? (StatusBar.currentHeight || 24) + 10 : 10,
          }}
        >
          <FontAwesome name="angle-left" size={24} color={isLoading || !item?.imageUrls?.length ? "#374151" : "white"} style={{ marginRight: 2 }} />
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}
