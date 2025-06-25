import { useEffect } from "react";
import * as WebBrowser from "expo-web-browser";

import { createStackNavigator } from "@react-navigation/stack";

import { Welcome } from "@/screens/Welcome";
import { Login } from "@/screens/Login";
import { Register } from "@/screens/Register";

import { RootParamList } from "./types";

WebBrowser.maybeCompleteAuthSession();

const useWarmUpBrowser = () => {
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

const Stack = createStackNavigator<RootParamList>();

export function AuthRoutes() {
  useWarmUpBrowser();

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
