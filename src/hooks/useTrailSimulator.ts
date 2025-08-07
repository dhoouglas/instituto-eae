import { useEffect, useRef } from "react";
import * as Location from "expo-location";

type Callback = (location: Location.LocationObject) => void;

interface TrailSimulatorOptions extends Location.LocationOptions {
  enabled: boolean;
  coordinates: Location.LocationObjectCoords[];
}

/**
 * Hook para simular o percurso ao longo de um conjunto de coordenadas de uma trilha.
 * Emite uma coordenada do array `coordinates` a cada 1.5 segundos quando ativado.
 * @param options - Opções de localização, incluindo `enabled` e `coordinates`.
 * @param callback - A função a ser chamada com cada nova localização simulada.
 */
export const useTrailSimulator = (
  options: TrailSimulatorOptions,
  callback: Callback
) => {
  const currentIndex = useRef(0);

  useEffect(() => {
    // Reseta o índice se a simulação for desativada, pausada ou se as coordenadas mudarem.
    if (
      !options.enabled ||
      !options.coordinates ||
      options.coordinates.length === 0
    ) {
      currentIndex.current = 0;
      return;
    }

    const intervalId = setInterval(() => {
      if (currentIndex.current < options.coordinates.length) {
        const currentLocation = {
          coords: options.coordinates[currentIndex.current],
          timestamp: Date.now(),
        };
        // console.log("Simulando passo:", currentIndex.current, currentLocation);
        callback(currentLocation);
        currentIndex.current++;
      } else {
        // Limpa o intervalo quando chega ao fim da trilha
        clearInterval(intervalId);
      }
    }, 1500); // Emite uma coordenada a cada 1.5 segundos

    return () => clearInterval(intervalId);
  }, [options.enabled, options.coordinates, callback]);
};
