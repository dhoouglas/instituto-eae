import React, { useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  StatusBar,
} from "react-native";
import { ProfileStackScreenProps } from "@/routes/types";
import { Feather } from "@expo/vector-icons";
import { Header } from "@/components/Header";

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
  const [newEvents, setNewEvents] = useState(true);
  const [eventReminders, setEventReminders] = useState(true);
  const [appUpdates, setAppUpdates] = useState(false);

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
              value={newEvents}
              onValueChange={setNewEvents}
            />
            <NotificationToggle
              label="Lembretes de eventos que confirmei presença"
              value={eventReminders}
              onValueChange={setEventReminders}
            />
            <NotificationToggle
              label="Novidades e atualizações do Instituto EAE"
              value={appUpdates}
              onValueChange={setAppUpdates}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
