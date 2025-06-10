import { vars } from "nativewind";

export type ThemeMode = "light" | "dark" | "auto";

export const themes = {
  light: vars({
    // Primary Colors (MooseTicket Brand)
    "--color-primary-default": "#FF7F11",      // MooseTicket Orange
    "--color-primary-light": "#FFB366",
    "--color-primary-dark": "#E6720F",
    "--color-primary-50": "#FFF7F0",
    "--color-primary-100": "#FFEAD1",
    "--color-primary-200": "#FFD4A3",
    
    // Secondary Colors
    "--color-secondary-default": "#10472B",    // MooseTicket Green
    "--color-secondary-light": "#2D6E47",
    "--color-secondary-dark": "#0A2F1C",
    "--color-secondary-50": "#F0F7F3",
    "--color-secondary-100": "#D4E9DC",
    
    // Neutral Colors
    "--color-neutral-50": "#F9FAFB",
    "--color-neutral-100": "#F3F4F6",
    "--color-neutral-200": "#E5E7EB",
    "--color-neutral-300": "#D1D5DB",
    "--color-neutral-400": "#9CA3AF",
    "--color-neutral-500": "#6B7280",
    "--color-neutral-600": "#4B5563",
    "--color-neutral-700": "#374151",
    "--color-neutral-800": "#1F2937",
    "--color-neutral-900": "#111827",
    
    // Background Colors
    "--color-background": "#FFFFFF",
    "--color-background-secondary": "#F9FAFB",
    "--color-background-tertiary": "#F3F4F6",
    
    // Text Colors
    "--color-text-primary": "#1E1E1E",
    "--color-text-secondary": "#6B7280",
    "--color-text-tertiary": "#9CA3AF",
    "--color-text-inverse": "#FFFFFF",
    
    // Border Colors
    "--color-border": "#E5E7EB",
    "--color-border-light": "#F3F4F6",
    "--color-border-dark": "#D1D5DB",
    
    // Status Colors
    "--color-success": "#10B981",
    "--color-success-light": "#D1FAE5",
    "--color-warning": "#F59E0B",
    "--color-warning-light": "#FEF3C7",
    "--color-error": "#EF4444",
    "--color-error-light": "#FEE2E2",
    "--color-info": "#3B82F6",
    "--color-info-light": "#DBEAFE",
    
    // Overlay
    "--color-overlay": "rgba(0, 0, 0, 0.5)",
    "--color-overlay-light": "rgba(0, 0, 0, 0.1)",
    
    // Shadow
    "--color-shadow": "rgba(0, 0, 0, 0.1)",
  }),

  dark: vars({
    // Primary Colors (MooseTicket Brand) - Enhanced for dark mode
    "--color-primary-default": "#FF9A4A",      // Brighter, more vibrant orange
    "--color-primary-light": "#FFB366",
    "--color-primary-dark": "#E6720F",
    "--color-primary-50": "#1A0F08",           // Very dark orange for backgrounds
    "--color-primary-100": "#2D1A0D",
    "--color-primary-200": "#4A2A15",
    
    // Secondary Colors - Enhanced green for dark mode
    "--color-secondary-default": "#22C55E",    // More vibrant green
    "--color-secondary-light": "#4ADE80",
    "--color-secondary-dark": "#16A34A",
    "--color-secondary-50": "#0F1B0F",         // Very dark green for backgrounds
    "--color-secondary-100": "#1A2E1A",
    
    // Neutral Colors - Improved contrast and warmth
    "--color-neutral-50": "#0F1114",          // Almost black with slight blue tint
    "--color-neutral-100": "#1C1F23",         // Dark charcoal
    "--color-neutral-200": "#2D3238",         // Medium dark gray
    "--color-neutral-300": "#4A5158",         // Medium gray
    "--color-neutral-400": "#6B7480",         // Light gray
    "--color-neutral-500": "#9CA3AF",         // Default gray
    "--color-neutral-600": "#D1D5DB",         // Light gray
    "--color-neutral-700": "#E5E7EB",         // Very light gray
    "--color-neutral-800": "#F3F4F6",         // Almost white
    "--color-neutral-900": "#FFFFFF",         // Pure white
    
    // Background Colors - Warmer, more sophisticated
    "--color-background": "#0B0D10",          // Deep dark blue-black
    "--color-background-secondary": "#151820", // Slightly lighter dark
    "--color-background-tertiary": "#1F2329",  // Medium dark with warmth
    
    // Text Colors - Better contrast
    "--color-text-primary": "#F8FAFC",       // Slightly off-white
    "--color-text-secondary": "#CBD5E1",     // Light gray-blue
    "--color-text-tertiary": "#94A3B8",      // Medium gray-blue
    "--color-text-inverse": "#1E293B",       // Dark for light backgrounds
    
    // Border Colors - Subtle but visible
    "--color-border": "#2D3748",             // Medium dark with slight warmth
    "--color-border-light": "#4A5568",       // Lighter border
    "--color-border-dark": "#1A202C",        // Darker border
    
    // Status Colors - Vibrant and accessible
    "--color-success": "#10B981",            // Emerald green
    "--color-success-light": "#065F46",      // Dark green background
    "--color-warning": "#F59E0B",            // Amber warning
    "--color-warning-light": "#78350F",      // Dark amber background
    "--color-error": "#EF4444",             // Red error
    "--color-error-light": "#7F1D1D",       // Dark red background
    "--color-info": "#3B82F6",              // Blue info
    "--color-info-light": "#1E3A8A",        // Dark blue background
    
    // Overlay - Softer overlays
    "--color-overlay": "rgba(0, 0, 0, 0.75)",
    "--color-overlay-light": "rgba(0, 0, 0, 0.25)",
    
    // Shadow - More pronounced for depth
    "--color-shadow": "rgba(0, 0, 0, 0.5)",
  }),
};

// Theme utilities
export const getThemeColors = (theme: "light" | "dark") => themes[theme];

// Pre-defined color combinations for common UI elements
export const themePresets = {
  light: {
    card: {
      background: "bg-background",
      border: "border-border",
      shadow: "shadow-sm",
    },
    button: {
      primary: "bg-primary text-text-inverse",
      secondary: "bg-secondary text-text-inverse",
      outline: "border border-border bg-transparent text-text-primary",
    },
    input: {
      default: "bg-background-secondary border-border text-text-primary",
      focused: "bg-background border-primary text-text-primary",
    },
  },
  dark: {
    card: {
      background: "bg-background",
      border: "border-border",
      shadow: "shadow-lg",
    },
    button: {
      primary: "bg-primary text-text-inverse",
      secondary: "bg-secondary text-text-inverse",
      outline: "border border-border bg-transparent text-text-primary",
    },
    input: {
      default: "bg-background-secondary border-border text-text-primary",
      focused: "bg-background border-primary text-text-primary",
    },
  },
};
