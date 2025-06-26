import { AppStackScreenProps } from "@/routes/types";
import React from "react";
import { View, Text, SafeAreaView, ImageBackground } from "react-native";

import LogoWelcome from "@/assets/environment01.svg";
import { Button } from "@/components/Button";

export function Welcome({ navigation }: AppStackScreenProps<"welcome">) {
  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* 2. View principal ImageBackground */}
      <ImageBackground
        source={require("@/assets/bg.png")}
        className="flex-1"
        resizeMode="cover"
      >
        {/* 3. Adiciona uma View para o OVERLAY (sobreposição) */}
        {/* <View className="absolute top-0 left-0 right-0 bottom-0 bg-black/10" /> */}

        <View className="flex-1 justify-around items-center -mt-4 p-6">
          {/* Bloco 1: Logo e Ilustração */}
          <View className="items-center">
            <LogoWelcome height={320} width={320} />
          </View>

          {/* Bloco 2: Textos */}
          <View className="w-full items-center -mt-20">
            <Text className="font-bold text-4xl text-center text-green-logo">
              Seja Bem vindo
            </Text>

            <Text className="text-base text-center text-gray-600 mt-4">
              Instituto EAE - Educação Ambiental e Ecoturismo
            </Text>

            <Text className="text-base text-center text-gray-600 mt-2 -mb-4">
              Promovemos a preservação do meio ambiente, do patrimônio cultural
              e natural.
            </Text>
          </View>

          {/* Bloco 3: Botões */}
          <View className="w-full">
            <Button
              title="Login"
              onPress={() => navigation.navigate("login")}
              className="bg-green-logo py-5 rounded-xl items-center justify-center"
              textClassName="text-white font-bold text-lg font-[Inter_700Bold]"
              hasShadow={true}
            />
            <Button
              title="Cadastrar"
              onPress={() => navigation.navigate("register")}
              className="py-5 items-center justify-center mt-3"
              textClassName="text-green-logo font-bold text-lg font-[Inter_700Bold]"
            />
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}
