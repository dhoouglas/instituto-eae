import React, { useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { AppScreenProps } from "@/routes/app.routes";

import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import SocialAuthButtons from "@/components/SocialAuthButtons";

import { useSignIn } from "@clerk/clerk-expo";
import { handleClerkError } from "@/utils/errors/clerkErrorHandler";
import { useSocialAuth } from "@/hooks/useSocialAuth";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

export function Login({ navigation }: AppScreenProps<"login">) {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { handleSocialPress } = useSocialAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const [view, setView] = useState<"sign-in" | "forgot-password">("sign-in");

  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const onRequestReset = async () => {
    if (!isLoaded) return;
    setIsLoading(true);
    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });
      Alert.alert(
        "Verifique seu E-mail",
        "Enviamos um código de verificação para o seu e-mail."
      );
    } catch (err: any) {
      const errorMessage = handleClerkError(err);
      Alert.alert("Erro", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  const onResetPassword = async () => {
    if (!isLoaded) return;
    setIsLoading(true);
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
        password: newPassword,
      });

      await setActive({ session: result.createdSessionId });
      Alert.alert("Sucesso!", "Sua senha foi alterada.");
    } catch (err: any) {
      const errorMessage = handleClerkError(err);
      Alert.alert("Erro na Redefinição", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

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
      <KeyboardAwareScrollView
        resetScrollToCoords={{ x: 0, y: 0 }}
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="p-8">
          {view === "sign-in" && (
            <>
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

              {/* O link agora muda a 'view' da tela */}
              <TouchableOpacity
                className="self-end my-5"
                onPress={() => setView("forgot-password")}
              >
                <Text className="text-green-logo font-semibold font-regular">
                  Esqueceu sua senha?
                </Text>
              </TouchableOpacity>

              <Button
                title="Entrar"
                onPress={onSignInPress}
                isLoading={isLoading}
                className="bg-green-logo py-5 rounded-xl items-center justify-center"
                textClassName="text-white font-bold text-lg"
                hasShadow={true}
                shadowColor="#2A9D8F"
              />
              <TouchableOpacity
                className="mt-6"
                onPress={() => navigation.navigate("register")}
              >
                <Text className="text-black text-center font-semibold font-regular">
                  Criar uma nova conta
                </Text>
              </TouchableOpacity>
              <SocialAuthButtons onPress={handleSocialPress} />
            </>
          )}

          {view === "forgot-password" && (
            <>
              <Text className="text-5xl font-bold text-green-logo mb-2">
                Redefinir Senha
              </Text>
              <Text className="text-xl text-gray-600 mb-10 font-regular]">
                Digite seu e-mail para receber um código de verificação.
              </Text>

              <Input
                isFocused={focusedInput === "email-reset"}
                onFocus={() => setFocusedInput("email-reset")}
                onBlur={() => setFocusedInput(null)}
                placeholder="Seu e-mail"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Button
                title="Enviar Código"
                onPress={onRequestReset}
                isLoading={isLoading}
                className="mt-4 bg-green-logo py-5 rounded-xl items-center justify-center"
                textClassName="text-white font-bold text-lg"
              />

              <View className="w-full h-px bg-gray-200 my-8" />

              <Input
                isFocused={focusedInput === "code"}
                onFocus={() => setFocusedInput("code")}
                onBlur={() => setFocusedInput(null)}
                placeholder="Código de verificação"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
              />
              <Input
                isFocused={focusedInput === "new-password"}
                onFocus={() => setFocusedInput("new-password")}
                onBlur={() => setFocusedInput(null)}
                className="mt-4"
                placeholder="Sua nova senha"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
              <Button
                title="Salvar Nova Senha"
                onPress={onResetPassword}
                isLoading={isLoading}
                className="mt-4 bg-green-logo py-5 rounded-xl items-center justify-center"
                textClassName="text-white font-bold text-lg"
                hasShadow
                shadowColor="#2A9D8F"
              />

              <TouchableOpacity
                className="mt-8"
                onPress={() => setView("sign-in")}
              >
                <Text className="text-black text-center font-semibold font-regular">
                  Voltar para o Login
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
