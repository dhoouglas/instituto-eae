import React from "react";
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { FontAwesome } from "@expo/vector-icons";
import { AppTabScreenProps } from "@/routes/types";
import Toast from "react-native-toast-message";

const ProfileMenuItem = ({
  icon,
  text,
  onPress,
}: {
  icon: any;
  text: string;
  onPress?: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-row items-center p-4 bg-gray-50 rounded-lg mb-3"
    activeOpacity={0.7}
  >
    <FontAwesome name={icon} size={20} color="#555" />
    <Text className="text-lg text-gray-700 ml-4 font-[Inter_400Regular]">
      {text}
    </Text>
    <FontAwesome
      name="chevron-right"
      size={16}
      color="#A1A1AA"
      className="ml-auto"
    />
  </TouchableOpacity>
);

export function Profile({ navigation }: AppTabScreenProps<"profile">) {
  const { user } = useUser();
  const { signOut } = useAuth();

  const isAdmin = user?.publicMetadata?.role === "admin";

  const getInitials = () => {
    const fullName = user?.fullName || "";
    const names = fullName.split(" ");
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return names[0] ? names[0][0].toUpperCase() : "";
  };

  const handleSignOut = async () => {
    try {
      console.log("Tentando encerrar a sessão...");

      await signOut();

      Toast.show({
        type: "info",
        text1: "Você saiu.",
        text2: "Esperamos te ver novamente em breve!",
      });
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      Alert.alert(
        "Erro",
        "Não foi possível encerrar a sessão. Tente novamente."
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView>
        <View className="p-6 m-10">
          <View className="items-center mb-10">
            <TouchableOpacity className="mb-4">
              {user?.hasImage ? (
                <Image
                  source={{ uri: user.imageUrl }}
                  className="w-24 h-24 rounded-full"
                />
              ) : (
                <View className="w-24 h-24 rounded-full bg-green-logo items-center justify-center">
                  <Text className="text-white text-4xl font-bold">
                    {getInitials()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <Text className="text-3xl font-bold text-gray-800 font-[Inter_700Bold]">
              {user?.fullName}
            </Text>
            <Text className="text-lg text-gray-500 mt-1">
              {user?.primaryEmailAddress?.emailAddress}
            </Text>
          </View>

          <View>
            <ProfileMenuItem icon="user-circle" text="Editar Perfil" />
            <ProfileMenuItem icon="shield" text="Segurança e Senha" />
            <ProfileMenuItem icon="bell" text="Notificações" />

            {isAdmin && (
              <View className="mt-6">
                <Text className="text-sm font-bold text-gray-400 uppercase mb-2 px-2">
                  Administração
                </Text>
                <ProfileMenuItem icon="cogs" text="Painel do Administrador" />
              </View>
            )}
          </View>

          <View className="mt-10">
            <TouchableOpacity
              onPress={handleSignOut}
              className="flex-row items-center justify-center p-4 bg-red-50 rounded-lg"
              activeOpacity={0.7}
            >
              <FontAwesome name="sign-out" size={22} color="#EF4444" />
              <Text className="text-lg text-red-500 font-bold ml-3">
                Sair (Logout)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
