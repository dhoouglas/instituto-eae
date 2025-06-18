import React from "react";
import {
  TouchableOpacity,
  TouchableOpacityProps,
  Text,
  ActivityIndicator,
} from "react-native";

// As props foram simplificadas. Removemos 'variant' e adicionamos 'textClassName'.
type ButtonProps = TouchableOpacityProps & {
  title: string;
  isLoading?: boolean;
  textClassName?: string; // Nova prop para estilizar o <Text>
};

export function Button({
  title,
  isLoading = false,
  className, // Para o container TouchableOpacity
  textClassName, // Para o componente Text
  ...rest // Demais props como onPress, etc.
}: ButtonProps) {
  return (
    <TouchableOpacity
      className={className} // O estilo do container vem 100% de fora
      disabled={isLoading}
      activeOpacity={0.8}
      {...rest}
    >
      {isLoading ? (
        // O ActivityIndicator usará a cor padrão ou pode ser estilizado no futuro
        <ActivityIndicator />
      ) : (
        <Text className={textClassName}>{title}</Text> // O estilo do texto vem 100% de fora
      )}
    </TouchableOpacity>
  );
}
