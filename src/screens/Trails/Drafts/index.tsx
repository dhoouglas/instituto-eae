import React from "react";
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Platform,
  StatusBar,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Header } from "@/components/Header";
import { TrailStackScreenProps } from "@/routes/types";

// Mock data for drafts
const mockDrafts = [
  {
    id: "draft-1",
    createdAt: new Date(),
    pointCount: 15,
  },
  {
    id: "draft-2",
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
    pointCount: 42,
  },
];

type Draft = (typeof mockDrafts)[0];

export function DraftListScreen() {
  const navigation =
    useNavigation<TrailStackScreenProps<"DraftList">["navigation"]>();

  const renderItem = ({ item }: { item: Draft }) => (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate("TrailForm", {
          /* we would pass the draft coordinates here */
        })
      }
      className="bg-white p-4 rounded-lg shadow mb-4"
    >
      <Text className="font-bold text-lg">
        Rascunho de {item.createdAt.toLocaleDateString("pt-BR")}
      </Text>
      <Text className="text-gray-600 mt-1">
        {item.pointCount} pontos gravados
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View
        style={{
          paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
          flex: 1,
        }}
      >
        <Header title="Rascunhos de Trilhas" showBackButton={true} />
        <FlatList
          data={mockDrafts}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 24 }}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center">
              <Text className="text-gray-500 text-center">
                Nenhum rascunho encontrado. Grave uma trilha para começar.
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}
