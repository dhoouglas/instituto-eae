import React, { useState, useCallback, useEffect } from "react";
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
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  RouteProp,
} from "@react-navigation/native";
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

type FaunaFloraListRouteProp = RouteProp<
  FaunaFloraStackParamList,
  "faunaFloraList"
>;

type FilterType = "ALL" | "FAUNA" | "FLORA";

type FilterSwitchProps = {
  filter: FilterType;
  setFilter: (filter: FilterType) => void;
};

const FilterSwitch = ({ filter, setFilter }: FilterSwitchProps) => (
  <View className="flex-row justify-center items-center bg-gray-100 rounded-full p-1.5 mb-6 mx-5 border border-gray-200/60">
    <TouchableOpacity
      onPress={() => setFilter("ALL")}
      activeOpacity={0.7}
      className={`flex-1 items-center py-2.5 rounded-full ${filter === "ALL" ? "bg-green-700" : "border border-transparent"
        }`}
    >
      <Text
        className={`text-[13px] font-[Inter_700Bold] uppercase tracking-wider ${filter === "ALL" ? "text-white" : "text-gray-500"
          }`}
      >
        Todos
      </Text>
    </TouchableOpacity>
    <TouchableOpacity
      onPress={() => setFilter("FAUNA")}
      activeOpacity={0.7}
      className={`flex-1 items-center py-2.5 rounded-full ${filter === "FAUNA" ? "bg-green-700" : "border border-transparent"
        }`}
    >
      <Text
        className={`text-[13px] font-[Inter_700Bold] uppercase tracking-wider ${filter === "FAUNA" ? "text-white" : "text-gray-500"
          }`}
      >
        Fauna
      </Text>
    </TouchableOpacity>
    <TouchableOpacity
      onPress={() => setFilter("FLORA")}
      activeOpacity={0.7}
      className={`flex-1 items-center py-2.5 rounded-full ${filter === "FLORA" ? "bg-green-700" : "border border-transparent"
        }`}
    >
      <Text
        className={`text-[13px] font-[Inter_700Bold] uppercase tracking-wider ${filter === "FLORA" ? "text-white" : "text-gray-500"
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
    className="bg-white rounded-3xl mb-5 border border-gray-100 overflow-hidden mx-5"
    style={{ elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 }}
  >
    {item.imageUrls && item.imageUrls.length > 0 ? (
      <Image
        source={{ uri: item.imageUrls[0] }}
        className="w-full h-48"
        resizeMode="cover"
      />
    ) : (
      <View className="w-full h-48 bg-green-50 items-center justify-center">
        <FontAwesome name="leaf" size={40} color="#166534" opacity={0.3} />
      </View>
    )}
    <View className="p-5">
      <View className="flex-row justify-between items-start mb-2">
        <View className="bg-green-100 px-3 py-1.5 rounded-full">
          <Text className="text-[10px] font-[Inter_800ExtraBold] text-green-800 uppercase tracking-wider">
            {item.type?.toUpperCase() === "FAUNA" ? "Fauna" : "Flora"}
          </Text>
        </View>
      </View>
      <Text className="text-xl font-[Inter_800ExtraBold] text-gray-900 leading-tight" numberOfLines={2}>
        {item.name}
      </Text>
      <View className="flex-row items-center mt-3">
        <Text className="text-sm font-[Inter_600SemiBold] text-green-700">Ver detalhes</Text>
        <FontAwesome name="angle-right" size={14} color="#15803D" style={{ marginLeft: 4, marginTop: 2 }} />
      </View>
    </View>
    {isAdmin && (
      <View className="absolute top-4 right-4 flex-row gap-2 z-10">
        <TouchableOpacity
          onPress={onEdit}
          className="bg-white/90 w-10 h-10 rounded-full items-center justify-center"
          style={{ elevation: 3 }}
        >
          <FontAwesome name="pencil" size={16} color="#374151" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onDelete}
          className="bg-white/90 w-10 h-10 rounded-full items-center justify-center"
          style={{ elevation: 3 }}
        >
          <FontAwesome name="trash" size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>
    )}
  </TouchableOpacity>
);

export function FaunaFloraListScreen() {
  const navigation = useNavigation<FaunaFloraNavigationProp>();
  const route = useRoute<FaunaFloraListRouteProp>();
  const { user } = useUser();
  const { getToken } = useAuth();
  const isAdmin = user?.publicMetadata?.role === "admin";

  const [items, setItems] = useState<FaunaFloraPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>(
    (route.params?.type === "FAUNA" || route.params?.type === "FLORA") ? route.params.type : "ALL"
  );

  useEffect(() => {
    const t = route.params?.type;
    setFilter((t === "FAUNA" || t === "FLORA") ? t : "ALL");
  }, [route.params?.type]);

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
            paddingTop: 10,
            paddingBottom: 100,
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
            className="absolute bottom-8 right-6 bg-green-700 h-14 rounded-full flex-row items-center justify-center px-6"
            style={{ elevation: 5, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 }}
            activeOpacity={0.8}
          >
            <FontAwesome name="plus" size={16} color="white" />
            <Text className="text-white font-[Inter_700Bold] ml-2">Nova Espécie</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
