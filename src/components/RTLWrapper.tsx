import React from 'react';
import { View, I18nManager } from 'react-native';
import { useTranslation } from 'react-i18next';
import { isRTL } from '../locales';

interface RTLWrapperProps {
  children: React.ReactNode;
  style?: any;
  className?: string;
}

export const RTLWrapper: React.FC<RTLWrapperProps> = ({ children, style, className }) => {
  const { i18n } = useTranslation();
  const isRTLLanguage = isRTL(i18n.language);

  React.useEffect(() => {
    I18nManager.allowRTL(isRTLLanguage);
    I18nManager.forceRTL(isRTLLanguage);
  }, [isRTLLanguage]);

  return (
    <View 
      style={[
        style,
        isRTLLanguage && { flexDirection: 'row-reverse' }
      ]}
      className={className}
    >
      {children}
    </View>
  );
};

export default RTLWrapper;