import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, I18nManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import AppLayout from '../../wrappers/layout';
import GoBackHeader from '../../components/GoBackHeader';
import { ThemedView, ThemedText, ThemedButton, ThemedScrollView } from '../../components/ThemedComponents';
import { useTheme } from '../../wrappers/ThemeProvider';
import { changeLanguage, getSupportedLanguages, isRTL } from '../../locales';

const defaultLanguage = 'en';
const defaultRegion = 'Canada';

const LanguageAndRegion = () => {
  const navigation = useNavigation();
  const { theme, presets } = useTheme();
  const { t, i18n } = useTranslation();

  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || defaultLanguage);
  const [selectedRegion, setSelectedRegion] = useState(defaultRegion);

  const languages = getSupportedLanguages();

  const regions = ['Canada', 'United States', 'United Kingdom', 'Australia'];

  useEffect(() => {
    setSelectedLanguage(i18n.language || defaultLanguage);
  }, [i18n.language]);

  const handleReset = async () => {
    setSelectedLanguage(defaultLanguage);
    setSelectedRegion(defaultRegion);
    await changeLanguage(defaultLanguage);
    
    // Handle RTL for Arabic
    const rtl = isRTL(defaultLanguage);
    I18nManager.allowRTL(rtl);
    I18nManager.forceRTL(rtl);
  };

  const handleSave = async () => {
    const prefs = { language: selectedLanguage, region: selectedRegion };
    console.log('Saved preferences:', prefs);
    
    await changeLanguage(selectedLanguage);
    
    // Handle RTL for Arabic
    const rtl = isRTL(selectedLanguage);
    I18nManager.allowRTL(rtl);
    I18nManager.forceRTL(rtl);
    
    navigation.goBack();
  };

  const handleLanguageSelect = (languageCode: string) => {
    setSelectedLanguage(languageCode);
  };

  return (
    <AppLayout scrollable={false}>
      <ThemedScrollView className='flex-1 px-5'>
        {/* Header */}
        <GoBackHeader
          screenTitle={t('settings.languageAndRegion')}
        />

        {/* Language Section */}
        <ThemedText variant="primary" weight="medium" size="base" className='mt-2 mb-3'>{t('settings.language')}</ThemedText>
        {languages.map((lang, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => handleLanguageSelect(lang.code)}
            className='flex-row items-center mb-3'
          >
            <ThemedView
              className={`w-5 h-5 rounded-full border mr-3 ${
                selectedLanguage === lang.code
                  ? 'border-primary bg-primary'
                  : 'border-border'
              }`}
            />
            <ThemedText variant="primary" size="base">{lang.nativeName}</ThemedText>
          </TouchableOpacity>
        ))}

        {/* Region Section */}
        <ThemedText variant="primary" weight="medium" size="base" className='mt-6 mb-3'>{t('settings.region')}</ThemedText>
        {regions.map((region, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => setSelectedRegion(region)}
            className='flex-row items-center mb-3'
          >
            <ThemedView
              className={`w-5 h-5 rounded-full border mr-3 ${
                selectedRegion === region
                  ? 'border-primary bg-primary'
                  : 'border-border'
              }`}
            />
            <ThemedText variant="primary" size="base">{region}</ThemedText>
          </TouchableOpacity>
        ))}

        {/* Save Button */}
        <ThemedButton
          onPress={handleSave}
          variant="primary"
          size="lg"
          className='mt-8'
        >
          {t('settings.saveChanges')}
        </ThemedButton>

        {/* Reset Link */}
        <TouchableOpacity onPress={handleReset} className='mt-4 items-center'>
          <ThemedText variant="primary" weight="medium" className='underline'>
            {t('settings.resetToDefault')}
          </ThemedText>
        </TouchableOpacity>
      </ThemedScrollView>
    </AppLayout>
  );
};

export default LanguageAndRegion;
