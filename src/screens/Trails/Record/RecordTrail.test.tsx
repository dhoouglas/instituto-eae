import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { RecordTrailScreen } from "./index";
import * as Location from "expo-location";
import { Alert } from "react-native";

// Mock das dependências
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock("@clerk/clerk-expo", () => ({
  useUser: () => ({
    user: {
      fullName: "Test User",
      imageUrl: "https://test.com/avatar.png",
    },
  }),
}));

jest.mock("@expo/vector-icons", () => {
  const { Text } = require("react-native");
  return {
    FontAwesome: ({ name }: { name: string }) => <Text>{name}</Text>,
  };
});

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
}));

jest.mock("expo-location");
jest.spyOn(Alert, "alert");

// Mock para os hooks customizados
jest.mock("@/hooks/useStopwatch", () => ({
  useStopwatch: () => ({
    time: 0,
    formattedTime: "00:00:00",
    isActive: false,
    isPaused: true,
    start: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    reset: jest.fn(),
  }),
}));

// Mock para o useLocation para permitir a simulação de atualização de localização
let locationCallback: ((location: Location.LocationObject) => void) | undefined;

jest.mock("@/hooks/useLocation", () => ({
  useLocation: jest.fn().mockImplementation(({ onLocationUpdate }) => {
    locationCallback = onLocationUpdate;
  }),
}));

jest.mock("@/hooks/useMockedLocation", () => ({
  useMockedLocation: jest.fn(),
}));

// Mock para o MapView para evitar erros de renderização no Jest
jest.mock("react-native-maps", () => {
  const React = require("react");
  const { View } = require("react-native");

  const MockMapView = React.forwardRef((props: any, ref: any) => {
    // Mock para as funções do MapView que são chamadas
    const mapRef = {
      animateToRegion: jest.fn(),
      animateCamera: jest.fn(),
      getCamera: jest.fn().mockResolvedValue({ zoom: 15 }),
    };

    // Expõe o ref para o teste
    React.useImperativeHandle(ref, () => mapRef);

    return <View {...props}>{props.children}</View>;
  });

  const MockPolyline = (props: any) => <View {...props} />;
  const MockMarker = (props: any) => <View {...props} />;

  return {
    __esModule: true,
    default: MockMapView,
    Polyline: MockPolyline,
    Marker: MockMarker,
    PROVIDER_GOOGLE: "google",
  };
});

describe("RecordTrailScreen", () => {
  beforeEach(() => {
    // Limpa os mocks antes de cada teste
    jest.clearAllMocks();
    mockNavigate.mockClear();
    mockGoBack.mockClear();

    // Mock da permissão de localização (caso de sucesso)
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue(
      {
        status: "granted",
      }
    );

    // Mock da localização atual
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: {
        latitude: -23.55052,
        longitude: -46.633308,
        altitude: 760,
        accuracy: 5,
        altitudeAccuracy: 5,
        heading: 0,
        speed: 0,
      },
      timestamp: Date.now(),
    });
  });

  it("should render correctly and request location permission", async () => {
    const { getByText, findByText } = render(<RecordTrailScreen />);

    // Verifica se a permissão foi solicitada
    expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalledTimes(1);

    // Aguarda a obtenção da localização e a renderização do mapa (mockado como View)
    // O texto "Gravar Nova Trilha" do Header deve estar visível
    await findByText("Gravar Nova Trilha");

    // Verifica se o botão de iniciar gravação está presente
    expect(getByText("Gravar Nova Trilha")).toBeTruthy();
  });

  it("should handle location permission denial", async () => {
    // Mock da permissão de localização (caso de falha)
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue(
      {
        status: "denied",
      }
    );

    const { getByText } = render(<RecordTrailScreen />);

    // Espera o Alert ser chamado
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Permissão Negada",
        "Para gravar uma trilha, precisamos da sua permissão para acessar a localização."
      );
    });

    // Verifica se a navegação para a tela anterior foi chamada
    await waitFor(() => {
      expect(mockGoBack).toHaveBeenCalledTimes(1);
    });
  });

  it("should start and pause recording", async () => {
    const { findByText } = render(<RecordTrailScreen />);

    // Aguarda a renderização inicial e encontra o botão de play
    const recordButton = await findByText("play");

    // Inicia a gravação
    fireEvent.press(recordButton);

    // Verifica se o botão mudou para "pause"
    const pauseButton = await findByText("pause");
    expect(pauseButton).toBeTruthy();

    // Pausa a gravação
    fireEvent.press(pauseButton);

    // Verifica se o botão voltou para "play"
    const playButtonAgain = await findByText("play");
    expect(playButtonAgain).toBeTruthy();
  });

  it("should finish recording and navigate to form when path is valid", async () => {
    const { findByText } = render(<RecordTrailScreen />);

    // Inicia a gravação
    const recordButton = await findByText("play");
    fireEvent.press(recordButton);
    const pauseButton = await findByText("pause"); // Aguarda o modo de gravação

    // Simula a atualização da localização para criar um percurso
    act(() => {
      if (locationCallback) {
        const location1 = {
          coords: {
            latitude: 1,
            longitude: 1,
            accuracy: 5,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        };
        const location2 = {
          coords: {
            latitude: 2,
            longitude: 2,
            accuracy: 5,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        };
        locationCallback(location1);
        locationCallback(location2);
      }
    });

    // Pausa a gravação
    fireEvent.press(pauseButton);

    // Finaliza a gravação
    const finishButton = await findByText("check");
    fireEvent.press(finishButton);

    // Verifica se a navegação ocorreu com os dados corretos
    expect(mockNavigate).toHaveBeenCalledWith("TrailForm", {
      coordinates: [
        {
          latitude: 1,
          longitude: 1,
          accuracy: 5,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        {
          latitude: 2,
          longitude: 2,
          accuracy: 5,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
      ],
      duration: 0, // O tempo é mockado para 0
      waypointOrders: [],
    });
  });

  it("should discard recording", async () => {
    const { findByText } = render(<RecordTrailScreen />);

    // Inicia a gravação
    const recordButton = await findByText("play");
    fireEvent.press(recordButton);
    const pauseButton = await findByText("pause");

    // Simula a adição de pontos ao percurso para que o botão de descarte apareça
    act(() => {
      if (locationCallback) {
        locationCallback({
          coords: {
            latitude: 1,
            longitude: 1,
            accuracy: 5,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        });
      }
    });

    // Pausa a gravação
    fireEvent.press(pauseButton);

    // Encontra e pressiona o botão de descartar
    const discardButton = await findByText("trash");
    fireEvent.press(discardButton);

    // Verifica se o alerta de confirmação foi exibido
    expect(Alert.alert).toHaveBeenCalledWith(
      "Descartar Gravação",
      "Tem certeza que deseja descartar o percurso atual?",
      expect.any(Array) // Verifica se o terceiro argumento é um array de botões
    );
  });
});
