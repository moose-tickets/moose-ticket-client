import React from "react";
import { View, ScrollView } from "react-native";
import { 
  ThemedView, 
  ThemedText, 
  ThemedButton, 
  ThemedInput, 
  ThemedCard,
  StatusBadge 
} from "./ThemedComponents";
import { ThemeToggle, ThemeSelector } from "./ThemeToggle";
import { useTheme } from "../wrappers/ThemeProvider";

export const ThemeDemo = () => {
  const { theme } = useTheme();
  const [inputValue, setInputValue] = React.useState("Sample text");

  return (
    <ScrollView className="flex-1 bg-background p-4">
      <ThemedText size="2xl" weight="bold" className="mb-6 text-center">
        MooseTicket Theme Demo
      </ThemedText>

      {/* Theme Controls */}
      <ThemedCard variant="elevated" className="mb-6">
        <ThemedText size="lg" weight="semibold" className="mb-4">
          Theme Controls
        </ThemedText>
        
        <View className="mb-4">
          <ThemedText variant="secondary" className="mb-2">
            Current Theme: {theme}
          </ThemedText>
          <ThemeToggle showLabel={true} variant="selector" />
        </View>
      </ThemedCard>

      {/* Color Palette */}
      <ThemedCard className="mb-6">
        <ThemedText size="lg" weight="semibold" className="mb-4">
          Color Palette
        </ThemedText>
        
        <View className="flex-row flex-wrap gap-2 mb-4">
          <View className="bg-primary w-16 h-16 rounded-lg items-center justify-center">
            <ThemedText variant="inverse" size="xs">Primary</ThemedText>
          </View>
          <View className="bg-secondary w-16 h-16 rounded-lg items-center justify-center">
            <ThemedText variant="inverse" size="xs">Secondary</ThemedText>
          </View>
          <View className="bg-background-secondary w-16 h-16 rounded-lg border border-border items-center justify-center">
            <ThemedText size="xs">BG 2nd</ThemedText>
          </View>
          <View className="bg-background-tertiary w-16 h-16 rounded-lg border border-border items-center justify-center">
            <ThemedText size="xs">BG 3rd</ThemedText>
          </View>
        </View>
      </ThemedCard>

      {/* Text Variants */}
      <ThemedCard className="mb-6">
        <ThemedText size="lg" weight="semibold" className="mb-4">
          Text Variants
        </ThemedText>
        
        <ThemedText variant="primary" className="mb-2">
          Primary Text - Main content and headings
        </ThemedText>
        <ThemedText variant="secondary" className="mb-2">
          Secondary Text - Supporting information
        </ThemedText>
        <ThemedText variant="tertiary" className="mb-4">
          Tertiary Text - Subtle details and metadata
        </ThemedText>
        
        <View className="flex-row gap-2 mb-4">
          <ThemedText size="xs">XS</ThemedText>
          <ThemedText size="sm">Small</ThemedText>
          <ThemedText size="base">Base</ThemedText>
          <ThemedText size="lg">Large</ThemedText>
          <ThemedText size="xl" weight="bold">XL Bold</ThemedText>
        </View>
      </ThemedCard>

      {/* Button Variants */}
      <ThemedCard className="mb-6">
        <ThemedText size="lg" weight="semibold" className="mb-4">
          Button Variants
        </ThemedText>
        
        <View className="gap-3">
          <ThemedButton variant="primary" onPress={() => {}}>
            Primary Button
          </ThemedButton>
          <ThemedButton variant="secondary" onPress={() => {}}>
            Secondary Button
          </ThemedButton>
          <ThemedButton variant="outline" onPress={() => {}}>
            Outline Button
          </ThemedButton>
          <ThemedButton variant="ghost" onPress={() => {}}>
            Ghost Button
          </ThemedButton>
          <ThemedButton variant="primary" disabled onPress={() => {}}>
            Disabled Button
          </ThemedButton>
        </View>
      </ThemedCard>

      {/* Input Fields */}
      <ThemedCard className="mb-6">
        <ThemedText size="lg" weight="semibold" className="mb-4">
          Input Fields
        </ThemedText>
        
        <View className="gap-3">
          <ThemedInput
            value={inputValue}
            onChangeText={setInputValue}
            placeholder="Enter text here..."
          />
          <ThemedInput
            value=""
            onChangeText={() => {}}
            placeholder="Multiline input example..."
            multiline
          />
        </View>
      </ThemedCard>

      {/* Status Badges */}
      <ThemedCard className="mb-6">
        <ThemedText size="lg" weight="semibold" className="mb-4">
          Status Badges
        </ThemedText>
        
        <View className="flex-row flex-wrap gap-2">
          <StatusBadge status="success" label="Success" />
          <StatusBadge status="warning" label="Warning" />
          <StatusBadge status="error" label="Error" />
          <StatusBadge status="info" label="Info" />
        </View>
      </ThemedCard>

      {/* Card Variants */}
      <ThemedView variant="secondary" className="p-4 rounded-xl mb-4">
        <ThemedText weight="semibold" className="mb-2">
          Secondary Background View
        </ThemedText>
        <ThemedText variant="secondary">
          This view uses the secondary background color.
        </ThemedText>
      </ThemedView>

      <ThemedCard variant="flat" className="mb-4">
        <ThemedText weight="semibold" className="mb-2">
          Flat Card (No Border)
        </ThemedText>
        <ThemedText variant="secondary">
          This card has no border styling.
        </ThemedText>
      </ThemedCard>

      <ThemedCard variant="elevated" className="mb-6">
        <ThemedText weight="semibold" className="mb-2">
          Elevated Card
        </ThemedText>
        <ThemedText variant="secondary">
          This card has enhanced shadow and elevation.
        </ThemedText>
      </ThemedCard>
    </ScrollView>
  );
};