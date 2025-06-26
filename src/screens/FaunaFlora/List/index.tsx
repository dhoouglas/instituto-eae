import React, { useLayoutEffect } from "react";
import { View, Text, SafeAreaView, TouchableOpacity } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { AppStackScreenProps } from "@/routes/types";
import { FontAwesome } from "@expo/vector-icons";

type Props = AppStackScreenProps<"faunaFloraList">;

export function FaunaFloraListScreen({ navigation }: Props) {
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === "admin";

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        isAdmin ? (
          <TouchableOpacity
            onPress={() => navigation.navigate("createFaunaFlora")}
            className="mr-4"
          >
            <FontAwesome name="plus-circle" size={28} color="#fff" />
          </TouchableOpacity>
        ) : null,
    });
  }, [navigation, isAdmin]);

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <View className="flex-1 justify-center items-center p-6">
        <Text className="text-2xl font-bold">Fauna & Flora</Text>
        <Text className="mt-4 text-center">
          Aqui serão listadas as espécies de fauna e flora catalogadas.
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
