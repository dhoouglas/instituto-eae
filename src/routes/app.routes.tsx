import {
  createStackNavigator,
  StackScreenProps,
} from "@react-navigation/stack";

import { Home } from "@/screens/Home";

export type StackRouteList = {
  welcome: undefined;
  login: undefined;
  register: undefined;
  home: undefined;
};

export type AppScreenProps<T extends keyof StackRouteList> = StackScreenProps<
  StackRouteList,
  T
>;

const Stack = createStackNavigator<StackRouteList>();

export function AppRoutes() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="home" component={Home} />
      {/* outras telas do seu app (Perfil, Configurações, etc.) */}
    </Stack.Navigator>
  );
}
