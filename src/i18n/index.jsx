import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { LANGUAGES, translations } from './translations';

const KEY = 'rmta_language';

const I18nContext = createContext({
  language: 'en',
  languageChosen: false,
  ready: false,
  setLanguage: async () => {},
  t: k => k,
});

// Wrap the app once. Loads the saved language from device storage;
// `languageChosen` is false on first launch so the app can show the picker.
export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState('en');
  const [languageChosen, setLanguageChosen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(KEY);
        if (saved && translations[saved]) {
          setLanguageState(saved);
          setLanguageChosen(true);
        }
      } catch (e) {
        // fall back to English / first-run picker
      }
      setReady(true);
    })();
  }, []);

  const setLanguage = useCallback(async code => {
    if (!translations[code]) return;
    setLanguageState(code);
    setLanguageChosen(true);
    try {
      await AsyncStorage.setItem(KEY, code);
    } catch (e) {
      // non-fatal: the choice just won't survive a restart
    }
  }, []);

  const value = useMemo(
    () => ({
      language,
      languageChosen,
      ready,
      setLanguage,
      t: key => (translations[language] || {})[key] ?? translations.en[key] ?? key,
    }),
    [language, languageChosen, ready, setLanguage],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
export { LANGUAGES };
