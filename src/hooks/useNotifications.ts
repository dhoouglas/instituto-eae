import { useState, useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { useAuth } from "@clerk/clerk-expo";
import api from "@/lib/api";

const MAX_RETRIES = 5;
const RETRY_BASE_DELAY_MS = 1000;

async function sendPushTokenWithRetry(
  token: string,
  getToken: (opts: any) => Promise<string | null>
) {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const authToken = await getToken({ template: "api-testing-token" });
      if (!authToken) return;

      await api.post(
        "/notifications/users/push-token",
        { pushToken: token },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      console.log(`✅ Push token registrado com sucesso (tentativa ${attempt + 1})`);
      return;
    } catch (error: any) {
      const status = error.response?.status;
      const isUserNotFound = status === 404 || status === 400;

      if (isUserNotFound && attempt < MAX_RETRIES - 1) {
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
        console.warn(`⏳ Usuário ainda não existe no banco. Tentando novamente em ${delay}ms... (${attempt + 1}/${MAX_RETRIES})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        console.error("❌ Erro ao salvar push token:", error.response?.data || error.message);
        return;
      }
    }
  }
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  // if (Device.isDevice) {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    console.log("Failed to get push token for push notification!");
    return;
  }
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    console.log(
      "================================================================="
    );
    console.log("✅ SEU TOKEN PARA NOTIFICAÇÕES PUSH É ESTE AQUI: ✅");
    console.log(token);
    console.log(
      "================================================================="
    );
  } catch (error) {
    console.error("Error getting push token:", error);
  }
  // } else {
  //   console.log("Must use physical device for Push Notifications");
  // }

  return token;
}

export function useNotifications() {
  const { getToken } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState("");
  const [notification, setNotification] = useState<
    Notifications.Notification | false
  >(false);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  // Ref keeps getToken always up-to-date inside the retry closure (avoids stale closure)
  const getTokenRef = useRef(getToken);
  useEffect(() => { getTokenRef.current = getToken; }, [getToken]);

  useEffect(() => {
    registerForPushNotificationsAsync().then(async (token) => {
      if (token) {
        setExpoPushToken(token);
        // Pass a stable wrapper that always calls the latest getToken
        sendPushTokenWithRetry(token, (opts) => getTokenRef.current(opts));
      }
    });

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(response);
      });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return {
    expoPushToken,
    notification,
  };
}
