import { NavigatorScreenParams } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { StackScreenProps } from "@react-navigation/stack";

export type NewsStackParamList = {
  newsList: undefined;
  createNews: undefined;
  newsDetail: { newsId: string };
  editNews: { newsId: string };
};

export type EventsStackParamList = {
  eventsList: undefined;
  createEvent: undefined;
  eventDetail: { eventId: string };
  editEvent: { eventId: string };
};

export type FaunaFloraStackParamList = {
  faunaFloraList: undefined;
  createFaunaFlora: undefined;
  faunaFloraDetails: { faunaFloraId: string; type: "FAUNA" | "FLORA" };
  editFaunaFlora: { faunaFloraId: string; type: "FAUNA" | "FLORA" };
};

export type RootParamList = {
  // Telas de Autenticação
  welcome: undefined;
  login: undefined;
  register: undefined;

  // Tela Home
  home: undefined;

  // Tela Notícias
  news: NavigatorScreenParams<NewsStackParamList>;

  // Tela Eventos
  events: NavigatorScreenParams<EventsStackParamList>;

  // Pilha de Fauna e Flora
  faunaFlora: NavigatorScreenParams<FaunaFloraStackParamList>;

  // Tela Profile
  profile: undefined;
};

export type AppTabScreenProps<T extends keyof RootParamList> =
  BottomTabScreenProps<RootParamList, T>;

export type AppStackScreenProps<T extends keyof RootParamList> =
  StackScreenProps<RootParamList, T>;

export type NewsStackScreenProps<T extends keyof NewsStackParamList> =
  StackScreenProps<NewsStackParamList, T>;

export type EventsStackScreenProps<T extends keyof EventsStackParamList> =
  StackScreenProps<EventsStackParamList, T>;

export type FaunaFloraStackScreenProps<
  T extends keyof FaunaFloraStackParamList,
> = StackScreenProps<FaunaFloraStackParamList, T>;
