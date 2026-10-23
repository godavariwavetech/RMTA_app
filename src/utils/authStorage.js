// Persists the logged-in user across app reloads/relaunches so admins and
// technicians stay signed in. Backed by AsyncStorage (device storage).
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'rmta_auth_user';

export async function saveUser(user) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(user));
  } catch (e) {
    // Non-fatal: the user just won't be remembered across restarts.
  }
}

export async function loadUser() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export async function clearUser() {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch (e) {
    // ignore
  }
}
