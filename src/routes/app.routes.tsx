import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { FontAwesome } from "@expo/vector-icons";

import { RootParamList, AppTabScreenProps } from "./types";

import { Home } from "@/screens/Home";
import { Profile } from "@/screens/Profile";

import { EventsStackNavigator } from "./events.route";
import { FaunaFloraStackNavigator } from "./faunaflora.routes";

const Tab = createBottomTabNavigator<RootParamList>();

export function AppRoutes() {
  return (
    <Tab.Navigator
      screenOptions={{
        // headerShown como undefined aqui, para controlar por tela
        tabBarActiveTintColor: "#2A9D8F",
        tabBarInactiveTintColor: "#A1A1AA",
        tabBarStyle: {
          height: 64,
          paddingTop: 8,
          paddingBottom: 8,
          borderTopWidth: 0,
          backgroundColor: "#FFFFFF",
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: "Inter_400Regular",
        },
      }}
    >
      <Tab.Screen
        name="home"
        component={Home}
        options={{
          headerShown: false,
          tabBarLabel: "Início",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="events"
        component={EventsStackNavigator}
        options={{
          headerShown: false,
          tabBarLabel: "Eventos",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="calendar" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="faunaeflora"
        component={FaunaFloraStackNavigator}
        options={{
          headerShown: false,
          tabBarLabel: "Fauna & Flora",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="leaf" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="profile"
        component={Profile}
        options={{
          headerShown: false,
          tabBarLabel: "Perfil",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="user" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
