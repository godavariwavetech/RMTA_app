import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  BackHandler,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { Colors } from '../Constants/Colors';
import { logoutUser } from '../redux/slices/authSlice';
import { authenticate, getAppLockEnabled, isLockAvailable } from '../utils/appLock';

// If the app was in the background longer than this, it locks again when it comes back.
const RELOCK_AFTER_MS = 30 * 1000;

// Covers the app with a lock screen until the person passes Face ID / fingerprint / the
// phone's passcode. It locks:
//   - when the app is opened and a logged-in session is restored, and
//   - when the app returns from the background after more than 30 seconds.
// It never locks the login screens (nobody is logged in), and it steps aside when the lock
// is turned off in Settings or the phone has no screen lock to check against.
export default function AppLockGate({ onLoggedOut }) {
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth?.user);
  const loggedIn = !!(user && (user.member_id || user.user_id));

  const [locked, setLocked] = useState(false);
  const [deciding, setDeciding] = useState(true); // cold start: deciding whether to lock
  const [failed, setFailed] = useState(false);
  const busy = useRef(false);
  const leftAt = useRef(null);
  const loggedInRef = useRef(loggedIn);
  loggedInRef.current = loggedIn;

  const shouldLock = useCallback(async () => {
    const [enabled, available] = await Promise.all([getAppLockEnabled(), isLockAvailable()]);
    return enabled && available;
  }, []);

  // Cold start: lock straight away when a session was restored.
  useEffect(() => {
    let active = true;
    (async () => {
      if (loggedInRef.current && (await shouldLock())) {
        if (active) setLocked(true);
      }
      if (active) setDeciding(false);
    })();
    return () => {
      active = false;
    };
  }, [shouldLock]);

  // Back from the background after a while: lock again.
  useEffect(() => {
    const sub = AppState.addEventListener('change', async state => {
      // 'inactive' also fires while the Face ID sheet is up, so only 'background' counts as leaving.
      if (state === 'background') {
        leftAt.current = Date.now();
      } else if (state === 'active') {
        const away = leftAt.current ? Date.now() - leftAt.current : 0;
        leftAt.current = null;
        if (away > RELOCK_AFTER_MS && loggedInRef.current && (await shouldLock())) {
          setFailed(false);
          setLocked(true);
        }
      }
    });
    return () => sub.remove();
  }, [shouldLock]);

  const unlock = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setFailed(false);
    const ok = await authenticate('Unlock RMTA');
    busy.current = false;
    if (ok) {
      setLocked(false);
    } else {
      setFailed(true);
    }
  }, []);

  // Ask as soon as the lock appears.
  useEffect(() => {
    if (locked && loggedIn) unlock();
  }, [locked, loggedIn, unlock]);

  // The Android Back button must not get past the lock.
  useEffect(() => {
    if (!locked || !loggedIn) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, [locked, loggedIn]);

  // Logging out (from the lock screen or anywhere else) clears the lock.
  useEffect(() => {
    if (!loggedIn) setLocked(false);
  }, [loggedIn]);

  const logOut = async () => {
    await dispatch(logoutUser());
    setLocked(false);
    if (onLoggedOut) onLoggedOut();
  };

  if (!loggedIn || (!locked && !deciding)) return null;

  // A Modal is its own full-screen window, so the lock covers the whole screen (status bar,
  // bottom bar and any other pop-up included) whatever the layout underneath is doing.
  return (
    <Modal
      visible
      animationType="none"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={() => {}}
    >
    <View style={styles.cover}>
      <View style={styles.glow} pointerEvents="none" />
      <Image source={require('../Assets/images/appLogo.png')} style={styles.logo} />
      <Text style={styles.title}>RMTA is locked</Text>
      <Text style={styles.subtitle}>
        {deciding ? 'Checking…' : 'Verify it’s you to open the app.'}
      </Text>

      {!deciding && (
        <>
          <TouchableOpacity style={styles.unlockBtn} onPress={unlock} activeOpacity={0.85}>
            {busy.current ? <ActivityIndicator color={Colors.primary} /> : <Text style={styles.unlockText}>🔓  Unlock</Text>}
          </TouchableOpacity>
          {failed && <Text style={styles.failed}>That didn’t work. Try again.</Text>}
          <TouchableOpacity onPress={logOut} hitSlop={10} style={styles.logoutLink}>
            <Text style={styles.logoutText}>Log out instead</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  cover: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  glow: {
    position: 'absolute',
    top: -120,
    right: -90,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(47,93,220,0.35)',
  },
  logo: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#FFFFFF', marginBottom: 22 },
  title: { color: '#FFFFFF', fontSize: 24, fontWeight: '800' },
  subtitle: { color: 'rgba(255,255,255,0.75)', fontSize: 14, marginTop: 6, marginBottom: 30, textAlign: 'center' },
  unlockBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    minWidth: 200,
    paddingVertical: 14,
    alignItems: 'center',
  },
  unlockText: { color: Colors.primary, fontSize: 16, fontWeight: '800' },
  failed: { color: '#FCA5A5', fontSize: 13, fontWeight: '600', marginTop: 14 },
  logoutLink: { marginTop: 26 },
  logoutText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '700', textDecorationLine: 'underline' },
});
