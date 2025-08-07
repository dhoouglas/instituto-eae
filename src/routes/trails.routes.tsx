import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

import { TrailList } from "../screens/Trails/List";
import { TrailDetails } from "../screens/Trails/Details";
import { TrailForm } from "../screens/Trails/Form";
import { RecordTrailScreen } from "../screens/Trails/Record";
import { DraftListScreen } from "../screens/Trails/Drafts";
import { FollowTrailScreen } from "../screens/Trails/Follow";

const { Navigator, Screen } = createStackNavigator();

export function TrailRoutes() {
  return (
    <Navigator screenOptions={{ headerShown: false }}>
      <Screen name="TrailList" component={TrailList} />
      <Screen name="RecordTrail" component={RecordTrailScreen} />
      <Screen name="DraftList" component={DraftListScreen} />
      <Screen name="TrailDetails" component={TrailDetails} />
      <Screen name="FollowTrail" component={FollowTrailScreen} />
      <Screen name="TrailForm" component={TrailForm} />
    </Navigator>
  );
}
