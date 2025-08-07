import { useEffect, useRef } from "react";
import * as Location from "expo-location";

// Coordenadas para simular o percurso
const mockedCoordinates: Location.LocationObjectCoords[] = [
  {
    latitude: -22.760135,
    longitude: -43.47408,
    altitude: null,
    accuracy: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
  },
  {
    latitude: -22.7605,
    longitude: -43.4745,
    altitude: null,
    accuracy: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
  },
  {
    latitude: -22.761,
    longitude: -43.475,
    altitude: null,
    accuracy: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
  },
  {
    latitude: -22.7615,
    longitude: -43.4748,
    altitude: null,
    accuracy: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
  },
  {
    latitude: -22.762,
    longitude: -43.4746,
    altitude: null,
    accuracy: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
  },
];

type Callback = (location: Location.LocationObject) => void;

/**
 * Hook para simular o watchPositionAsync da Expo Location.
 * Emite uma coordenada do array `mockedCoordinates` a cada 1.5 segundos quando ativado.
 * @param options - Opções de localização, incluindo o parâmetro `enabled`.
 * @param callback - A função a ser chamada com cada nova localização simulada.
 */
export const useMockedLocation = (
  options: Location.LocationOptions & { enabled: boolean },
  callback: Callback
) => {
  const currentIndex = useRef(0);

  useEffect(() => {
    if (!options.enabled) {
      // Reseta o índice se a gravação for parada
      currentIndex.current = 0;
      return;
    }

    const intervalId = setInterval(() => {
      if (currentIndex.current < mockedCoordinates.length) {
        const currentLocation = {
          coords: mockedCoordinates[currentIndex.current],
          timestamp: Date.now(),
        };
        callback(currentLocation);
        currentIndex.current++;
      } else {
        clearInterval(intervalId);
      }
    }, 1500); // Emite uma coordenada a cada 1.5 segundos

    return () => clearInterval(intervalId);
  }, [options.enabled, callback]);
};
