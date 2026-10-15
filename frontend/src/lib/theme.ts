/**
 * Global Color Scheme & Theme Configuration
 * AstaKraft SaaS (astacode.id × GEKRAFS)
 * 
 * Central source of truth for all brand colors.
 * Synchronized with Tailwind CSS theme variables in globals.css.
 */

export const BRAND_COLORS = {
  // Primary brand blues
  primary: "#4394C3",
  primaryHover: "#2F79A6",
  primaryDark: "#1E5E85",
  primaryLight: "#7BB8DC",

  // Navy (Deep contrast / Headings / Dark buttons / Accents)
  navy: "#1F3A5C",
  navyDark: "#15273E",
  navyHover: "#2A4D77",
  navyLight: "#2F5582",

  // Secondary Accent (Yellow / Amber / Gold)
  yellow: "#F7CB45",
  yellowHover: "#E5B932",
  yellowLight: "#FDE68A",
  yellowDark: "#C99A18",

  // Background Ice Blue Tint & Surfaces
  ice: "#EEF4F8",
  iceLight: "#F6FAFC",
  iceBorder: "#D5E4F0",
  iceDark: "#D8E7F1",

  // Base Neutrals
  surface: "#FFFFFF",
  textPrimary: "#1F3A5C",
  textSecondary: "#4B6B94",
  textMuted: "#718BAA",
  borderLight: "#D5E4F0",

  // Functional
  success: "#10B981",
  danger: "#EF4444",
  warning: "#F59E0B",
} as const

export type BrandColorKey = keyof typeof BRAND_COLORS
