import { createStackNavigator } from "@react-navigation/stack";
import { NewsStackParamList } from "./types";

import { NewsFormScreen } from "@/screens/News/Form";
import { NewsDetailsScreen } from "@/screens/News/Details";
import { NewsListScreen } from "@/screens/News/List";

const Stack = createStackNavigator<NewsStackParamList>();

export function NewsStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: "#2A9D8F" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontFamily: "Inter_700Bold" },
        headerTitleAlign: "center",
      }}
    >
      <Stack.Screen
        name="newsList"
        component={NewsListScreen}
        options={{ title: "Últimas Notícias" }}
      />
      <Stack.Screen
        name="newsDetail"
        component={NewsDetailsScreen}
        options={{ title: "Detalhes da Notícia" }}
      />

      <Stack.Screen
        name="createNews"
        component={NewsFormScreen}
        options={{ title: "Criar Notícia" }}
      />

      <Stack.Screen
        name="editNews"
        component={NewsFormScreen}
        options={{ title: "Editar Notícia" }}
      />
    </Stack.Navigator>
  );
}
