import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './en.json';
import fr from './fr.json';
import ar from './ar.json';
import es from './es.json';

const LANGUAGE_KEY = '@language';

const resources = {
  en: { translation: en },
  fr: { translation: fr },
  ar: { translation: ar },
  es: { translation: es }
};

const initI18n = async () => {
  let savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
  
  if (!savedLanguage) {
    const deviceLanguage = Localization.locale.split('-')[0];
    savedLanguage = ['en', 'fr', 'ar', 'es'].includes(deviceLanguage) ? deviceLanguage : 'en';
  }

  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: savedLanguage,
      fallbackLng: 'en',
      
      interpolation: {
        escapeValue: false
      },
      
      react: {
        useSuspense: false
      }
    });

  return i18n;
};

export const changeLanguage = async (language: string) => {
  await AsyncStorage.setItem(LANGUAGE_KEY, language);
  await i18n.changeLanguage(language);
};

export const getSupportedLanguages = () => {
  return [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' }
  ];
};

export const isRTL = (language: string) => {
  return language === 'ar';
};

export { initI18n };
export default i18n;