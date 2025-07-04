import { NavigatorScreenParams } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { StackScreenProps } from "@react-navigation/stack";

export type EventsStackParamList = {
  eventsList: undefined;
  createEvent: undefined;
  eventDetail: { eventId: string };
  editEvent: { eventId: string };
};

export type RootParamList = {
  // Telas de Autenticação
  welcome: undefined;
  login: undefined;
  register: undefined;

  // Tela Home
  home: undefined;

  // Tela Eventos
  events: NavigatorScreenParams<EventsStackParamList>;

  // Pilha de Fauna e Flora
  faunaeflora: undefined;
  faunaFloraList: undefined;
  createFaunaFlora: undefined;

  // Tela Profile
  profile: undefined;
};

export type AppTabScreenProps<T extends keyof RootParamList> =
  BottomTabScreenProps<RootParamList, T>;

export type AppStackScreenProps<T extends keyof RootParamList> =
  StackScreenProps<RootParamList, T>;

export type EventsStackScreenProps<T extends keyof EventsStackParamList> =
  StackScreenProps<EventsStackParamList, T>;
