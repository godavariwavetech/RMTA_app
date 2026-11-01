import AsyncStorage from '@react-native-async-storage/async-storage';
import ReactNativeBiometrics from 'react-native-biometrics';

// App lock: when the app opens for an already logged-in member it asks for Face ID /
// fingerprint, falling back to the phone's own passcode / PIN / pattern. Nothing is stored
// by the app: the phone's security does the checking.
//
// allowDeviceCredentials: true makes iOS use "device owner authentication" (biometrics, then
// passcode) and Android use biometrics OR the screen lock (Android 11+; older Androids
// accept biometrics only).
const biometrics = new ReactNativeBiometrics({ allowDeviceCredentials: true });

const ENABLED_KEY = 'rmta_app_lock_enabled';

// The lock is on by default; a member can turn it off in Settings.
export async function getAppLockEnabled() {
  try {
    const value = await AsyncStorage.getItem(ENABLED_KEY);
    return value !== 'false';
  } catch (e) {
    return true;
  }
}

export async function setAppLockEnabled(enabled) {
  try {
    await AsyncStorage.setItem(ENABLED_KEY, enabled ? 'true' : 'false');
  } catch (e) {
    // best effort
  }
}

// False when the phone has no biometrics and no screen lock: there is nothing to check
// against, so the app cannot lock itself.
export async function isLockAvailable() {
  try {
    const { available } = await biometrics.isSensorAvailable();
    return !!available;
  } catch (e) {
    return false;
  }
}

// Shows the system prompt. Resolves true only when the person passed it.
export async function authenticate(message = 'Unlock RMTA') {
  try {
    const { success } = await biometrics.simplePrompt({
      promptMessage: message,
      fallbackPromptMessage: 'Use passcode',
      cancelButtonText: 'Cancel',
    });
    return !!success;
  } catch (e) {
    return false;
  }
}
