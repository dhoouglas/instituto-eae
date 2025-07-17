import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Switch,
  Platform,
  StatusBar,
} from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { ProfileStackScreenProps } from "@/routes/types";
import { Header } from "@/components/Header";
import api from "@/lib/api";
import Toast from "react-native-toast-message";

const NotificationToggle = ({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) => (
  <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
    <Text className="text-lg text-gray-700 flex-1 pr-4">{label}</Text>
    <Switch
      trackColor={{ false: "#767577", true: "#81b0ff" }}
      thumbColor={value ? "#488A35" : "#f4f3f4"}
      ios_backgroundColor="#3e3e3e"
      onValueChange={onValueChange}
      value={value}
    />
  </View>
);

export function Notifications({
  navigation,
}: ProfileStackScreenProps<"notifications">) {
  const { getToken } = useAuth();
  const [preferences, setPreferences] = useState({
    newEvents: true,
    eventReminders: true,
    appUpdates: false,
  });

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const token = await getToken({ template: "api-testing-token" });
        const url = "/notifications/users/notification-preferences";

        const response = await api.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const { notifyOnNewEvents, notifyOnEventReminders, notifyOnNews } =
          response.data;

        setPreferences({
          newEvents: notifyOnNewEvents,
          eventReminders: notifyOnEventReminders,
          appUpdates: notifyOnNews,
        });
      } catch (error) {
        console.error("Failed to fetch notification preferences:", error);
        Toast.show({
          type: "error",
          text1: "Erro",
          text2: "Não foi possível carregar suas preferências de notificação.",
        });
      }
    };

    fetchPreferences();
  }, []);

  const handleToggle = async (
    key: keyof typeof preferences,
    value: boolean
  ) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);

    const keyMapping: { [key: string]: string } = {
      newEvents: "notifyOnNewEvents",
      eventReminders: "notifyOnEventReminders",
      appUpdates: "notifyOnNews",
    };

    try {
      const token = await getToken({ template: "api-testing-token" });
      const apiKey = keyMapping[key as keyof typeof keyMapping];

      await api.put(
        "/notifications/users/notification-preferences",
        {
          [apiKey]: value,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      Toast.show({
        type: "success",
        text1: "Preferência atualizada!",
      });
    } catch (error) {
      console.error("Failed to update notification preference:", error);
      // Revert state if API call fails
      setPreferences(preferences);
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Não foi possível atualizar sua preferência.",
      });
    }
  };

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
          <Header title="Notificações" showBackButton />

          <View className="bg-white rounded-xl shadow-sm overflow-hidden">
            <NotificationToggle
              label="Novos eventos na minha área"
              value={preferences.newEvents}
              onValueChange={(value) => handleToggle("newEvents", value)}
            />
            <NotificationToggle
              label="Lembretes de eventos que confirmei presença"
              value={preferences.eventReminders}
              onValueChange={(value) => handleToggle("eventReminders", value)}
            />
            <NotificationToggle
              label="Novidades e atualizações do Instituto EAE"
              value={preferences.appUpdates}
              onValueChange={(value) => handleToggle("appUpdates", value)}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
