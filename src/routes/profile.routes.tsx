import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

import { Profile } from "@/screens/Profile";
import { EditProfile } from "@/screens/Profile/EditProfile";
import { Security } from "@/screens/Profile/Security";
import { Notifications } from "@/screens/Profile/Notifications";
import { AdminDashboard } from "@/screens/Admin/Dashboard";

import { ProfileStackParamList } from "./types";

const { Navigator, Screen } = createStackNavigator<ProfileStackParamList>();

export function ProfileRoutes() {
  return (
    <Navigator screenOptions={{ headerShown: false }}>
      <Screen name="profileMain" component={Profile} />
      <Screen name="editProfile" component={EditProfile} />
      <Screen name="security" component={Security} />
      <Screen name="notifications" component={Notifications} />
      <Screen name="admin" component={AdminDashboard} />
    </Navigator>
  );
}
