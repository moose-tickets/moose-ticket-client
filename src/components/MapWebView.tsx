// src/components/MapWebView.tsx

import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../wrappers/ThemeProvider';

export interface MapWebViewProps {
  latitude: number;
  longitude: number;
  zoom?: number;             // Google maps zoom level (1–20), default 15
  apiKey?: string;           // optional Google Maps Embed API key
  style?: StyleProp<ViewStyle>;
}

export default function MapWebView({
  latitude,
  longitude,
  zoom = 15,
  apiKey,
  style,
}: MapWebViewProps) {
  const { theme } = useTheme();
  const embedUrl = apiKey
    ? `https://www.google.com/maps/embed/v1/view?key=${apiKey}` +
      `&center=${latitude},${longitude}&zoom=${zoom}`
    : `https://www.google.com/maps?q=${latitude},${longitude}` +
      `&z=${zoom}&output=embed`;

  // Theme-aware background color for loading state
  const backgroundColor = theme === 'dark' ? '#0B0D10' : '#FFFFFF';
  const borderColor = theme === 'dark' ? '#2D3748' : '#E5E7EB';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" 
              content="initial-scale=1.0, maximum-scale=1.0"/>
        <style>
          body, html {
            margin: 0;
            padding: 0;
            height: 100%;
            background-color: ${backgroundColor};
          }
          iframe {
            border-radius: 8px;
          }
        </style>
      </head>
      <body>
        <iframe
          width="100%" height="100%" frameborder="0" 
          style="border: 1px solid ${borderColor}; border-radius: 8px;"
          src="${embedUrl}"
          allowfullscreen>
        </iframe>
      </body>
    </html>
  `;

  return (
    <WebView
      originWhitelist={['*']}
      source={{ html }}
      style={style}
      scrollEnabled={false}
    />
  );
}
