import React, { useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Alert,
  TouchableOpacity,
  Platform,
  StatusBar,
} from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { ProfileStackScreenProps } from "@/routes/types";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { Feather } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { Header } from "@/components/Header";
import { z } from "zod";
import { updateUserSchema } from "@/utils/schemas/authSchemas";

export function EditProfile({
  navigation,
}: ProfileStackScreenProps<"editProfile">) {
  const { user } = useUser();
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      updateUserSchema.parse({ firstName, lastName });

      await user?.update({
        firstName,
        lastName,
      });

      Toast.show({
        type: "success",
        text1: "Perfil Atualizado!",
        text2: "Suas informações foram salvas com sucesso.",
      });
      navigation.goBack();
    } catch (error) {
      if (error instanceof z.ZodError) {
        Toast.show({
          type: "error",
          text1: "Erro de Validação",
          text2: error.errors[0].message,
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Erro ao Salvar",
          text2: "Não foi possível atualizar seu perfil. Tente novamente.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View
          className="p-6"
          style={{
            paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
            flex: 1,
          }}
        >
          <Header title="Editar Perfil" showBackButton />

          <View className="bg-white p-6 rounded-xl shadow-sm">
            <Text className="text-lg font-semibold text-gray-600 mb-1">
              Nome
            </Text>
            <Input
              isFocused={focusedInput === "firstName"}
              onFocus={() => setFocusedInput("firstName")}
              onBlur={() => setFocusedInput(null)}
              placeholder="Seu nome"
              value={firstName}
              onChangeText={setFirstName}
              className="mb-4"
            />

            <Text className="text-lg font-semibold text-gray-600 mb-1">
              Sobrenome
            </Text>
            <Input
              isFocused={focusedInput === "lastName"}
              onFocus={() => setFocusedInput("lastName")}
              onBlur={() => setFocusedInput(null)}
              placeholder="Seu sobrenome"
              value={lastName}
              onChangeText={setLastName}
              className="mb-6"
            />

            <Text className="text-lg font-semibold text-gray-600 mb-1">
              E-mail
            </Text>
            <Input
              placeholder="Seu e-mail"
              value={user?.primaryEmailAddress?.emailAddress}
              editable={false}
              className="bg-gray-200 text-gray-500"
            />
            <Text className="text-xs text-gray-400 mt-1 px-1">
              O e-mail não pode ser alterado.
            </Text>
          </View>

          <View className="mt-8">
            <Button
              title="Salvar Alterações"
              onPress={handleSave}
              isLoading={isLoading}
              className="bg-green-logo py-4 rounded-xl items-center justify-center"
              textClassName="text-white font-bold text-lg"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
