export type RootStackParamList = {
  welcome: undefined;
  login: undefined;
  register: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
