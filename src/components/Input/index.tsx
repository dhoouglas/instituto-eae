import React from "react";
import { TextInput, TextInputProps } from "react-native";
import colors from "tailwindcss/colors";

type InputProps = TextInputProps & {
  isFocused?: boolean;
};

export function Input({ isFocused = false, className, ...rest }: InputProps) {
  const inputStateClasses = isFocused
    ? "bg-green-50 border-green-logo"
    : "bg-white border-gray-300";

  return (
    <TextInput
      className={`
        w-full border rounded-xl p-5 text-lg font-[Inter_400Regular]
        ${inputStateClasses}
        ${className} 
      `}
      placeholderTextColor={colors.gray[400]}
      {...rest}
    />
  );
}
