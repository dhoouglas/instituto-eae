import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { useNavigation } from "@react-navigation/native";
import { FontAwesome } from "@expo/vector-icons";

type HeaderProps = {
  title?: string;
  subtitle?: string;
  showGreeting?: boolean;
  showBackButton?: boolean;
  onAvatarPress?: () => void;
};

const getInitials = (user: any) => {
  const fullName = user?.fullName;
  if (!fullName) return "VE";
  const names = fullName.split(" ");
  return names.length > 1
    ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
    : names[0]
      ? names[0][0].toUpperCase()
      : "";
};

export function Header({
  title,
  showGreeting = false,
  subtitle,
  showBackButton = false,
  onAvatarPress,
}: HeaderProps) {
  const { user } = useUser();
  const navigation = useNavigation();

  if (!showGreeting) {
    return (
      <View className="w-full flex-row items-center p-4 bg-gray-50 border-b border-gray-200">
        {/* Lado Esquerdo: Botão de Voltar */}
        <View className="w-10">
          {showBackButton && (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="p-1"
            >
              <FontAwesome name="arrow-left" size={24} color="#333" />
            </TouchableOpacity>
          )}
        </View>

        {/* Centro: Título */}
        <View className="flex-1 items-center">
          <Text className="text-xl font-bold text-gray-800 font-[Inter_700Bold]">
            {title}
          </Text>
          {subtitle && (
            <Text className="text-base text-gray-500">{subtitle}</Text>
          )}
        </View>

        {/* Lado Direito: Espaço vazio para manter o título centralizado */}
        <View className="w-10" />
      </View>
    );
  }

  return (
    <View className="w-full flex-row items-center justify-between p-6">
      {/* Lado Esquerdo: Textos de Saudação */}
      <View>
        <Text className="text-3xl font-bold text-gray-800 font-[Inter_700Bold]">
          Olá, {user?.firstName ?? "Voluntário(a) EAE"}!
        </Text>
        <Text className="text-lg text-gray-500">Pronto para explorar?</Text>
      </View>

      {/* Lado Direito: Avatar */}
      <TouchableOpacity onPress={onAvatarPress} activeOpacity={0.8}>
        {user?.hasImage ? (
          <Image
            source={{ uri: user.imageUrl }}
            className="w-16 h-16 rounded-full"
          />
        ) : (
          <View className="w-16 h-16 rounded-full bg-green-logo items-center justify-center">
            <Text className="text-white text-2xl font-bold">
              {getInitials(user)}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}
