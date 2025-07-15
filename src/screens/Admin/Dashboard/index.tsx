import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Platform,
  StatusBar,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

import { Button } from "@/components/Button";
import api from "@/lib/api";
import { AppNavigatorRoutesProps } from "@/routes/types";
import { Header } from "@/components/Header";

interface EventSummary {
  id: string;
  name: string;
  rsvps: {
    going: number;
    notGoing: number;
    maybe: number;
  };
}

const StatCard = ({ icon, label, value, color }: any) => (
  <View className="bg-white p-4 rounded-xl shadow-sm flex-1 items-center mx-2">
    <Feather name={icon} size={24} color={color} />
    <Text className="text-3xl font-bold mt-2" style={{ color }}>
      {value}
    </Text>
    <Text className="text-gray-500 mt-1">{label}</Text>
  </View>
);

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
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const eventData = response.data as EventSummary[];

      setEvents(eventData);

      const going = eventData.reduce(
        (sum, event) => sum + event.rsvps.going,
        0
      );
      const notGoing = eventData.reduce(
        (sum, event) => sum + event.rsvps.notGoing,
        0
      );
      const maybe = eventData.reduce(
        (sum, event) => sum + event.rsvps.maybe,
        0
      );

      setTotalGoing(going);
      setTotalNotGoing(notGoing);
      setTotalMaybe(maybe);
    } catch (error) {
      console.error("Failed to fetch event data:", error);
      // Tratar erro (ex: mostrar um toast)
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

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <ScrollView>
        <View
          className="p-6"
          style={{
            paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
            flex: 1,
          }}
        >
          {/* <Text className="text-3xl font-bold text-gray-800 mb-6">
            Painel do Administrador
          </Text> */}
          <Header title="Painel do Admin" showBackButton />

          {isLoading ? (
            <ActivityIndicator size="large" color="#4b8c34" />
          ) : (
            <>
              {/* Stats Section */}
              <View className="mb-8">
                <Text className="text-sm font-bold text-gray-500 uppercase mb-3 px-2">
                  Presença nos Próximos Eventos
                </Text>
                <View className="flex-row justify-around">
                  <StatCard
                    icon="user-check"
                    label="Confirmado"
                    value={totalGoing}
                    color="#10B981"
                  />
                  <StatCard
                    icon="user-x"
                    label="Não irão"
                    value={totalNotGoing}
                    color="#EF4444"
                  />
                  <StatCard
                    icon="help-circle"
                    label="Talvez"
                    value={totalMaybe}
                    color="#F59E0B"
                  />
                </View>
              </View>

              {/* Quick Actions Section */}
              <View className="mb-8">
                <Text className="text-sm font-bold text-gray-500 uppercase mb-3 px-2">
                  Ações Rápidas
                </Text>
                <View className="gap-3">
                  <Button
                    title="Criar Novo Evento"
                    onPress={handleNavigateToCreateEvent}
                    className="bg-green-logo p-4 rounded-lg flex-row items-center justify-center"
                    textClassName="text-white font-bold text-base"
                  />
                  <Button
                    title="Enviar Notificação Geral"
                    disabled={true}
                    className="bg-orange-400 p-4 rounded-lg flex-row items-center justify-center"
                    textClassName="text-white font-bold text-base"
                  />
                </View>
              </View>

              {/* Upcoming Events List */}
              <View>
                <Text className="text-sm font-bold text-gray-500 uppercase mb-3 px-2">
                  Resumo dos Eventos
                </Text>
                <View className="bg-white rounded-xl shadow-sm p-4">
                  {events.map((event) => (
                    <View
                      key={event.id}
                      className="flex-row justify-between items-center py-3 border-b border-gray-200 last:border-b-0"
                    >
                      <Text className="text-lg text-gray-800 flex-1 pr-2">
                        {event.name}
                      </Text>
                      <View className="flex-row items-center">
                        <Feather name="user-check" size={16} color="#10B981" />
                        <Text className="text-green-600 ml-1 mr-3">
                          {event.rsvps.going}
                        </Text>
                        <Feather name="user-x" size={16} color="#EF4444" />
                        <Text className="text-red-600 ml-1 mr-3">
                          {event.rsvps.notGoing}
                        </Text>
                        <Feather name="help-circle" size={16} color="#F59E0B" />
                        <Text className="text-yellow-600 ml-1">
                          {event.rsvps.maybe}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
