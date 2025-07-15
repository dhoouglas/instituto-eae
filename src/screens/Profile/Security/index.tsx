import React, { useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
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
import {
  changePasswordSchema,
  createPasswordSchema,
} from "@/utils/schemas/authSchemas";
import { z } from "zod";

export function Security({ navigation }: ProfileStackScreenProps<"security">) {
  const { user } = useUser();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const hasPassword = user?.passwordEnabled;

  const handleUpdatePassword = async () => {
    setIsLoading(true);
    try {
      const schema = hasPassword ? changePasswordSchema : createPasswordSchema;
      const data = hasPassword
        ? { currentPassword, newPassword, confirmPassword }
        : { newPassword, confirmPassword };

      schema.parse(data);

      if (hasPassword) {
        await user?.updatePassword({
          currentPassword,
          newPassword,
        });
      } else {
        const params: any = { password: newPassword };
        await user?.update(params);
      }

      Toast.show({
        type: "success",
        text1: "Sucesso!",
        text2: `Sua senha foi ${
          hasPassword ? "alterada" : "cadastrada"
        } com sucesso.`,
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
        console.error("Erro ao atualizar senha:", error);
        Toast.show({
          type: "error",
          text1: "Erro ao Atualizar",
          text2: "Ocorreu um erro. Verifique os dados e tente novamente.",
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
          <Header title="Segurança e Senha" showBackButton />

          <View className="bg-white p-6 rounded-xl shadow-sm">
            {!hasPassword && (
              <View className="items-center text-center p-4 bg-blue-50 rounded-lg mb-6">
                <Feather name="info" size={24} color="#3B82F6" />
                <Text className="text-blue-800 text-center mt-2">
                  Você fez login com uma conta social. Cadastre uma senha para
                  ter outra opção de acesso.
                </Text>
              </View>
            )}

            {hasPassword && (
              <>
                <Text className="text-lg font-semibold text-gray-600 mb-1">
                  Senha Atual
                </Text>
                <Input
                  isFocused={focusedInput === "currentPassword"}
                  onFocus={() => setFocusedInput("currentPassword")}
                  onBlur={() => setFocusedInput(null)}
                  placeholder="Sua senha atual"
                  secureTextEntry
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  className="mb-4"
                />
              </>
            )}

            <Text className="text-lg font-semibold text-gray-600 mb-1">
              Nova Senha
            </Text>
            <Input
              isFocused={focusedInput === "newPassword"}
              onFocus={() => setFocusedInput("newPassword")}
              onBlur={() => setFocusedInput(null)}
              placeholder="Mínimo 8 caracteres"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              className="mb-4"
            />
            <Text className="text-lg font-semibold text-gray-600 mb-1">
              Confirmar Nova Senha
            </Text>
            <Input
              isFocused={focusedInput === "confirmPassword"}
              onFocus={() => setFocusedInput("confirmPassword")}
              onBlur={() => setFocusedInput(null)}
              placeholder="Repita a nova senha"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <Button
              title={hasPassword ? "Alterar Senha" : "Cadastrar Senha"}
              onPress={handleUpdatePassword}
              isLoading={isLoading}
              className="bg-green-logo py-4 rounded-xl items-center justify-center mt-8"
              textClassName="text-white font-bold text-lg"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
