/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { registerBackgroundHandlers } from './src/services/notifications';

registerBackgroundHandlers();

AppRegistry.registerComponent(appName, () => App);
