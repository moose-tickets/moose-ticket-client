import React from 'react';
import { useTranslation } from 'react-i18next';
import { ThemedView, ThemedText } from './ThemedComponents';
import useAutoTranslate from '../utils/autoTranslate';

interface MetadataDisplayProps {
  data: Record<string, any>;
  title?: string;
  className?: string;
  excludeFields?: string[];
  customLabels?: Record<string, string>;
}

/**
 * Component that displays metadata with automatic translation
 */
export const MetadataDisplay: React.FC<MetadataDisplayProps> = ({
  data,
  title,
  className = '',
  excludeFields = [],
  customLabels = {},
}) => {
  const { t } = useTranslation();
  const { translateField, translateStatus, smartTranslate } = useAutoTranslate();

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return t('common.notAvailable');
    if (typeof value === 'boolean') return value ? t('common.yes') : t('common.no');
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    if (typeof value === 'string' && value.length === 0) return t('common.notAvailable');
    
    // Try to translate status-like values
    if (typeof value === 'string') {
      const translated = translateStatus(value);
      if (translated !== value) return translated;
    }
    
    return String(value);
  };

  const getFieldLabel = (key: string): string => {
    // Use custom label if provided
    if (customLabels[key]) {
      return customLabels[key];
    }
    
    // Auto-translate the field name
    return translateField(key);
    // return key;
  };

  const filteredData = Object.entries(data).filter(
    ([key]) => !excludeFields.includes(key)
  );

  if (filteredData.length === 0) {
    return null;
  }

  return (
    <ThemedView className={`space-y-2 ${className}`}>
      {title && (
        <ThemedText weight="bold" size="lg" className="mb-3">
          {title}
        </ThemedText>
      )}
      
      {filteredData.map(([key, value]) => (
        <ThemedView key={key} className="flex-row justify-between items-center py-2 border-b border-border">
          <ThemedText variant="secondary" size="sm" className="flex-1 mr-4">
            {getFieldLabel(key)}
          </ThemedText>
          <ThemedText weight="medium" size="sm" className="flex-2 text-right">
            {formatValue(value)}
          </ThemedText>
        </ThemedView>
      ))}
    </ThemedView>
  );
};

export default MetadataDisplay;