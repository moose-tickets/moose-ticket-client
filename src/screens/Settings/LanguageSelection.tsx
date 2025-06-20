import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AppLayout from '../../wrappers/layout';
import GoBackHeader from '../../components/GoBackHeader';
import { ThemedView, ThemedText, ThemedButton, ThemedScrollView } from '../../components/ThemedComponents';
import { useTheme } from '../../wrappers/ThemeProvider';

const defaultLanguage = 'English';
const defaultRegion = 'Canada';

const LanguageAndRegion = () => {
  const navigation = useNavigation();
  const { theme, presets } = useTheme();

  const [selectedLanguage, setSelectedLanguage] = useState(defaultLanguage);
  const [selectedRegion, setSelectedRegion] = useState(defaultRegion);

  const languages = ['English', 'Français'];

  const regions = ['Canada', 'United States', 'United Kingdom', 'Australia'];

  const handleReset = () => {
    setSelectedLanguage(defaultLanguage);
    setSelectedRegion(defaultRegion);
  };

  const handleSave = () => {
    const prefs = { language: selectedLanguage, region: selectedRegion };
    console.log('Saved preferences:', prefs);
    navigation.goBack();
  };

  return (
    <AppLayout scrollable={false}>
      <ThemedScrollView className='flex-1 px-5'>
        {/* Header */}
        <GoBackHeader
          screenTitle='Language & Region'
        />

        {/* Language Section */}
        <ThemedText variant="primary" weight="medium" size="base" className='mt-2 mb-3'>Language</ThemedText>
        {languages.map((lang, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => setSelectedLanguage(lang)}
            className='flex-row items-center mb-3'
          >
            <ThemedView
              className={`w-5 h-5 rounded-full border mr-3 ${
                selectedLanguage === lang
                  ? 'border-primary bg-primary'
                  : 'border-border'
              }`}
            />
            <ThemedText variant="primary" size="base">{lang}</ThemedText>
          </TouchableOpacity>
        ))}

        {/* Region Section */}
        <ThemedText variant="primary" weight="medium" size="base" className='mt-6 mb-3'>Region</ThemedText>
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
          Save Changes
        </ThemedButton>

        {/* Reset Link */}
        <TouchableOpacity onPress={handleReset} className='mt-4 items-center'>
          <ThemedText variant="primary" weight="medium" className='underline'>
            Reset to Default
          </ThemedText>
        </TouchableOpacity>
      </ThemedScrollView>
    </AppLayout>
  );
};

export default LanguageAndRegion;
