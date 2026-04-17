import { useState, useEffect, useRef } from "react";
import * as Location from "expo-location";
import {
  LOCATION_TASK_NAME,
  registerLocationCallback,
  unregisterLocationCallback,
} from "@/tasks/locationTask";

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
  // Foreground watcher — used only when requestBackground=false
  const foregroundWatcher = useRef<Location.LocationSubscription | null>(null);

  // --- Permission request (runs once) ---
  useEffect(() => {
    if (hasPermission) return;

    const requestPermissions = async () => {
      const { status: foregroundStatus } =
        await Location.requestForegroundPermissionsAsync();

      if (foregroundStatus !== "granted") {
        onError?.("A permissão para acessar a localização foi negada.");
        return;
      }

      if (requestBackground) {
        const { status: backgroundStatus } =
          await Location.requestBackgroundPermissionsAsync();

        if (backgroundStatus !== "granted") {
          console.warn("Permissão de localização em segundo plano negada.");
          // Still allow foreground tracking
        }
      }

      setHasPermission(true);
    };

    requestPermissions();
  }, [requestBackground, hasPermission]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Location tracking ---
  useEffect(() => {
    let isMounted = true;

    if (!enabled || !hasPermission) {
      // Stop whatever is running
      if (foregroundWatcher.current) {
        foregroundWatcher.current.remove();
        foregroundWatcher.current = null;
      }
      Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME)
        .then((started) => {
          if (started) Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        })
        .catch(() => { });
      unregisterLocationCallback();
      return;
    }

    if (requestBackground) {
      // --- Background mode: uses TaskManager task ---
      const startBackground = async () => {
        try {
          const alreadyRunning =
            await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
          if (!alreadyRunning) {
            await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
              accuracy: Location.Accuracy.BestForNavigation,
              timeInterval: 1000,
              distanceInterval: 1,
              // Show a foreground notification on Android while in background
              foregroundService: {
                notificationTitle: "EAE — Rastreamento ativo",
                notificationBody:
                  "Sua localização está sendo registrada em segundo plano.",
                notificationColor: "#16a34a",
              },
              // iOS: pause updates only when clearly stationary
              pausesUpdatesAutomatically: false,
              showsBackgroundLocationIndicator: true,
            });
          }
          if (isMounted) registerLocationCallback(onLocationUpdate);
        } catch (err) {
          console.error("[useLocation] Erro ao iniciar background:", err);
        }
      };
      startBackground();
    } else {
      // --- Foreground mode: uses watchPositionAsync ---
      const startForeground = async () => {
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
          foregroundWatcher.current = sub;
        }
      };
      startForeground();
    }

    return () => {
      isMounted = false;

      // Cleanup foreground watcher
      if (foregroundWatcher.current) {
        foregroundWatcher.current.remove();
        foregroundWatcher.current = null;
      }

      // Cleanup background task
      if (requestBackground) {
        unregisterLocationCallback();
        Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME)
          .then((started) => {
            if (started) Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
          })
          .catch(() => { });
      }
    };
  }, [enabled, hasPermission, requestBackground, onLocationUpdate]);

  return { hasPermission };
};
