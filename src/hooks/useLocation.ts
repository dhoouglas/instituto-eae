import { useState, useEffect, useRef } from "react";
import * as Location from "expo-location";

interface LocationOptions {
  enabled: boolean;
  requestBackground?: boolean;
  onLocationUpdate: (location: Location.LocationObject) => void;
  onError?: (error: string) => void;
}

export const useLocation = ({
  enabled,
  requestBackground = false,
  onLocationUpdate,
  onError,
}: LocationOptions) => {
  const [hasPermission, setHasPermission] = useState(false);
  const watcher = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    const requestPermissions = async () => {
      const { status: foregroundStatus } =
        await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== "granted") {
        onError?.("A permissão para acessar a localização foi negada.");
        setHasPermission(false);
        return;
      }

      // Se chegamos aqui, a localização básica (Foreground) foi permitida.
      setHasPermission(true);

      if (requestBackground) {
        // Pedimos background separadamente, mas não bloqueamos se for negado.
        const { status: backgroundStatus } =
          await Location.requestBackgroundPermissionsAsync();
        if (backgroundStatus !== "granted") {
          console.warn("Permissão de localização em segundo plano negada.");
        }
      }
    };

    requestPermissions();
  }, [requestBackground, onError]);

  useEffect(() => {
    let isMounted = true;

    if (enabled && hasPermission) {
      const startWatching = async () => {
        const sub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 1000,
            distanceInterval: 1,
          },
          (location) => {
            if (isMounted) onLocationUpdate(location);
          }
        );
        
        if (!isMounted) {
          sub.remove();
        } else {
          watcher.current = sub;
        }
      };
      startWatching();
    } else {
      if (watcher.current) {
        watcher.current.remove();
        watcher.current = null;
      }
    }

    return () => {
      isMounted = false;
      if (watcher.current) {
        watcher.current.remove();
        watcher.current = null;
      }
    };
  }, [enabled, hasPermission, onLocationUpdate]);

  return { hasPermission };
};
