import React, { useState } from "react";
import { TextInput, TextInputProps, View, TouchableOpacity } from "react-native";
import colors from "tailwindcss/colors";
import { Feather } from "@expo/vector-icons";

type InputProps = TextInputProps & {
  isFocused?: boolean;
  isPassword?: boolean;
};

export function Input({ isFocused = false, isPassword = false, className, ...rest }: InputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const inputStateClasses = isFocused
    ? "bg-green-50 border-green-logo"
    : "bg-white border-gray-300";

  return (
    <View className={`w-full border rounded-xl flex-row items-center ${inputStateClasses} ${className || ""}`}>
      <TextInput
        className={`flex-1 p-5 text-lg text-gray-900 font-[Inter_400Regular] ${isPassword ? "pr-12" : ""}`}
        placeholderTextColor={colors.gray[400]}
        secureTextEntry={isPassword ? !showPassword : rest.secureTextEntry}
        {...rest}
      />
      {isPassword && (
        <TouchableOpacity
          className="absolute right-4 p-2 z-10"
          onPress={() => setShowPassword(!showPassword)}
        >
          <Feather name={showPassword ? "eye-off" : "eye"} size={22} color={colors.gray[500]} />
        </TouchableOpacity>
      )}
    </View>
  );
}
