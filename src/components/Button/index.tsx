import React from "react";
import {
  TouchableOpacity,
  TouchableOpacityProps,
  Text,
  ActivityIndicator,
  Platform,
  View,
} from "react-native";

type ButtonProps = TouchableOpacityProps & {
  title: string;
  isLoading?: boolean;
  textClassName?: string;
  hasShadow?: boolean;
  shadowColor?: string;
};

export function Button({
  title,
  isLoading = false,
  className,
  textClassName,
  hasShadow = false,
  shadowColor = "#4b8c34",
  ...rest
}: ButtonProps) {
  const shadowStyle = hasShadow
    ? Platform.select({
        ios: {
          shadowColor: shadowColor,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.35,
          shadowRadius: 14,
        },
        android: {
          elevation: 8,
        },
      })
    : {};

  return (
    <TouchableOpacity disabled={isLoading} activeOpacity={0.8} {...rest}>
      <View style={shadowStyle} className={className}>
        {isLoading ? (
          <ActivityIndicator />
        ) : (
          <Text className={textClassName}>{title}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
