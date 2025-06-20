import React, { useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { AppScreenProps } from "@/routes/app.routes";

// Nossos componentes reutilizáveis em ação!
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import SocialAuthButtons from "@/components/SocialAuthButtons";

export function Register({ navigation }: AppScreenProps<"register">) {
  // Estados para os três campos de texto
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Estado para controlar o foco dos inputs
  const [focusedInput, setFocusedInput] = useState<
    "email" | "password" | "confirm" | null
  >(null);

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
            {/* Título e Subtítulo com a temática do app */}
            <Text className="text-5xl font-bold text-green-logo mb-2">
              Criar Conta
            </Text>
            <Text className="text-xl text-gray-600 mb-10 font-regular">
              Junte-se à nossa comunidade de exploradores da natureza.
            </Text>

            {/* Campos de Entrada reutilizando o componente Input */}
            <Input
              isFocused={focusedInput === "email"}
              onFocus={() => setFocusedInput("email")}
              onBlur={() => setFocusedInput(null)}
              placeholder="Seu melhor e-mail"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
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

            {/* Terceiro campo de input adicionado */}
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

            {/* Botão de Cadastrar reutilizável */}
            <View className="mt-8">
              <Button
                title="Cadastrar"
                // Simula o cadastro e leva para a tela principal
                onPress={() => navigation.navigate("home")}
                hasShadow={true}
                shadowColor="#2A9D8F" // Coloque a cor do seu 'green-logo'
                className="bg-green-logo py-5 rounded-xl items-center justify-center"
                textClassName="text-white font-bold text-lg"
              />
            </View>

            {/* Link para voltar à tela de Login */}
            <TouchableOpacity
              className="mt-6"
              onPress={() => navigation.navigate("login")}
            >
              <Text className="text-black text-center font-semibold font-regular">
                Já possui uma conta?
              </Text>
            </TouchableOpacity>

            <SocialAuthButtons />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
