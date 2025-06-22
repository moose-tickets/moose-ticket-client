import React from 'react';
import { ThemedView, ThemedText } from './ThemedComponents';
import useAutoTranslate from '../utils/autoTranslate';

interface DebugMetadataProps {
  data: Record<string, any>;
}

/**
 * Debug component to show how metadata fields are being translated
 */
export const DebugMetadata: React.FC<DebugMetadataProps> = ({ data }) => {
  const { translateField } = useAutoTranslate();

  return (
    <ThemedView className="p-4 border border-red-500 rounded-lg">
      <ThemedText weight="bold" className="mb-3 text-red-600">
        Debug: Metadata Translation
      </ThemedText>
      
      {Object.entries(data).map(([key, value]) => {
        const translatedLabel = translateField(key);
        
        return (
          <ThemedView key={key} className="mb-2 p-2 bg-gray-100 rounded">
            <ThemedText size="xs" className="text-blue-600">
              Original Key: "{key}"
            </ThemedText>
            <ThemedText size="xs" className="text-green-600">
              Translated: "{translatedLabel}"
            </ThemedText>
            <ThemedText size="xs" className="text-gray-600">
              Value: {String(value)}
            </ThemedText>
          </ThemedView>
        );
      })}
    </ThemedView>
  );
};

export default DebugMetadata;