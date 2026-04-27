import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Platform,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import { Feather, FontAwesome5 } from "@expo/vector-icons";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useFocusEffect, useNavigation, useIsFocused } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";

import api from "@/lib/api";
import { AppNavigatorRoutesProps } from "@/routes/types";
import { Loading } from "@/components/Loading";

interface EventSummary {
  id: string;
  name: string;
  rsvps: {
    going: number;
    notGoing: number;
    maybe: number;
  };
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
const StatCard = ({
  icon,
  label,
  value,
  color,
  bgColor,
}: {
  icon: string;
  label: string;
  value: number;
  color: string;
  bgColor: string;
}) => (
  <View
    style={{
      flex: 1,
      backgroundColor: "#FFFFFF",
      borderRadius: 20,
      padding: 16,
      alignItems: "center",
      marginHorizontal: 5,
      shadowColor: color,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.18,
      shadowRadius: 12,
      elevation: 6,
      borderWidth: 1,
      borderColor: bgColor,
    }}
  >
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: bgColor,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 10,
      }}
    >
      <Feather name={icon as any} size={22} color={color} />
    </View>
    <Text
      style={{
        fontSize: 30,
        fontFamily: "Inter_800ExtraBold",
        color: color,
        lineHeight: 34,
      }}
    >
      {value}
    </Text>
    <Text
      style={{
        fontSize: 12,
        fontFamily: "Inter_500Medium",
        color: "#6B7280",
        marginTop: 4,
        textAlign: "center",
      }}
    >
      {label}
    </Text>
  </View>
);

// ─── Action Button ────────────────────────────────────────────────────────────
const ActionButton = ({
  icon,
  label,
  subtitle,
  colors,
  onPress,
}: {
  icon: string;
  label: string;
  subtitle: string;
  colors: [string, string];
  onPress: () => void;
}) => (
  <TouchableOpacity
    activeOpacity={0.85}
    onPress={onPress}
    style={{ marginBottom: 12 }}
  >
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0.8 }}
      style={{
        borderRadius: 18,
        padding: 18,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <View
        style={{
          width: 46,
          height: 46,
          borderRadius: 14,
          backgroundColor: "rgba(255,255,255,0.18)",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 14,
        }}
      >
        <Feather name={icon as any} size={22} color="#FFFFFF" />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: "#FFFFFF",
            fontFamily: "Inter_700Bold",
            fontSize: 16,
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            color: "rgba(255,255,255,0.75)",
            fontFamily: "Inter_400Regular",
            fontSize: 13,
            marginTop: 2,
          }}
        >
          {subtitle}
        </Text>
      </View>
      <Feather name="chevron-right" size={20} color="rgba(255,255,255,0.6)" />
    </LinearGradient>
  </TouchableOpacity>
);

// ─── Event Row ────────────────────────────────────────────────────────────────
const EventRow = ({ event }: { event: EventSummary }) => {
  const total = event.rsvps.going + event.rsvps.notGoing + event.rsvps.maybe;
  const goingRatio = total > 0 ? event.rsvps.going / total : 0;

  return (
    <View
      style={{
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <Text
          style={{
            fontFamily: "Inter_600SemiBold",
            color: "#1F2937",
            fontSize: 14,
            flex: 1,
            marginRight: 8,
          }}
          numberOfLines={1}
        >
          {event.name}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Feather name="user-check" size={13} color="#10B981" />
            <Text
              style={{
                fontFamily: "Inter_700Bold",
                color: "#10B981",
                fontSize: 13,
                marginLeft: 4,
              }}
            >
              {event.rsvps.going}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Feather name="user-x" size={13} color="#EF4444" />
            <Text
              style={{
                fontFamily: "Inter_700Bold",
                color: "#EF4444",
                fontSize: 13,
                marginLeft: 4,
              }}
            >
              {event.rsvps.notGoing}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Feather name="help-circle" size={13} color="#F59E0B" />
            <Text
              style={{
                fontFamily: "Inter_700Bold",
                color: "#F59E0B",
                fontSize: 13,
                marginLeft: 4,
              }}
            >
              {event.rsvps.maybe}
            </Text>
          </View>
        </View>
      </View>
      {/* Progress bar */}
      <View
        style={{
          height: 5,
          backgroundColor: "#F3F4F6",
          borderRadius: 100,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            height: "100%",
            width: `${Math.round(goingRatio * 100)}%`,
            backgroundColor: "#4b8c34",
            borderRadius: 100,
          }}
        />
      </View>
      <Text
        style={{
          fontFamily: "Inter_400Regular",
          color: "#9CA3AF",
          fontSize: 11,
          marginTop: 4,
        }}
      >
        {Math.round(goingRatio * 100)}% de confirmação
      </Text>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export function AdminDashboard() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [totalGoing, setTotalGoing] = useState(0);
  const [totalNotGoing, setTotalNotGoing] = useState(0);
  const [totalMaybe, setTotalMaybe] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const navigation = useNavigation<AppNavigatorRoutesProps>();
  const { getToken } = useAuth();
  const { user } = useUser();

  const fetchEventData = useCallback(async () => {
    if ((user?.publicMetadata?.role as string) !== "admin") {
      console.error("Acesso negado. O usuário não é um administrador.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const token = await getToken({ template: "api-testing-token" });
      const response = await api.get("/events/summary", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const eventData = response.data as EventSummary[];

      setEvents(eventData);
      setTotalGoing(eventData.reduce((s, e) => s + e.rsvps.going, 0));
      setTotalNotGoing(eventData.reduce((s, e) => s + e.rsvps.notGoing, 0));
      setTotalMaybe(eventData.reduce((s, e) => s + e.rsvps.maybe, 0));
    } catch (error) {
      console.error("Failed to fetch event data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchEventData();
    }, [fetchEventData])
  );

  function handleNavigateToCreateEvent() {
    navigation.navigate("events", { screen: "createEvent" });
  }

  const isFocused = useIsFocused();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F0F4F0" }}>
      {isFocused && <ExpoStatusBar style="light" translucent={true} />}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* ── Hero Header ─────────────────────────────────────────── */}
        <LinearGradient
          colors={["#4b8c34", "#2d6120"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingTop:
              (Platform.OS === "android" ? StatusBar.currentHeight ?? 0 : 0) +
              16,
            paddingBottom: 40,
            paddingHorizontal: 24,
            borderBottomLeftRadius: 36,
            borderBottomRightRadius: 36,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ marginRight: 16 }}
            >
              <Feather name="arrow-left" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                backgroundColor: "rgba(255,255,255,0.15)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FontAwesome5 name="leaf" size={18} color="#FFFFFF" />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text
                style={{
                  color: "rgba(255,255,255,0.7)",
                  fontFamily: "Inter_500Medium",
                  fontSize: 13,
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                }}
              >
                Painel do Admin
              </Text>
              <Text
                style={{
                  color: "#FFFFFF",
                  fontFamily: "Inter_700Bold",
                  fontSize: 20,
                  marginTop: 2,
                }}
              >
                Olá, {user?.firstName ?? "Admin"}!
              </Text>
            </View>
          </View>

          <Text
            style={{
              color: "rgba(255,255,255,0.65)",
              fontFamily: "Inter_400Regular",
              fontSize: 14,
              lineHeight: 20,
            }}
          >
            Gerencie eventos, voluntários e comunicações da EAE com precisão.
          </Text>
        </LinearGradient>

        <View style={{ paddingHorizontal: 20, marginTop: -24 }}>
          {isLoading ? (
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 20,
                padding: 32,
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
                elevation: 5,
              }}
            >
              <Loading size="large" color="#4b8c34" />
              <Text
                style={{
                  fontFamily: "Inter_500Medium",
                  color: "#6B7280",
                  marginTop: 12,
                  fontSize: 14,
                }}
              >
                Carregando dados...
              </Text>
            </View>
          ) : (
            <>
              {/* ── Stat Cards ─────────────────────────────────────── */}
              <View style={{ flexDirection: "row", marginBottom: 28 }}>
                <StatCard
                  icon="user-check"
                  label="Confirmados"
                  value={totalGoing}
                  color="#10B981"
                  bgColor="#ECFDF5"
                />
                <StatCard
                  icon="user-x"
                  label="Não vão"
                  value={totalNotGoing}
                  color="#EF4444"
                  bgColor="#FEF2F2"
                />
                <StatCard
                  icon="help-circle"
                  label="Talvez"
                  value={totalMaybe}
                  color="#F59E0B"
                  bgColor="#FFFBEB"
                />
              </View>

              {/* ── Ações Rápidas ──────────────────────────────────── */}
              <Text
                style={{
                  fontFamily: "Inter_700Bold",
                  fontSize: 12,
                  color: "#9CA3AF",
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                  marginBottom: 14,
                  paddingLeft: 4,
                }}
              >
                Ações Rápidas
              </Text>

              <ActionButton
                icon="calendar"
                label="Criar Novo Evento"
                subtitle="Agende uma nova atividade para os voluntários"
                colors={["#4b8c34", "#2d6120"]}
                onPress={handleNavigateToCreateEvent}
              />

              <ActionButton
                icon="bell"
                label="Enviar Notificação"
                subtitle="Dispare um aviso geral para todos os usuários"
                colors={["#D97706", "#B45309"]}
                onPress={() =>
                  navigation.navigate("profile", {
                    screen: "adminSendNotification",
                  })
                }
              />

              <ActionButton
                icon="alert-triangle"
                label="Comentários Denunciados"
                subtitle="Faça a moderação de comentários reportados"
                colors={["#EF4444", "#B91C1C"]}
                onPress={() =>
                  navigation.navigate("profile", {
                    screen: "adminReportedComments",
                  })
                }
              />

              {/* ── Resumo dos Eventos ─────────────────────────────── */}
              {events.length > 0 && (
                <>
                  <Text
                    style={{
                      fontFamily: "Inter_700Bold",
                      fontSize: 12,
                      color: "#9CA3AF",
                      textTransform: "uppercase",
                      letterSpacing: 1.5,
                      marginBottom: 14,
                      marginTop: 12,
                      paddingLeft: 4,
                    }}
                  >
                    Resumo dos Eventos
                  </Text>

                  <View
                    style={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: 20,
                      paddingHorizontal: 16,
                      paddingTop: 4,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.06,
                      shadowRadius: 12,
                      elevation: 4,
                    }}
                  >
                    {events.map((event, index) => (
                      <EventRow
                        key={event.id}
                        event={event}
                      />
                    ))}
                  </View>
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
