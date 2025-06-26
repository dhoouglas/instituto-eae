import { createStackNavigator } from "@react-navigation/stack";
import { RootParamList } from "./types";

// Importe as telas
import { FaunaFloraListScreen } from "@/screens/FaunaFlora/List/index";
import { CreateFaunaFloraScreen } from "@/screens/FaunaFlora/Create/index";

const Stack = createStackNavigator<RootParamList>();

export function FaunaFloraStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#2A9D8F" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontFamily: "Inter_700Bold" },
      }}
    >
      <Stack.Screen
        name="faunaFloraList"
        component={FaunaFloraListScreen}
        options={{ title: "Catálogo de Espécies" }}
      />
      <Stack.Screen
        name="createFaunaFlora"
        component={CreateFaunaFloraScreen}
        options={{ title: "Adicionar Espécie" }}
      />
    </Stack.Navigator>
  );
}
