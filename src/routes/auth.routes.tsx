import { createStackNavigator } from "@react-navigation/stack";

import { Welcome } from "@/screens/Welcome";
import { Login } from "@/screens/Login";
import { Register } from "@/screens/Register";

import { StackRouteList } from "./app.routes";

const Stack = createStackNavigator<StackRouteList>();

export function AuthRoutes() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="welcome"
    >
      <Stack.Screen name="welcome" component={Welcome} />
      <Stack.Screen name="login" component={Login} />
      <Stack.Screen name="register" component={Register} />
    </Stack.Navigator>
  );
}
