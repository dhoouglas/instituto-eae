import React from "react";
import { useSSO } from "@clerk/clerk-expo";
import { Alert } from "react-native";
import { handleClerkError } from "@/utils/errors/clerkErrorHandler";

export type SocialStrategy = "oauth_google" | "oauth_facebook";

export function useSocialAuth() {
  const { startSSOFlow } = useSSO();

  const handleSocialPress = React.useCallback(
    async (strategy: SocialStrategy) => {
      try {
        const { createdSessionId, setActive } = await startSSOFlow({
          strategy,
        });

        if (createdSessionId && setActive) {
          await setActive({ session: createdSessionId });
        }
      } catch (err) {
        console.error("Erro no SSO", err);
        const errorMessage = handleClerkError(err);
        Alert.alert("Erro na Autenticação", errorMessage);
      }
    },
    [startSSOFlow]
  );

  return {
    handleSocialPress,
  };
}
