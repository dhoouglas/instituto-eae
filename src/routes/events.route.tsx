import { createStackNavigator } from "@react-navigation/stack";
import { RootParamList } from "./types";

import { EventsListScreen } from "@/screens/Events/List";
import { EventFormScreen } from "@/screens/Events/Form";
import { EventDetailsScreen } from "@/screens/Events/Details";

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
        component={EventFormScreen}
        options={{ title: "Criar Novo Evento" }}
      />
      <Stack.Screen
        name="editEvent"
        component={EventFormScreen}
        options={{ title: "Editar Evento" }}
      />

      <Stack.Screen name="eventDetail" component={EventDetailsScreen} />
    </Stack.Navigator>
  );
}
