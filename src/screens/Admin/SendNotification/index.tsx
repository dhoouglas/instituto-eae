import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    SafeAreaView,
    Platform,
    StatusBar,
    TextInput,
    TouchableOpacity,
    Keyboard,
    KeyboardAvoidingView,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useAuth } from "@clerk/clerk-expo";
import Toast from "react-native-toast-message";
import { FontAwesome, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    withRepeat,
    withSequence,
} from "react-native-reanimated";

import { Header } from "@/components/Header";
import api from "@/lib/api";
import { ProfileStackScreenProps } from "@/routes/types";

export function AdminSendNotification({
    navigation,
}: ProfileStackScreenProps<"adminSendNotification">) {
    const { getToken } = useAuth();
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [isSending, setIsSending] = useState(false);

    // Animações para o botão
    const buttonScale = useSharedValue(1);
    const glowOpacity = useSharedValue(0.5);

    const isFormValid = title.trim().length > 0 && message.trim().length > 0;

    useEffect(() => {
        if (isFormValid) {
            glowOpacity.value = withRepeat(
                withSequence(withTiming(1, { duration: 1500 }), withTiming(0.5, { duration: 1500 })),
                -1,
                true
            );
        } else {
            glowOpacity.value = withTiming(0);
        }
    }, [isFormValid, glowOpacity]);

    const animatedButtonStyle = useAnimatedStyle(() => ({
        transform: [{ scale: buttonScale.value }],
    }));

    const animatedGlowStyle = useAnimatedStyle(() => ({
        opacity: glowOpacity.value,
    }));

    async function handleSendNotification() {
        if (!isFormValid) {
            Toast.show({
                type: "error",
                text1: "Campos Incompletos",
                text2: "Por favor, preencha o título e a mensagem para disparar o aviso.",
            });
            return;
        }

        buttonScale.value = withSpring(0.95);
        setTimeout(() => {
            buttonScale.value = withSpring(1);
        }, 100);

        Keyboard.dismiss();

        try {
            setIsSending(true);
            const token = await getToken({ template: "api-testing-token" });

            await api.post(
                "/notifications/send-general",
                {
                    title: title.trim(),
                    body: message.trim(),
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            Toast.show({
                type: "success",
                text1: "Mensagem Lançada!",
                text2: "O aviso global foi disparado para toda a rede.",
            });
            navigation.goBack();
        } catch (error: any) {
            console.error("Erro ao enviar notificação geral:", error);
            Toast.show({
                type: "error",
                text1: "Erro no envio",
                text2: error.response?.data?.error || "Um erro inesperado bloqueou o envio.",
            });
        } finally {
            setIsSending(false);
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <KeyboardAvoidingView
                style={{ flex: 1, paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <Header title="Central de Disparo" showBackButton />

                <KeyboardAwareScrollView
                    contentContainerStyle={{ padding: 24, flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    enableOnAndroid={true}
                    extraScrollHeight={20}
                >
                    {/* Hero Banner / Warning */}
                    <LinearGradient
                        colors={["#4F46E5", "#3B82F6"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        className="rounded-3xl p-6 mb-8 shadow-xl shadow-blue-900/20"
                    >
                        <View className="flex-row items-center mb-3 pt-2">
                            <View className="bg-white/20 p-3 rounded-2xl mr-4">
                                <Feather name="radio" size={28} color="white" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-white text-lg font-[Inter_800ExtraBold] tracking-wide">
                                    Notificação Global
                                </Text>
                                <Text className="text-white/80 text-sm font-[Inter_500Medium] mt-1">
                                    Alcance instantâneo a todos os voluntários.
                                </Text>
                            </View>
                        </View>
                    </LinearGradient>

                    {/* Form Content */}
                    <View className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6">
                        <View className="mb-6">
                            <Text className="text-[13px] font-[Inter_700Bold] text-gray-400 mb-2 uppercase tracking-widest pl-1">
                                Atenção! Mensagem Pública
                            </Text>
                            <Text className="text-gray-600 text-[15px] font-[Inter_400Regular] leading-relaxed pl-1">
                                Lembre-se: O conteúdo gerado aqui irá interromper momentaneamente todos os usuários ativos com o App instalado e notificações liberadas. Seja direto e claro.
                            </Text>
                        </View>

                        <View className="mb-6">
                            <Text className="text-[13px] font-[Inter_700Bold] text-gray-700 mb-2 uppercase tracking-widest pl-1">
                                Título da Notificação
                            </Text>
                            <View className="bg-gray-50 border border-gray-200 rounded-2xl flex-row items-center h-16 px-4">
                                <View className="h-full justify-center mr-3 w-6 items-center">
                                    <Feather name="bell" size={20} color={title ? "#3B82F6" : "#9CA3AF"} />
                                </View>
                                <TextInput
                                    placeholder="Ex: Atualização sobre a trilha"
                                    placeholderTextColor="#9CA3AF"
                                    value={title}
                                    onChangeText={setTitle}
                                    className="flex-1 text-base h-full font-[Inter_600SemiBold] text-gray-800"
                                />
                            </View>
                        </View>

                        <View>
                            <Text className="text-[13px] font-[Inter_700Bold] text-gray-700 mb-2 uppercase tracking-widest pl-1">
                                Conteúdo da Notificação
                            </Text>
                            <View className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                                <TextInput
                                    placeholder="Seja breve, mas não omita os detalhes importantes. Máximo de 150 caracteres recomendados."
                                    placeholderTextColor="#9CA3AF"
                                    value={message}
                                    onChangeText={setMessage}
                                    multiline
                                    numberOfLines={5}
                                    textAlignVertical="top"
                                    className="text-base font-[Inter_500Medium] text-gray-800 leading-relaxed"
                                    style={{ minHeight: 120 }}
                                />
                            </View>
                        </View>
                    </View>
                </KeyboardAwareScrollView>

                {/* Dynamic Action Button Footer */}
                <View className="p-6 bg-white border-t border-gray-50 pb-8 rounded-t-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
                    <Animated.View style={animatedButtonStyle}>
                        {isFormValid && (
                            <Animated.View
                                style={[
                                    animatedGlowStyle,
                                    {
                                        position: "absolute",
                                        top: -4,
                                        left: -4,
                                        right: -4,
                                        bottom: -4,
                                        backgroundColor: "#3B82F6",
                                        borderRadius: 100,
                                        opacity: 0.5,
                                    },
                                ]}
                            />
                        )}
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={handleSendNotification}
                            disabled={isSending}
                            className={`h-16 rounded-full flex-row items-center justify-center shadow-lg ${isFormValid && !isSending ? "bg-blue-600 shadow-blue-500/40" : "bg-gray-300 shadow-transparent"
                                }`}
                        >
                            <Text
                                className={`text-lg font-[Inter_800ExtraBold] mr-2 ${isFormValid && !isSending ? "text-white" : "text-gray-500"
                                    }`}
                            >
                                {isSending ? "Disparando..." : "DISPARAR AGORA"}
                            </Text>
                            {!isSending && (
                                <FontAwesome name="send" size={16} color={isFormValid ? "white" : "#6B7280"} />
                            )}
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
