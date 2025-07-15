import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { FontAwesome } from "@expo/vector-icons";

import { RootParamList } from "./types";

import { Home } from "@/screens/Home";
import { ProfileRoutes } from "./profile.routes";

import { EventsStackNavigator } from "./events.route";
import { FaunaFloraRoutes } from "./faunaflora.routes";
import { useUser } from "@clerk/clerk-expo";
import { NewsStackNavigator } from "./news.routes";

const Tab = createBottomTabNavigator<RootParamList>();

export function AppRoutes() {
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === "admin";

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#488A35",
        tabBarInactiveTintColor: "#54341c",
        tabBarStyle: {
          height: 80,
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
        name="news"
        component={NewsStackNavigator}
        options={{
          headerShown: false,
          tabBarLabel: "Notícias",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="newspaper-o" color={color} size={size} />
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
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="calendar" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="faunaFlora"
        component={FaunaFloraRoutes}
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
        component={ProfileRoutes}
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
