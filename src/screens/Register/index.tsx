import React, { useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { AppScreenProps } from "@/routes/app.routes";

import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import SocialAuthButtons from "@/components/SocialAuthButtons";

import { useSignUp } from "@clerk/clerk-expo";
import { handleClerkError } from "@/utils/errors/clerkErrorHandler";

import { useSocialAuth } from "@/hooks/useSocialAuth";
import Toast from "react-native-toast-message";

export function Register({ navigation }: AppScreenProps<"register">) {
  const { isLoaded, signUp, setActive } = useSignUp();
  const { handleSocialPress } = useSocialAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<
    "email" | "password" | "confirm" | null
  >(null);

  const onSignUpPress = async () => {
    if (!isLoaded) {
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Erro", "As senhas não coincidem.");
      return;
    }
    setIsLoading(true);

    try {
      const result = await signUp.create({
        emailAddress: email,
        password: password,
      });

      if (result.createdSessionId) {
        await setActive({ session: result.createdSessionId });

        Toast.show({
          type: "success",
          text1: "Cadastro realizado com sucesso! ",
          text2: "Seja bem-vindo(a) de volta. 👋",
        });
      } else {
        // Futuro fluxo de verificação de e-mail pode ser tratado aqui
      }
    } catch (err: any) {
      const errorMessage = handleClerkError(err);
      Alert.alert("Erro no Cadastro", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          showsVerticalScrollIndicator={false}
        >
          <View className="p-8">
            <Text className="text-5xl font-bold text-green-logo mb-2">
              Criar Conta
            </Text>
            <Text className="text-xl text-gray-600 mb-10 font-regular">
              Junte-se à nossa comunidade de exploradores da natureza.
            </Text>

            <Input
              isFocused={focusedInput === "email"}
              onFocus={() => setFocusedInput("email")}
              onBlur={() => setFocusedInput(null)}
              placeholder="Seu melhor e-mail"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input
              isFocused={focusedInput === "password"}
              onFocus={() => setFocusedInput("password")}
              onBlur={() => setFocusedInput(null)}
              className="mt-4"
              placeholder="Crie uma senha segura"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <Input
              isFocused={focusedInput === "confirm"}
              onFocus={() => setFocusedInput("confirm")}
              onBlur={() => setFocusedInput(null)}
              className="mt-4"
              placeholder="Confirme sua senha"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <View className="mt-8">
              <Button
                title="Cadastrar"
                onPress={onSignUpPress}
                isLoading={isLoading}
                hasShadow={true}
                shadowColor="#2A9D8F"
                className="bg-green-logo py-5 rounded-xl items-center justify-center"
                textClassName="text-white font-bold text-lg"
              />
            </View>

            <TouchableOpacity
              className="mt-6"
              onPress={() => navigation.navigate("login")}
            >
              <Text className="text-black text-center font-semibold font-regular">
                Já possui uma conta?
              </Text>
            </TouchableOpacity>

            <SocialAuthButtons onPress={handleSocialPress} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
