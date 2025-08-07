import { NavigatorScreenParams } from "@react-navigation/native";
import {
  BottomTabScreenProps,
  BottomTabNavigationProp,
} from "@react-navigation/bottom-tabs";
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
  faunaFloraList: { type?: "FAUNA" | "FLORA" } | undefined;
  createFaunaFlora: undefined;
  faunaFloraDetails: { faunaFloraId: string; type: "FAUNA" | "FLORA" };
  editFaunaFlora: { faunaFloraId: string; type: "FAUNA" | "FLORA" };
};

export type TrailStackParamList = {
  TrailList: undefined;
  RecordTrail: { trailId?: string };
  DraftList: undefined;
  TrailDetails: { trailId: string };
  FollowTrail: { trailId: string };
  TrailForm: {
    trailId?: string;
    coordinates?: { latitude: number; longitude: number }[];
    waypointOrders?: number[];
    duration?: number;
  };
};

export type ProfileStackParamList = {
  profileMain: undefined;
  editProfile: undefined;
  security: undefined;
  notifications: undefined;
  admin: undefined;
};

export type AdminStackParamList = {
  adminDashboard: undefined;
  // Adicionar outras telas de admin aqui no futuro
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

  // Pilha de Trilhas
  trails: NavigatorScreenParams<TrailStackParamList>;

  // Tela Profile
  profile: NavigatorScreenParams<ProfileStackParamList>;
};

export type AppNavigatorRoutesProps = BottomTabNavigationProp<RootParamList>;

export type AppTabScreenProps<T extends keyof RootParamList> =
  BottomTabScreenProps<RootParamList, T>;

export type AppStackScreenProps<T extends keyof RootParamList> =
  StackScreenProps<RootParamList, T>;

export type ProfileStackScreenProps<T extends keyof ProfileStackParamList> =
  StackScreenProps<ProfileStackParamList, T>;

export type AdminStackScreenProps<T extends keyof AdminStackParamList> =
  StackScreenProps<AdminStackParamList, T>;

export type NewsStackScreenProps<T extends keyof NewsStackParamList> =
  StackScreenProps<NewsStackParamList, T>;

export type EventsStackScreenProps<T extends keyof EventsStackParamList> =
  StackScreenProps<EventsStackParamList, T>;

export type FaunaFloraStackScreenProps<
  T extends keyof FaunaFloraStackParamList,
> = StackScreenProps<FaunaFloraStackParamList, T>;

export type TrailStackScreenProps<T extends keyof TrailStackParamList> =
  StackScreenProps<TrailStackParamList, T>;
