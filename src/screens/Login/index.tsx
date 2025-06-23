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

import { useSignIn } from "@clerk/clerk-expo";
import { handleClerkError } from "@/utils/errors/clerkErrorHandler";

import { useSocialAuth } from "@/hooks/useSocialAuth";

export function Login({ navigation }: AppScreenProps<"login">) {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { handleSocialPress } = useSocialAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<"email" | "password" | null>(
    null
  );

  const onSignInPress = async () => {
    if (!isLoaded) return;
    setIsLoading(true);
    try {
      const completeSignIn = await signIn.create({
        identifier: email,
        password,
      });
      await setActive({ session: completeSignIn.createdSessionId });
    } catch (err: any) {
      const errorMessage = handleClerkError(err);
      Alert.alert("Erro no Login", errorMessage);
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
            <Text className="text-5xl font-bold text-green-logo mb-2 font-[Inter_700Bold]">
              Entrar
            </Text>
            <Text className="text-xl text-gray-600 mb-10 font-[Inter_400Regular]">
              Que bom te ver de volta, explorador(a)!
            </Text>

            <Input
              isFocused={focusedInput === "email"}
              onFocus={() => setFocusedInput("email")}
              onBlur={() => setFocusedInput(null)}
              placeholder="Seu e-mail"
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
              placeholder="Sua senha"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity className="self-end my-5">
              <Text className="text-green-logo font-semibold font-regular">
                Esqueceu sua senha?
              </Text>
            </TouchableOpacity>
            <Button
              title="Entrar"
              onPress={onSignInPress}
              isLoading={isLoading}
              className="bg-green-logo py-5 rounded-xl items-center justify-center"
              textClassName="text-white font-bold text-lg font-[Inter_700Bold]"
              hasShadow={true}
              shadowColor="#2A9D8F"
            />
            <TouchableOpacity
              className="mt-6"
              onPress={() => navigation.navigate("register")}
            >
              <Text className="text-black text-center font-semibold font-font-regular">
                Criar uma nova conta
              </Text>
            </TouchableOpacity>

            <SocialAuthButtons onPress={handleSocialPress} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
