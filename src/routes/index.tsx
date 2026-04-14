import { NavigationContainer } from "@react-navigation/native";
import { useAuth } from "@clerk/clerk-expo";
import { View } from "react-native";

import { AppRoutes } from "./app.routes";
import { AuthRoutes } from "./auth.routes";
import { Loading } from "@/components/Loading";
import Toast from "react-native-toast-message";

export function Routes() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Loading />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isSignedIn ? <AppRoutes /> : <AuthRoutes />}
      <Toast />
    </NavigationContainer>
  );
}
