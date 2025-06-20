import React, { useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { AppScreenProps } from "@/routes/app.routes";

import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import SocialAuthButtons from "@/components/SocialAuthButtons.tsx";

export function Login({ navigation }: AppScreenProps<"login">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [focusedInput, setFocusedInput] = useState<"email" | "password" | null>(
    null
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          showsVerticalScrollIndicator={false}
        >
          <View className="p-8">
            <Text className="text-5xl font-bold text-green-logo mb-2 font-[Inter_700Bold]">
              Entrar
            </Text>
            <Text className="text-xl text-gray-600 mb-10 font-[Inter_400Regular]">
              Que bom te ver de volta, explorador(a)!
            </Text>
            <Input
              isFocused={focusedInput === "email"}
              onFocus={() => setFocusedInput("email")}
              onBlur={() => setFocusedInput(null)}
              placeholder="Seu e-mail"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <Input
              isFocused={focusedInput === "password"}
              onFocus={() => setFocusedInput("password")}
              onBlur={() => setFocusedInput(null)}
              className="mt-4"
              placeholder="Sua senha"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity className="self-end my-5">
              <Text className="text-green-logo font-semibold font-regular">
                Esqueceu sua senha?
              </Text>
            </TouchableOpacity>

            <Button
              title="Entrar"
              onPress={() => navigation.navigate("home")}
              className="bg-green-logo py-5 rounded-xl items-center justify-center"
              textClassName="text-white font-bold text-lg font-[Inter_700Bold]"
              hasShadow={true}
            />
            <TouchableOpacity
              className="mt-6"
              onPress={() => navigation.navigate("register")}
            >
              <Text className="text-black text-center font-semibold font-regular">
                Criar uma nova conta
              </Text>
            </TouchableOpacity>
            <SocialAuthButtons />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// import React, { useState } from "react"; // Importe o useState
// import {
//   View,
//   Text,
//   SafeAreaView,
//   TextInput,
//   TouchableOpacity,
//   ScrollView,
//   KeyboardAvoidingView, // Adicionado para melhor comportamento do teclado
//   Platform,
// } from "react-native";
// import { AppScreenProps } from "@/routes/app.routes";
// import { Button } from "@/components/Button";
// import SocialAuthButtons from "@/components/SocialAuthButtons.tsx";

// export function Login({ navigation }: AppScreenProps<"login">) {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");

//   // 1. Estado para controlar o foco dos inputs
//   const [focusedInput, setFocusedInput] = useState<"email" | "password" | null>(
//     null
//   );

//   // 2. Estilos condicionais para reutilização
//   const emailInputClasses =
//     focusedInput === "email"
//       ? "bg-green-50 border-green-logo" // Estilo quando focado
//       : "bg-white border-gray-300"; // Estilo quando não focado

//   const passwordInputClasses =
//     focusedInput === "password"
//       ? "bg-green-50 border-green-logo" // Estilo quando focado
//       : "bg-white border-gray-300"; // Estilo quando não focado

//   return (
//     <SafeAreaView className="flex-1 bg-white">
//       <KeyboardAvoidingView
//         behavior={Platform.OS === "ios" ? "padding" : "height"}
//         className="flex-1"
//       >
//         <ScrollView
//           contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
//           showsVerticalScrollIndicator={false}
//         >
//           <View className="p-8">
//             <Text className="text-5xl font-bold text-green-logo mb-2 font-[Inter_700Bold]">
//               Entrar
//             </Text>
//             <Text className="text-xl text-gray-600 mb-10 font-[Inter_400Regular]">
//               Que bom te ver de volta, explorador(a)!
//             </Text>

//             <TextInput
//               onFocus={() => setFocusedInput("email")} // Define o foco para 'email'
//               onBlur={() => setFocusedInput(null)} // Remove o foco
//               className={`
//                 w-full border rounded-xl p-5 text-lg font-[Inter_400Regular]
//                 ${emailInputClasses}
//               `}
//               placeholder="Seu e-mail"
//               keyboardType="email-address"
//               autoCapitalize="none"
//               value={email}
//               onChangeText={setEmail}
//             />
//             <TextInput
//               onFocus={() => setFocusedInput("password")} // Define o foco para 'password'
//               onBlur={() => setFocusedInput(null)} // Remove o foco
//               className={`
//                 w-full border rounded-xl p-5 mt-4 text-lg font-[Inter_400Regular]
//                 ${passwordInputClasses}
//               `}
//               placeholder="Sua senha"
//               secureTextEntry
//               value={password}
//               onChangeText={setPassword}
//             />

//             {/* O resto do código continua o mesmo... */}
//             <TouchableOpacity className="self-end my-5">
//               <Text className="text-green-logo font-semibold font-regular">
//                 Esqueceu sua senha?
//               </Text>
//             </TouchableOpacity>

//             <Button
//               title="Entrar"
//               onPress={() => navigation.navigate("home")}
//               // Adicionamos as classes de sombra aqui
//               className="bg-green-logo py-5 rounded-xl items-center justify-center shadow-lg shadow-green-logo/50"
//               textClassName="text-white font-bold text-lg font-[Inter_700Bold]"
//             />

//             <SocialAuthButtons />
//           </View>
//         </ScrollView>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// }
