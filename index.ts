import { registerRootComponent } from 'expo';

// MUST be imported before App so the background location task is registered
// before any component tries to start it.
import './src/tasks/locationTask';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
