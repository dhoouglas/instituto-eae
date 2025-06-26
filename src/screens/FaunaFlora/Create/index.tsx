import React, { useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";

import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { createFaunaFloraSchema } from "@/utils/schemas/faunaFloraSchemas";

export function CreateFaunaFloraScreen() {
  const navigation = useNavigation();

  const [isLoading, setIsLoading] = useState(false);
  const [popularName, setPopularName] = useState("");
  const [scientificName, setScientificName] = useState("");
  const [type, setType] = useState<"fauna" | "flora" | null>(null);
  const [description, setDescription] = useState("");

  async function handleCreateFaunaFlora() {
    setIsLoading(true);

    const validation = createFaunaFloraSchema.safeParse({
      popularName,
      scientificName,
      type,
      description,
    });
    if (!validation.success) {
      Toast.show({
        type: "error",
        text1: "Dados Inválidos",
        text2: validation.error.errors[0].message,
      });
      setIsLoading(false);
      return;
    }

    try {
      // Simula uma chamada de API
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Exemplo: await api.post('/fauna-flora', validation.data);

      Toast.show({
        type: "success",
        text1: "Sucesso!",
        text2: "Novo item catalogado com sucesso.",
      });

      navigation.goBack();
    } catch (error) {
      console.error("Erro ao criar item:", error);
      Toast.show({
        type: "error",
        text1: "Erro ao Salvar",
        text2: "Não foi possível catalogar o item. Tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAwareScrollView>
        <View className="p-6">
          <Text className="text-2xl font-bold text-gray-800 font-[Inter_700Bold]">
            Catalogar Nova Espécie
          </Text>
          <Text className="text-base text-gray-500 mt-1 mb-6">
            Preencha os detalhes abaixo para adicionar um novo item ao catálogo.
          </Text>

          <Input
            placeholder="Nome Popular"
            value={popularName}
            onChangeText={setPopularName}
            className="mb-4"
          />
          <Input
            placeholder="Nome Científico"
            value={scientificName}
            onChangeText={setScientificName}
            className="mb-4"
          />

          <Text className="text-sm font-semibold text-gray-600 mb-2 ml-1">
            Tipo
          </Text>
          <View className="flex-row gap-4 mb-4">
            <TouchableOpacity
              onPress={() => setType("fauna")}
              className={`flex-1 py-3 rounded-lg border-2 ${type === "fauna" ? "bg-green-logo border-green-logo" : "border-gray-300"}`}
            >
              <Text
                className={`text-center font-bold ${type === "fauna" ? "text-white" : "text-gray-600"}`}
              >
                Fauna
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setType("flora")}
              className={`flex-1 py-3 rounded-lg border-2 ${type === "flora" ? "bg-green-logo border-green-logo" : "border-gray-300"}`}
            >
              <Text
                className={`text-center font-bold ${type === "flora" ? "text-white" : "text-gray-600"}`}
              >
                Flora
              </Text>
            </TouchableOpacity>
          </View>

          <Text className="text-sm font-semibold text-gray-600 mb-2 ml-1">
            Descrição
          </Text>
          <TextInput
            placeholder="Descreva as características da espécie, habitat, curiosidades..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            className="w-full border border-gray-300 rounded-xl p-5 text-lg font-[Inter_400Regular] h-32"
            textAlignVertical="top"
          />

          <View className="mt-8">
            <Button
              title="Salvar Item"
              onPress={handleCreateFaunaFlora}
              isLoading={isLoading}
              className="bg-green-logo"
              textClassName="text-white text-lg font-bold"
              hasShadow
              shadowColor="#2A9D8F"
            />
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
