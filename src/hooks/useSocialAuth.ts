import React from "react";
import { useSSO } from "@clerk/clerk-expo";
import { handleClerkError } from "@/utils/errors/clerkErrorHandler";
import Toast from "react-native-toast-message";

export type SocialStrategy = "oauth_google" | "oauth_facebook";

export function useSocialAuth() {
  const { startSSOFlow } = useSSO();

  const handleSocialPress = React.useCallback(
    async (strategy: SocialStrategy) => {
      try {
        Toast.show({
          type: "info",
          text1: "Redirecionando...",
          text2: `Aguarde enquanto preparamos o login com ${strategy === "oauth_google" ? "Google" : "Facebook"}.`,
        });

        const { createdSessionId, setActive } = await startSSOFlow({
          strategy,
        });

        if (createdSessionId && setActive) {
          await setActive({ session: createdSessionId });
        }
      } catch (err) {
        Toast.hide();

        if (String(err).includes("ERR_WEB_BROWSER_CANCELLED")) {
          return;
        }

        console.error("Erro no SSO", err);
        const errorMessage = handleClerkError(err);
        Toast.show({
          type: "error",
          text1: "Erro na Autenticação",
          text2: errorMessage,
        });
      }
    },
    [startSSOFlow]
  );

  return {
    handleSocialPress,
  };
}
