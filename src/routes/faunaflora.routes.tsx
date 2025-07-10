import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

import { FaunaFloraListScreen } from "@/screens/FaunaFlora/List";
import { FaunaFloraFormScreen } from "@/screens/FaunaFlora/Form";
import { FaunaFloraDetailsScreen } from "@/screens/FaunaFlora/Details";
import { FaunaFloraStackParamList } from "./types";

const { Navigator, Screen } = createStackNavigator<FaunaFloraStackParamList>();

export function FaunaFloraRoutes() {
  return (
    <Navigator screenOptions={{ headerShown: false }}>
      <Screen name="faunaFloraList" component={FaunaFloraListScreen} />
      <Screen name="faunaFloraDetails" component={FaunaFloraDetailsScreen} />
      <Screen name="createFaunaFlora" component={FaunaFloraFormScreen} />
      <Screen name="editFaunaFlora" component={FaunaFloraFormScreen} />
    </Navigator>
  );
}
