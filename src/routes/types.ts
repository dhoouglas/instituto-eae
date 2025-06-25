import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { StackScreenProps } from "@react-navigation/stack";

export type RootParamList = {
  // Telas de Autenticação
  welcome: undefined;
  login: undefined;
  register: undefined;

  // Telas do Navegador de Abas
  home: undefined;
  events: undefined;
  faunaeflora: undefined;
  profile: undefined;

  // Telas DENTRO da pilha de Eventos
  eventsList: undefined;
  createEvent: undefined;
};

export type AppTabScreenProps<T extends keyof RootParamList> =
  BottomTabScreenProps<RootParamList, T>;
export type AppStackScreenProps<T extends keyof RootParamList> =
  StackScreenProps<RootParamList, T>;
