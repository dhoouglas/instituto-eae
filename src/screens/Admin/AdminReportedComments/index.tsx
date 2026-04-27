import React, { useState, useCallback } from "react";
import {
    View,
    Text,
    SafeAreaView,
    ScrollView,
    Platform,
    StatusBar,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@clerk/clerk-expo";
import { useFocusEffect, useNavigation, useIsFocused } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";

import api from "@/lib/api";
import { AppNavigatorRoutesProps } from "@/routes/types";
import { Loading } from "@/components/Loading";

interface ReportedComment {
    id: string;
    content: string;
    reportCount: number;
    user: {
        clerkId: string;
        firstName: string | null;
        lastName: string | null;
    };
}

export function AdminReportedComments() {
    const [comments, setComments] = useState<ReportedComment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const navigation = useNavigation<AppNavigatorRoutesProps>();
    const { getToken } = useAuth();
    const isFocused = useIsFocused();

    const fetchComments = useCallback(async () => {
        try {
            setIsLoading(true);
            const token = await getToken({ template: "api-testing-token" });
            const response = await api.get("/comments/reported", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setComments(response.data.comments || []);
        } catch (error) {
            console.error("Failed to fetch reported comments:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchComments();
        }, [fetchComments])
    );

    const handleDismiss = async (id: string) => {
        try {
            setProcessingId(id);
            const token = await getToken({ template: "api-testing-token" });
            await api.post(`/comments/${id}/dismiss-report`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setComments((prev) => prev.filter((c) => c.id !== id));
            Alert.alert("Sucesso", "A denúncia foi ignorada.");
        } catch (error) {
            console.error(error);
            Alert.alert("Erro", "Não foi possível ignorar a denúncia.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleDelete = async (id: string) => {
        Alert.alert(
            "Apagar Comentário",
            "Tem certeza que deseja apagar este comentário permanentemente?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Apagar",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setProcessingId(id);
                            const token = await getToken({ template: "api-testing-token" });
                            await api.delete(`/comments/${id}`, {
                                headers: { Authorization: `Bearer ${token}` },
                            });
                            setComments((prev) => prev.filter((c) => c.id !== id));
                            Alert.alert("Sucesso", "Comentário apagado com sucesso.");
                        } catch (error) {
                            console.error(error);
                            Alert.alert("Erro", "Não foi possível apagar o comentário.");
                        } finally {
                            setProcessingId(null);
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#F0F4F0" }}>
            {isFocused && <ExpoStatusBar style="light" translucent={true} />}

            {/* ── Hero Header ─────────────────────────────────────────── */}
            <LinearGradient
                colors={["#4b8c34", "#2d6120"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                    paddingTop:
                        (Platform.OS === "android" ? StatusBar.currentHeight ?? 0 : 0) + 16,
                    paddingBottom: 24,
                    paddingHorizontal: 24,
                    borderBottomLeftRadius: 36,
                    borderBottomRightRadius: 36,
                    zIndex: 10,
                }}
            >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={{ marginRight: 16 }}
                    >
                        <Feather name="arrow-left" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text
                            style={{
                                color: "#FFFFFF",
                                fontFamily: "Inter_700Bold",
                                fontSize: 20,
                            }}
                        >
                            Comentários Denunciados
                        </Text>
                        <Text
                            style={{
                                color: "rgba(255,255,255,0.7)",
                                fontFamily: "Inter_400Regular",
                                fontSize: 14,
                                marginTop: 2,
                            }}
                        >
                            Moderação de conteúdo
                        </Text>
                    </View>
                </View>
            </LinearGradient>

            {/* ── Content ─────────────────────────────────────────────── */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
            >
                {isLoading ? (
                    <View style={{ marginTop: 40, alignItems: "center" }}>
                        <Loading size="large" color="#4b8c34" />
                    </View>
                ) : comments.length === 0 ? (
                    <View style={{ alignItems: "center", marginTop: 60, paddingHorizontal: 20 }}>
                        <Feather name="check-circle" size={48} color="#10B981" />
                        <Text
                            style={{
                                fontFamily: "Inter_700Bold",
                                fontSize: 18,
                                color: "#1F2937",
                                marginTop: 16,
                                textAlign: "center",
                            }}
                        >
                            Tudo limpo!
                        </Text>
                        <Text
                            style={{
                                fontFamily: "Inter_400Regular",
                                fontSize: 14,
                                color: "#6B7280",
                                marginTop: 8,
                                textAlign: "center",
                            }}
                        >
                            Não existem comentários denunciados de momento.
                        </Text>
                    </View>
                ) : (
                    comments.map((comment) => (
                        <View
                            key={comment.id}
                            style={{
                                backgroundColor: "#FFFFFF",
                                borderRadius: 20,
                                padding: 16,
                                marginBottom: 16,
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.05,
                                shadowRadius: 8,
                                elevation: 3,
                            }}
                        >
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                                <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#4b8c34" }}>
                                    {comment.user.firstName} {comment.user.lastName}
                                </Text>
                                <View style={{ backgroundColor: "#FEF2F2", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, flexDirection: "row", alignItems: "center" }}>
                                    <Feather name="alert-triangle" size={12} color="#EF4444" style={{ marginRight: 4 }} />
                                    <Text style={{ fontFamily: "Inter_700Bold", fontSize: 12, color: "#EF4444" }}>
                                        {comment.reportCount} {comment.reportCount === 1 ? 'denúncia' : 'denúncias'}
                                    </Text>
                                </View>
                            </View>

                            <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: "#374151", lineHeight: 20, marginBottom: 16 }}>
                                "{comment.content}"
                            </Text>

                            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
                                <TouchableOpacity
                                    onPress={() => handleDismiss(comment.id)}
                                    disabled={processingId === comment.id}
                                    style={{
                                        flex: 1,
                                        backgroundColor: processingId === comment.id ? "#E5E7EB" : "#F3F4F6",
                                        paddingVertical: 10,
                                        borderRadius: 12,
                                        alignItems: "center",
                                        flexDirection: "row",
                                        justifyContent: "center"
                                    }}
                                >
                                    {processingId === comment.id ? (
                                        <ActivityIndicator size="small" color="#6B7280" />
                                    ) : (
                                        <>
                                            <Feather name="eye-off" size={16} color="#6B7280" style={{ marginRight: 6 }} />
                                            <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#4B5563" }}>Ignorar</Text>
                                        </>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => handleDelete(comment.id)}
                                    disabled={processingId === comment.id}
                                    style={{
                                        flex: 1,
                                        backgroundColor: processingId === comment.id ? "#FEE2E2" : "#FEF2F2",
                                        paddingVertical: 10,
                                        borderRadius: 12,
                                        alignItems: "center",
                                        flexDirection: "row",
                                        justifyContent: "center"
                                    }}
                                >
                                    {processingId === comment.id ? (
                                        <ActivityIndicator size="small" color="#EF4444" />
                                    ) : (
                                        <>
                                            <Feather name="trash-2" size={16} color="#EF4444" style={{ marginRight: 6 }} />
                                            <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#EF4444" }}>Apagar</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
