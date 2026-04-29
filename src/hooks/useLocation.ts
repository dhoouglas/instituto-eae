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
  const [hasBackgroundPermission, setHasBackgroundPermission] = useState(false);
  // Foreground watcher — used only when background is not requested or not granted
  const foregroundWatcher = useRef<Location.LocationSubscription | null>(null);

  // --- Permission request (runs once) ---
  useEffect(() => {
    if (hasPermission) return;

    const checkAndRequestPermissions = async () => {
      // 1. Check existing foreground permission
      let foreground = await Location.getForegroundPermissionsAsync();
      if (foreground.status !== "granted") {
        foreground = await Location.requestForegroundPermissionsAsync();
      }

      if (foreground.status !== "granted") {
        onError?.("A permissão para acessar a localização foi negada.");
        return;
      }

      if (requestBackground) {
        // 2. Check existing background permission
        let background = await Location.getBackgroundPermissionsAsync();
        if (background.status !== "granted") {
          background = await Location.requestBackgroundPermissionsAsync();
        }

        if (background.status !== "granted") {
          console.warn("Permissão de localização em segundo plano negada.");
          // Still allow foreground tracking
          setHasBackgroundPermission(false);
        } else {
          setHasBackgroundPermission(true);
        }
      }

      setHasPermission(true);
    };

    checkAndRequestPermissions();
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

    const shouldUseBackground = requestBackground && hasBackgroundPermission;

    if (shouldUseBackground) {
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
          // If background fails for some reason despite permissions, 
          // we could potentially fallback to foreground here, but ideally permissions catch it.
        }
      };
      startBackground();
    } else {
      // --- Foreground mode: uses watchPositionAsync ---
      const startForeground = async () => {
        try {
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
        } catch (err) {
          console.error("[useLocation] Erro ao iniciar foreground:", err);
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
      if (shouldUseBackground) {
        unregisterLocationCallback();
        Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME)
          .then((started) => {
            if (started) Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
          })
          .catch(() => { });
      }
    };
  }, [enabled, hasPermission, requestBackground, hasBackgroundPermission, onLocationUpdate]);

  return { hasPermission };
};
