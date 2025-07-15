import React from "react";
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ImageBackground,
} from "react-native";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { FontAwesome, Feather } from "@expo/vector-icons";
import { ProfileStackScreenProps, RootParamList } from "@/routes/types";
import Toast from "react-native-toast-message";
import { Clipboard } from "react-native";
import { Loading } from "@/components/Loading";

const ProfileMenuItem = ({
  icon,
  text,
  onPress,
  isLogout = false,
}: {
  icon: any;
  text: string;
  onPress?: () => void;
  isLogout?: boolean;
}) => (
  <TouchableOpacity
    onPress={onPress}
    className={`flex-row items-center p-4 rounded-lg mb-3 ${
      isLogout ? "bg-red-50" : "bg-gray-50"
    }`}
    activeOpacity={0.7}
  >
    {icon}
    <Text
      className={`text-lg ml-4 font-[Inter_500Medium] ${
        isLogout ? "text-red-600" : "text-gray-700"
      }`}
    >
      {text}
    </Text>
    {!isLogout && (
      <FontAwesome
        name="chevron-right"
        size={16}
        color="#A1A1AA"
        className="ml-auto"
      />
    )}
  </TouchableOpacity>
);

export function Profile({
  navigation,
}: ProfileStackScreenProps<"profileMain">) {
  const { user, isLoaded } = useUser();
  const { signOut, getToken } = useAuth();

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

  const handleCopyToken = async () => {
    try {
      const token = await getToken({ template: "api-testing-token" });
      if (token) {
        Clipboard.setString(token);
        Toast.show({
          type: "success",
          text1: "Token Copiado!",
          text2: "O token de sessão foi copiado para a área de transferência.",
        });
      }
    } catch (error) {
      console.error("Erro ao copiar token:", error);
      Toast.show({
        type: "error",
        text1: "Erro ao Copiar",
        text2: "Não foi possível obter o token de sessão.",
      });
    }
  };

  if (!isLoaded) {
    return <Loading />;
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <ScrollView>
        {/* Profile Header */}
        <ImageBackground
          source={require("@/assets/bg.png")}
          className="pt-20 pb-4 px-6 items-center"
        >
          <TouchableOpacity className="mb-4 border-4 border-white rounded-full shadow-lg">
            {user?.hasImage ? (
              <Image
                source={{ uri: user.imageUrl }}
                className="w-28 h-28 rounded-full"
              />
            ) : (
              <View className="w-28 h-28 rounded-full bg-green-logo items-center justify-center">
                <Text className="text-white text-4xl font-bold">
                  {getInitials()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <Text className="text-3xl font-bold text-gray-700 font-[Inter_700Bold] shadow-sm">
            {user?.fullName}
          </Text>
          {user?.username && (
            <Text className="text-xl font-semibold text-gray-500">
              @{user?.username}
            </Text>
          )}
          <Text className="text-lg text-gray-500 mt-1 font-[Inter_400Regular]">
            {user?.primaryEmailAddress?.emailAddress}
          </Text>
        </ImageBackground>

        <View className="p-6">
          {/* Account Settings Section */}
          <View className="mb-8">
            <Text className="text-sm font-bold text-gray-500 uppercase mb-3 px-2">
              Configurações da Conta
            </Text>
            <View className="bg-white rounded-xl p-2 shadow-sm">
              <ProfileMenuItem
                icon={<Feather name="user" size={20} color="#555" />}
                text="Editar Perfil"
                onPress={() => navigation.navigate("editProfile")}
              />
              <ProfileMenuItem
                icon={<Feather name="shield" size={20} color="#555" />}
                text="Segurança e Senha"
                onPress={() => navigation.navigate("security")}
              />
              <ProfileMenuItem
                icon={<Feather name="bell" size={20} color="#555" />}
                text="Notificações"
                onPress={() => navigation.navigate("notifications")}
              />
            </View>
          </View>

          {/* Developer Tools Section */}
          {isAdmin && (
            <View className="mb-8">
              <Text className="text-sm font-bold text-gray-500 uppercase mb-3 px-2">
                Ferramentas de Desenvolvedor
              </Text>
              <View className="bg-white rounded-xl p-2 shadow-sm">
                <ProfileMenuItem
                  icon={<FontAwesome name="dashboard" size={20} color="#555" />}
                  text="Painel do Administrador"
                  onPress={() => navigation.navigate("admin")}
                />
                <ProfileMenuItem
                  icon={<Feather name="copy" size={20} color="#555" />}
                  text="Copiar Token de Teste"
                  onPress={handleCopyToken}
                />
              </View>
            </View>
          )}

          {/* Logout Section */}
          <View className="mt-4">
            <ProfileMenuItem
              icon={<Feather name="log-out" size={20} color="#EF4444" />}
              text="Sair (Logout)"
              onPress={handleSignOut}
              isLogout
            />
          </View>

          {/* About Section */}
          <View className="mt-8">
            <Text className="text-sm font-bold text-gray-500 uppercase mb-3 px-2">
              Sobre
            </Text>
            <View className="bg-white rounded-xl p-2 shadow-sm">
              <ProfileMenuItem
                icon={<Feather name="info" size={20} color="#555" />}
                text="Versão e Créditos"
                onPress={() =>
                  Alert.alert(
                    "Informações do App",
                    "Versão: 1.0.0\nDesenvolvido por: DGM33"
                  )
                }
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
