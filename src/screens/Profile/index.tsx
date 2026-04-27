import React, { useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ImageBackground,
  ActivityIndicator,
} from "react-native";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { FontAwesome, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
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
  icon: React.ReactNode;
  text: string;
  onPress?: () => void;
  isLogout?: boolean;
}) => (
  <TouchableOpacity
    onPress={onPress}
    className={`flex-row items-center px-4 py-3.5 mb-1 rounded-[20px] ${isLogout ? "bg-red-50/40" : "bg-white"
      }`}
    activeOpacity={0.7}
  >
    <View
      className={`w-11 h-11 items-center justify-center rounded-[18px] ${isLogout ? "bg-red-100" : "bg-green-50"
        }`}
    >
      {icon}
    </View>
    <Text
      className={`text-[16px] ml-4 font-[Inter_600SemiBold] ${isLogout ? "text-red-600" : "text-gray-800"
        }`}
    >
      {text}
    </Text>
    {!isLogout && (
      <View className="ml-auto w-8 h-8 rounded-full bg-gray-50 items-center justify-center">
        <FontAwesome name="chevron-right" size={12} color="#94A3B8" />
      </View>
    )}
  </TouchableOpacity>
);

export function Profile({
  navigation,
}: ProfileStackScreenProps<"profileMain">) {
  const { user, isLoaded } = useUser();
  const { signOut, getToken } = useAuth();
  const [isUploading, setIsUploading] = useState(false);

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

  const handleSelectAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permissão necessária",
        "Precisamos de permissão para acessar sua galeria para alterar o avatar."
      );
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setIsUploading(true);
      const selectedImage = result.assets[0];

      try {
        const base64 = await FileSystem.readAsStringAsync(selectedImage.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const dataUri = `data:image/jpeg;base64,${base64}`;

        const updatedUser = await user?.setProfileImage({
          file: dataUri,
        });

        if (updatedUser) {
          Toast.show({
            type: "success",
            text1: "Avatar atualizado!",
            text2: "Sua nova imagem de perfil foi salva.",
          });
        } else {
          throw new Error("A atualização do perfil não retornou um usuário.");
        }
      } catch (error) {
        console.error("Erro ao atualizar o avatar:", error);
        Toast.show({
          type: "error",
          text1: "Erro ao atualizar",
          text2: "Não foi possível alterar sua imagem de perfil.",
        });
      } finally {
        setIsUploading(false);
      }
    }
  };

  if (!isLoaded) {
    return <Loading fullScreen />;
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <LinearGradient
          colors={["#166534", "#15803d"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="pt-20 pb-12 px-6 items-center rounded-b-[40px]"
          style={{ shadowColor: "#15803d", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 10 }}
        >
          <TouchableOpacity
            onPress={handleSelectAvatar}
            disabled={isUploading}
            className="mb-5 border-4 border-white rounded-full bg-white"
            style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 }}
          >
            {user?.hasImage ? (
              <Image
                source={{ uri: user.imageUrl }}
                className="w-32 h-32 rounded-full"
              />
            ) : (
              <View className="w-32 h-32 rounded-full bg-green-100 items-center justify-center">
                <Text className="text-green-800 text-5xl font-[Inter_800ExtraBold]">
                  {getInitials()}
                </Text>
              </View>
            )}
            {isUploading && (
              <View className="absolute inset-0 bg-black/50 rounded-full items-center justify-center">
                <ActivityIndicator size="large" color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
          <Text className="text-3xl font-[Inter_800ExtraBold] text-white">
            {user?.fullName}
          </Text>
          {user?.username && (
            <Text className="text-lg font-[Inter_500Medium] text-green-100 mt-1 opacity-90">
              @{user?.username}
            </Text>
          )}
          <View className="bg-green-800/40 px-4 py-2 rounded-full mt-3">
            <Text className="text-sm text-green-50 font-[Inter_500Medium]">
              {user?.primaryEmailAddress?.emailAddress}
            </Text>
          </View>
        </LinearGradient>

        <View className="px-5 pt-8 pb-10">
          {/* Account Settings Section */}
          <View className="mb-8">
            <Text className="text-xs font-[Inter_800ExtraBold] text-gray-400 uppercase mb-3 px-2 tracking-[1.5px]">
              Configurações da Conta
            </Text>
            <View
              className="bg-white rounded-[28px] p-2"
              style={{ shadowColor: "#94a3b8", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 }}
            >
              <ProfileMenuItem
                icon={<Feather name="user" size={18} color="#15803d" />}
                text="Editar Perfil"
                onPress={() => navigation.navigate("editProfile")}
              />
              <ProfileMenuItem
                icon={<Feather name="shield" size={18} color="#15803d" />}
                text="Segurança e Senha"
                onPress={() => navigation.navigate("security")}
              />
              <ProfileMenuItem
                icon={<Feather name="bell" size={18} color="#15803d" />}
                text="Notificações"
                onPress={() => navigation.navigate("notifications")}
              />
            </View>
          </View>

          {/* Developer Tools Section */}
          {isAdmin && (
            <View className="mb-8">
              <Text className="text-xs font-[Inter_800ExtraBold] text-gray-400 uppercase mb-3 px-2 tracking-[1.5px]">
                Ferramentas de Desenvolvedor
              </Text>
              <View
                className="bg-white rounded-[28px] p-2"
                style={{ shadowColor: "#94a3b8", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 }}
              >
                <ProfileMenuItem
                  icon={<FontAwesome name="dashboard" size={18} color="#15803d" />}
                  text="Painel do Administrador"
                  onPress={() => navigation.navigate("admin")}
                />
                <ProfileMenuItem
                  icon={<Feather name="copy" size={18} color="#15803d" />}
                  text="Copiar Token de Teste"
                  onPress={handleCopyToken}
                />
              </View>
            </View>
          )}

          {/* About & Logout Section */}
          <View className="mb-4">
            <Text className="text-xs font-[Inter_800ExtraBold] text-gray-400 uppercase mb-3 px-2 tracking-[1.5px]">
              Mais
            </Text>
            <View
              className="bg-white rounded-[28px] p-2"
              style={{ shadowColor: "#94a3b8", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 }}
            >
              <ProfileMenuItem
                icon={<Feather name="info" size={18} color="#15803d" />}
                text="Versão e Créditos"
                onPress={() =>
                  Alert.alert(
                    "Informações do App",
                    "Versão: 1.0.0\nDesenvolvido por: DGM33"
                  )
                }
              />
              <ProfileMenuItem
                icon={<Feather name="log-out" size={18} color="#EF4444" />}
                text="Sair da Conta"
                onPress={handleSignOut}
                isLogout
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
