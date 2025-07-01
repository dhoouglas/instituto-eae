import { createStackNavigator } from "@react-navigation/stack";
import { RootParamList } from "./types";

import { EventsListScreen } from "@/screens/Events/List";
import { CreateEventScreen } from "@/screens/Events/Create";

const Stack = createStackNavigator<RootParamList>();

export function EventsStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: "#2A9D8F" },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontFamily: "Inter_700Bold",
        },
      }}
    >
      <Stack.Screen
        name="eventsList"
        component={EventsListScreen}
        options={{ title: "Próximos Eventos" }}
      />
      <Stack.Screen
        name="createEvent"
        component={CreateEventScreen}
        options={{ title: "Criar Novo Evento" }}
      />
    </Stack.Navigator>
  );
}
