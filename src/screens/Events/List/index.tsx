import React, { useLayoutEffect } from "react";
import { View, Text, SafeAreaView, TouchableOpacity } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { useNavigation } from "@react-navigation/native";
import { FontAwesome } from "@expo/vector-icons";
import { AppStackScreenProps } from "@/routes/types";

type Props = AppStackScreenProps<"eventsList">;

export function EventsListScreen({ navigation }: Props) {
  const { user } = useUser();

  const isAdmin = user?.publicMetadata?.role === "admin";

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        isAdmin ? (
          <TouchableOpacity
            onPress={() => navigation.navigate("createEvent")}
            className="mr-4" // Adiciona uma margem à direita
          >
            <FontAwesome name="plus-circle" size={28} color="#fff" />
          </TouchableOpacity>
        ) : null,
    });
  }, [navigation, isAdmin]);

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <View className="flex-1 justify-center items-center p-6">
        <Text className="text-2xl font-bold">Lista de Eventos</Text>
        <Text className="mt-4 text-center">
          Aqui serão listados todos os eventos de ecoturismo e ações ambientais.
        </Text>

        {isAdmin && (
          <View className="mt-8 p-4 bg-green-100 border border-green-300 rounded-lg">
            <Text className="text-green-800 font-bold">
              Modo Administrador Ativado!
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
