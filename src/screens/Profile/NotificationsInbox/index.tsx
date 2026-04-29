import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    SafeAreaView,
    FlatList,
    RefreshControl,
    TouchableOpacity,
    Platform,
    StatusBar,
    ActivityIndicator,
    Alert,
} from "react-native";
import { ProfileStackScreenProps } from "@/routes/types";
import { Header } from "@/components/Header";
import { FontAwesome } from "@expo/vector-icons";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Swipeable } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";
import { useNavigation } from "@react-navigation/native";
import type { AppNavigatorRoutesProps } from "@/routes/types";
import api from "@/lib/api";
import { Loading } from "@/components/Loading";

type Notification = {
    id: string;
    title: string;
    message: string;
    category: "GERAL" | "EVENTO" | "LEMBRETE";
    read: boolean;
    entityId?: string | null;
    createdAt: string;
};

const CATEGORY_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
    GERAL: { label: "Instituto EAE", color: "#3B82F6", icon: "bullhorn" },
    EVENTO: { label: "Novo Evento", color: "#10B981", icon: "calendar" },
    LEMBRETE: { label: "Lembrete", color: "#F59E0B", icon: "clock-o" },
};

function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function NotificationsInbox({
    navigation,
}: ProfileStackScreenProps<"notificationsInbox">) {
    const { getToken } = useAuth();
    const { user } = useUser();
    const isAdmin = user?.publicMetadata?.role === "admin";
    const rootNavigation = useNavigation<AppNavigatorRoutesProps>();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchInbox = useCallback(async () => {
        try {
            const token = await getToken({ template: "api-testing-token" });
            const response = await api.get<Notification[]>("/notifications/inbox", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotifications(response.data);
        } catch (error) {
            console.error("Erro ao buscar inbox:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [getToken]);

    useEffect(() => {
        fetchInbox();
    }, [fetchInbox]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchInbox();
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            const token = await getToken({ template: "api-testing-token" });
            await api.patch(`/notifications/inbox/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, read: true } : n))
            );
        } catch (error) {
            console.error("Erro ao marcar como lida:", error);
        }
    };

    const handlePress = async (item: Notification) => {
        // Mark as read if not yet
        if (!item.read) {
            await handleMarkAsRead(item.id);
        }

        // Navigate to related event
        if (item.category === "EVENTO" && item.entityId) {
            rootNavigation.navigate("events", {
                screen: "eventDetail",
                params: { eventId: item.entityId },
            });
        }
    };

    const handleDelete = async (item: Notification, isGlobal: boolean) => {
        setDeletingId(item.id);
        try {
            const token = await getToken({ template: "api-testing-token" });
            const endpoint = isGlobal ? `/notifications/admin/inbox/${item.id}` : `/notifications/inbox/${item.id}`;
            await api.delete(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotifications((prev) => prev.filter((n) => n.id !== item.id));
            Toast.show({ type: "success", text1: isGlobal ? "Notificação global excluída" : "Notificação excluída" });
        } catch (error) {
            console.error("Erro ao deletar notificação:", error);
            Toast.show({ type: "error", text1: "Erro ao deletar notificação" });
        } finally {
            setDeletingId(null);
        }
    };

    const confirmDelete = (item: Notification, isGlobal: boolean) => {
        Alert.alert(
            "Excluir notificação",
            isGlobal ? "Tem certeza que deseja limpar esta notificação globalmente?" : "Tem certeza que deseja excluir esta notificação?",
            [
                { text: "Cancelar", style: "cancel" },
                { text: "Excluir", style: "destructive", onPress: () => handleDelete(item, isGlobal) }
            ]
        );
    };

    const renderItem = ({ item }: { item: Notification }) => {
        const config = CATEGORY_CONFIG[item.category] ?? CATEGORY_CONFIG.GERAL;
        const isActionable = item.category === "EVENTO" && item.entityId;

        const renderRightActions = () => (
            <View className="flex-row items-center justify-end pl-2 mb-3">
                {isAdmin && (
                    <TouchableOpacity
                        onPress={() => confirmDelete(item, true)}
                        className="bg-red-800 w-16 h-[88%] rounded-2xl items-center justify-center mr-2 relative"
                    >
                        <FontAwesome name="globe" size={16} color="white" style={{ position: "absolute", top: 12 }} />
                        <FontAwesome name="trash" size={24} color="white" style={{ marginTop: 12 }} />
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    onPress={() => confirmDelete(item, false)}
                    className="bg-red-500 w-16 h-[88%] rounded-2xl items-center justify-center"
                >
                    <FontAwesome name="trash" size={24} color="white" />
                </TouchableOpacity>
            </View>
        );

        return (
            <Swipeable renderRightActions={renderRightActions}>
                <TouchableOpacity
                    onPress={() => handlePress(item)}
                    activeOpacity={isActionable ? 0.7 : 1}
                    className={`bg-white p-4 rounded-2xl mb-3 border shadow-sm ${item.read ? "border-gray-100" : "border-blue-100"}`}
                >
                    <View className="flex-row items-center justify-between mb-2">
                        <View className="flex-row items-center gap-2">
                            <View
                                className="w-7 h-7 rounded-full items-center justify-center"
                                style={{ backgroundColor: `${config.color}20` }}
                            >
                                <FontAwesome name={config.icon as any} size={13} color={config.color} />
                            </View>
                            <Text className="text-xs font-[Inter_700Bold]" style={{ color: config.color }}>
                                {config.label}
                            </Text>
                        </View>
                        <View className="flex-row items-center gap-2">
                            <Text className="text-xs text-gray-400">{formatDate(item.createdAt)}</Text>
                            {!item.read && (
                                <View className="w-2 h-2 rounded-full bg-blue-500" />
                            )}
                        </View>
                    </View>
                    <View className="pr-12">
                        <Text className="text-gray-800 font-[Inter_700Bold] text-base mb-1">{item.title}</Text>
                        <Text className="text-gray-500 font-[Inter_400Regular] text-sm leading-relaxed">{item.message}</Text>
                        {isActionable && (
                            <Text className="text-green-600 text-xs font-[Inter_600SemiBold] mt-2">
                                Toque para ver o evento →
                            </Text>
                        )}
                    </View>

                    <View className="absolute right-3 top-1/2 flex-row items-center opacity-50 bg-gray-50/80 px-2 py-1 rounded-md" style={{ marginTop: 8 }}>
                        <FontAwesome name="angle-double-left" size={12} color="#9CA3AF" />
                        <Text className="text-[10px] text-gray-400 font-[Inter_600SemiBold] ml-1 uppercase tracking-wider">deslize</Text>
                    </View>
                    {deletingId === item.id && (
                        <View className="absolute top-0 bottom-0 left-0 right-0 bg-white/60 items-center justify-center rounded-2xl z-20">
                            <ActivityIndicator color="#EF4444" size="large" />
                        </View>
                    )}
                </TouchableOpacity>
            </Swipeable >
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View
                style={{
                    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
                    flex: 1,
                }}
            >
                <Header
                    showBackButton
                    title="Caixa de Entrada"
                    onBackPress={() => {
                        navigation.navigate("profileMain");
                        rootNavigation.navigate("home");
                    }}
                />
                {loading ? (
                    <View className="flex-1 items-center justify-center">
                        <Loading />
                    </View>
                ) : notifications.length === 0 ? (
                    <View className="flex-1 items-center justify-center px-8">
                        <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
                            <FontAwesome name="bell-slash-o" size={32} color="#9CA3AF" />
                        </View>
                        <Text className="text-gray-800 text-lg font-[Inter_700Bold] text-center">Tudo em dia!</Text>
                        <Text className="text-gray-500 text-sm mt-2 text-center leading-relaxed">
                            Quando recebermos novidades, eventos ou lembretes, eles aparecerão aqui.
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={notifications}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={handleRefresh}
                                tintColor="#3B82F6"
                            />
                        }
                    />
                )}
            </View>
        </SafeAreaView>
    );
}
