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

      if (requestBackground) {
        const { status: backgroundStatus } =
          await Location.requestBackgroundPermissionsAsync();
        if (backgroundStatus !== "granted") {
          onError?.(
            "A permissão para acessar a localização em segundo plano foi negada."
          );
        }
      }

      setHasPermission(true);
    };

    requestPermissions();
  }, [requestBackground, onError]);

  useEffect(() => {
    if (enabled && hasPermission) {
      const startWatching = async () => {
        watcher.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 1000,
            distanceInterval: 1,
          },
          (location) => {
            onLocationUpdate(location);
          }
        );
      };
      startWatching();
    } else {
      if (watcher.current) {
        watcher.current.remove();
        watcher.current = null;
      }
    }

    return () => {
      if (watcher.current) {
        watcher.current.remove();
        watcher.current = null;
      }
    };
  }, [enabled, hasPermission, onLocationUpdate]);

  return { hasPermission };
};
