import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RootParamList } from "./types";

import { Home } from "@/screens/Home";
import { ProfileRoutes } from "./profile.routes";

import { EventsStackNavigator } from "./events.route";
import { FaunaFloraRoutes } from "./faunaflora.routes";
import { useUser } from "@clerk/clerk-expo";
import { NewsStackNavigator } from "./news.routes";
import { TrailRoutes } from "./trails.routes";

const Tab = createBottomTabNavigator<RootParamList>();

export function AppRoutes() {
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === "admin";
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#488A35",
        tabBarInactiveTintColor: "#54341c",
        tabBarStyle: {
          height: 70,
          paddingTop: 5,
          paddingBottom: insets.bottom + 5,
          borderTopWidth: 0,
          backgroundColor: "#FFFFFF",
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
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
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="home" color={color} size={24} />
          ),
        }}
      />

      <Tab.Screen
        name="news"
        component={NewsStackNavigator}
        options={{
          headerShown: false,
          tabBarLabel: "Notícias",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="article" color={color} size={24} />
          ),
          tabBarItemStyle: {
            display: isAdmin ? "flex" : "none",
          },
        }}
      />

      <Tab.Screen
        name="events"
        component={EventsStackNavigator}
        options={{
          headerShown: false,
          tabBarLabel: "Eventos",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="event" color={color} size={24} />
          ),
        }}
      />
      <Tab.Screen
        name="faunaFlora"
        component={FaunaFloraRoutes}
        options={{
          headerShown: false,
          tabBarLabel: "Biodiv.",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="eco" color={color} size={24} />
          ),
        }}
      />

      <Tab.Screen
        name="trails"
        component={TrailRoutes}
        options={{
          headerShown: false,
          tabBarLabel: "Trilhas",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="hiking" color={color} size={24} />
          ),
        }}
      />

      <Tab.Screen
        name="profile"
        component={ProfileRoutes}
        options={{
          headerShown: false,
          tabBarLabel: "Perfil",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="person" color={color} size={24} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
