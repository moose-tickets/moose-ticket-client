import React from 'react';
import { ThemedText, ThemedTextProps } from './ThemedComponents';
import useAutoTranslate from '../utils/autoTranslate';

interface AutoTranslatedTextProps extends Omit<ThemedTextProps, 'children'> {
  text: string;
  type?: 'field' | 'status' | 'auto';
  fallback?: string;
}

/**
 * Component that automatically translates dynamic text content
 */
export const AutoTranslatedText: React.FC<AutoTranslatedTextProps> = ({
  text,
  type = 'auto',
  fallback,
  ...textProps
}) => {
  const { smartTranslate, translateField, translateStatus } = useAutoTranslate();

  const getTranslatedText = (): string => {
    if (!text) return fallback || '';

    switch (type) {
      case 'field':
        return translateField(text);
      case 'status':
        return translateStatus(text);
      case 'auto':
      default:
        return smartTranslate(text) as string;
    }
  };

  return (
    <ThemedText {...textProps}>
      {getTranslatedText()}
    </ThemedText>
  );
};

export default AutoTranslatedText;