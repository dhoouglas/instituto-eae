import React, { useEffect } from "react";
import { View, Text, SafeAreaView } from "react-native";

import { useAuth, useUser } from "@clerk/clerk-expo";

import { Button } from "@/components/Button";
import { Loading } from "@/components/Loading";
import Toast from "react-native-toast-message";

export function Home() {
  const { signOut } = useAuth();

  const { isLoaded: isUserLoaded, user } = useUser();

  useEffect(() => {
    if (isUserLoaded) {
      Toast.show({
        type: "success",
        text1: `Bem-vindo(a) de volta!`,
        text2:
          user?.primaryEmailAddress?.emailAddress ||
          "Explorador(a) da natureza!",
      });
    }
  }, [isUserLoaded]);

  const onSignOutPress = () => {
    signOut();
  };

  if (!isUserLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Loading />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center items-center p-6">
        <Text className="text-4xl font-bold text-green-logo font-[Inter_700Bold]">
          Bem-vindo(a)!
        </Text>

        <Text className="text-lg text-gray-600 mt-4 font-[Inter_400Regular]">
          Você está logado como:
        </Text>
        <Text className="text-lg text-gray-800 font-[Inter_700Bold]">
          {user?.primaryEmailAddress?.emailAddress}
        </Text>

        <View className="w-full mt-10">
          <Button
            title="Sair (Logout)"
            onPress={onSignOutPress}
            className="bg-gray-200 py-5 rounded-xl items-center justify-center"
            textClassName="text-gray-800 font-bold text-lg font-[Inter_700Bold]"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
