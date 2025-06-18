import {
  createStackNavigator,
  StackScreenProps,
} from "@react-navigation/stack";

import { Home } from "../screens/Home";
import { Welcome } from "@/screens/Welcome";
import { Login } from "@/screens/Login";
import { Register } from "@/screens/Register";

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
      {/* <Stack.Screen name="home" component={Home} /> */}
      <Stack.Screen name="welcome" component={Welcome} />
      <Stack.Screen name="login" component={Login} />
      <Stack.Screen name="register" component={Register} />
    </Stack.Navigator>
  );
}
