import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
  ListRenderItem,
  Alert,
  Platform,
  StatusBar,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useUser, useAuth } from "@clerk/clerk-expo";
import { FontAwesome } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { isAxiosError } from "axios";

import { Header } from "@/components/Header";
import { FaunaFloraStackParamList } from "@/routes/types";
import api from "@/lib/api";
import { Button } from "@/components/Button";
import { StackNavigationProp } from "@react-navigation/stack";

type FaunaFloraPost = {
  id: string;
  name: string;
  type: "FAUNA" | "FLORA";
  imageUrls: string[];
};

type FaunaFloraNavigationProp = StackNavigationProp<
  FaunaFloraStackParamList,
  "faunaFloraList"
>;

type FilterType = "ALL" | "FAUNA" | "FLORA";

type FilterSwitchProps = {
  filter: FilterType;
  setFilter: (filter: FilterType) => void;
};

const FilterSwitch = ({ filter, setFilter }: FilterSwitchProps) => (
  <View className="flex-row justify-center items-center bg-gray-200 rounded-full p-1 mb-4">
    <TouchableOpacity
      onPress={() => setFilter("ALL")}
      className={`px-4 py-2 rounded-full ${
        filter === "ALL" ? "bg-green-logo" : ""
      }`}
    >
      <Text
        className={`font-bold ${
          filter === "ALL" ? "text-white" : "text-gray-600"
        }`}
      >
        Todos
      </Text>
    </TouchableOpacity>
    <TouchableOpacity
      onPress={() => setFilter("FAUNA")}
      className={`px-4 py-2 rounded-full ${
        filter === "FAUNA" ? "bg-green-logo" : ""
      }`}
    >
      <Text
        className={`font-bold ${
          filter === "FAUNA" ? "text-white" : "text-gray-600"
        }`}
      >
        Fauna
      </Text>
    </TouchableOpacity>
    <TouchableOpacity
      onPress={() => setFilter("FLORA")}
      className={`px-4 py-2 rounded-full ${
        filter === "FLORA" ? "bg-green-logo" : ""
      }`}
    >
      <Text
        className={`font-bold ${
          filter === "FLORA" ? "text-white" : "text-gray-600"
        }`}
      >
        Flora
      </Text>
    </TouchableOpacity>
  </View>
);

type FaunaFloraCardProps = {
  item: FaunaFloraPost;
  isAdmin: boolean;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

const FaunaFloraCard = ({
  item,
  isAdmin,
  onEdit,
  onDelete,
  onPress,
}: FaunaFloraCardProps) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden border border-gray-100"
  >
    {item.imageUrls && item.imageUrls.length > 0 ? (
      <Image
        source={{ uri: item.imageUrls[0] }}
        className="w-full h-40"
        resizeMode="cover"
      />
    ) : (
      <View className="w-full h-40 bg-gray-200 items-center justify-center">
        <FontAwesome name="image" size={40} color="#9CA3AF" />
      </View>
    )}
    <View className="p-4">
      <Text className="text-xs font-bold text-green-logo uppercase">
        {item.type?.toUpperCase() === "FAUNA" ? "Fauna" : "Flora"}
      </Text>
      <Text className="text-lg font-bold text-gray-800 mt-1" numberOfLines={2}>
        {item.name}
      </Text>
    </View>
    {isAdmin && (
      <View className="absolute bottom-3 right-3 flex-row gap-1 z-10">
        <TouchableOpacity
          onPress={onEdit}
          className="bg-green-800/80 w-8 h-8 rounded-lg items-center justify-center shadow"
        >
          <FontAwesome name="pencil" size={16} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onDelete}
          className="bg-green-800/80 w-8 h-8 rounded-lg items-center justify-center shadow"
        >
          <FontAwesome name="trash" size={16} color="white" />
        </TouchableOpacity>
      </View>
    )}
  </TouchableOpacity>
);

export function FaunaFloraListScreen() {
  const navigation = useNavigation<FaunaFloraNavigationProp>();
  const { user } = useUser();
  const { getToken } = useAuth();
  const isAdmin = user?.publicMetadata?.role === "admin";

  const [items, setItems] = useState<FaunaFloraPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("ALL");

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      let fetchedItems: FaunaFloraPost[] = [];
      if (filter === "ALL") {
        const [faunaResponse, floraResponse] = await Promise.all([
          api.get("/fauna").catch((err) => {
            if (isAxiosError(err) && err.response?.status === 404)
              return { data: [] }; // Retorna array vazio em caso de 404
            throw err;
          }),
          api.get("/flora").catch((err) => {
            if (isAxiosError(err) && err.response?.status === 404)
              return { data: [] }; // Retorna array vazio em caso de 404
            throw err;
          }),
        ]);

        const faunaItems = (
          faunaResponse.data.items ||
          faunaResponse.data ||
          []
        ).map((item: FaunaFloraPost) => ({ ...item, type: "FAUNA" }));
        const floraItems = (
          floraResponse.data.items ||
          floraResponse.data ||
          []
        ).map((item: FaunaFloraPost) => ({ ...item, type: "FLORA" }));

        fetchedItems = [...faunaItems, ...floraItems];
      } else {
        const endpoint = filter === "FAUNA" ? "/fauna" : "/flora";
        const response = await api.get(endpoint);
        fetchedItems = (response.data.items || response.data || []).map(
          (item: FaunaFloraPost) => ({
            ...item,
            type: filter === "FAUNA" ? "FAUNA" : "FLORA",
          })
        );
      }
      setItems(fetchedItems);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) {
        setItems([]);
      } else {
        const errorMessage = "Não foi possível carregar os itens.";
        setFetchError(errorMessage);
        Toast.show({ type: "error", text1: errorMessage });
      }
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useFocusEffect(
    useCallback(() => {
      fetchItems();
    }, [fetchItems])
  );

  const handleDelete = async (itemToDelete: FaunaFloraPost) => {
    try {
      const token = await getToken({ template: "api-testing-token" });
      const endpoint =
        itemToDelete.type === "FAUNA"
          ? `/fauna/${itemToDelete.id}`
          : `/flora/${itemToDelete.id}`;

      await api.delete(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Toast.show({
        type: "success",
        text1: "Item excluído com sucesso!",
      });
      setItems((prevItems) =>
        prevItems.filter((item) => item.id !== itemToDelete.id)
      );
    } catch (error) {
      Toast.show({ type: "error", text1: "Erro ao excluir o item." });
    }
  };

  const confirmDelete = (item: FaunaFloraPost) => {
    Alert.alert("Confirmar Exclusão", "Tem certeza?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Deletar",
        style: "destructive",
        onPress: () => handleDelete(item),
      },
    ]);
  };

  const renderItem: ListRenderItem<FaunaFloraPost> = ({ item }) => (
    <FaunaFloraCard
      item={item}
      isAdmin={isAdmin}
      onPress={() =>
        navigation.navigate("faunaFloraDetails", {
          faunaFloraId: item.id,
          type: item.type,
        })
      }
      onEdit={() =>
        navigation.navigate("editFaunaFlora", {
          faunaFloraId: item.id,
          type: item.type,
        })
      }
      onDelete={() => confirmDelete(item)}
    />
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View
        style={{
          paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
          flex: 1,
        }}
      >
        <Header title="Fauna & Flora" showBackButton={true} />

        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <FilterSwitch filter={filter} setFilter={setFilter} />
          }
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: 6,
            paddingHorizontal: 24,
            paddingBottom: 90,
          }}
          refreshing={isLoading}
          onRefresh={fetchItems}
          ListEmptyComponent={
            !isLoading ? (
              <View className="flex-1 justify-center items-center">
                <Text className="text-gray-500">Nenhum item encontrado.</Text>
              </View>
            ) : null
          }
        />

        {isAdmin && (
          <TouchableOpacity
            onPress={() => navigation.navigate("createFaunaFlora")}
            className="absolute bottom-8 right-6 bg-green-logo w-16 h-16 rounded-full items-center justify-center shadow-lg"
            activeOpacity={0.8}
          >
            <FontAwesome name="plus" size={24} color="white" />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
