/**
 * Suwayomi-inspired Design System for LightYomi Web
 * 
 * Design Principles:
 * - Dark gray backgrounds (not pure black) to reduce eye strain
 * - Desaturated accent colors for readability
 * - 4.5:1 minimum contrast ratio (WCAG AA)
 * - 8px grid system for consistent spacing
 * - Clean, minimal chrome
 */

import { createTheme } from '@mui/material/styles';
import type { ThemeOptions } from '@mui/material/styles';

// Color Palette
export const colors = {
    // Backgrounds (dark grays, never pure black)
    background: {
        darkest: '#0f0f0f',
        darker: '#161616',
        dark: '#1a1a1a',
        default: '#1e1e1e',
        paper: '#252525',
        elevated: '#2d2d2d',
        hover: '#353535',
    },
    // Light theme backgrounds
    light: {
        default: '#fafafa',
        paper: '#ffffff',
        elevated: '#f5f5f5',
    },
    // Primary accent (teal/cyan - Suwayomi style)
    primary: {
        main: '#4db6ac',      // Teal 300
        light: '#82e9de',
        dark: '#00867d',
        contrastText: '#000000',
    },
    // Secondary accent
    secondary: {
        main: '#7986cb',      // Indigo 300
        light: '#aab6fe',
        dark: '#49599a',
        contrastText: '#000000',
    },
    // Status colors
    success: '#66bb6a',
    warning: '#ffa726',
    error: '#ef5350',
    info: '#29b6f6',
    // Text colors
    text: {
        dark: {
            primary: 'rgba(255, 255, 255, 0.87)',
            secondary: 'rgba(255, 255, 255, 0.60)',
            disabled: 'rgba(255, 255, 255, 0.38)',
        },
        light: {
            primary: 'rgba(0, 0, 0, 0.87)',
            secondary: 'rgba(0, 0, 0, 0.60)',
            disabled: 'rgba(0, 0, 0, 0.38)',
        },
    },
    // Dividers
    divider: {
        dark: 'rgba(255, 255, 255, 0.12)',
        light: 'rgba(0, 0, 0, 0.12)',
    },
};

// Spacing (8px grid)
export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

// Typography
export const typography = {
    fontFamily: '"Inter", "Roboto", "Helvetica Neue", Arial, sans-serif',
    fontFamilyReader: '"Merriweather", "Georgia", serif', // For reading content
    fontSize: {
        xs: 12,
        sm: 14,
        md: 16,
        lg: 18,
        xl: 20,
        xxl: 24,
        h1: 32,
        h2: 28,
        h3: 24,
        h4: 20,
        h5: 18,
        h6: 16,
    },
    lineHeight: {
        tight: 1.25,
        normal: 1.5,
        relaxed: 1.75,
        loose: 2,
    },
};

// Border Radius
export const borderRadius = {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
};

// Shadows
export const shadows = {
    none: 'none',
    sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.3)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.3)',
};

// Base theme options shared across themes
const baseThemeOptions: ThemeOptions = {
    typography: {
        fontFamily: typography.fontFamily,
        h1: { fontSize: typography.fontSize.h1, fontWeight: 700 },
        h2: { fontSize: typography.fontSize.h2, fontWeight: 600 },
        h3: { fontSize: typography.fontSize.h3, fontWeight: 600 },
        h4: { fontSize: typography.fontSize.h4, fontWeight: 600 },
        h5: { fontSize: typography.fontSize.h5, fontWeight: 500 },
        h6: { fontSize: typography.fontSize.h6, fontWeight: 500 },
        body1: { fontSize: typography.fontSize.md, lineHeight: typography.lineHeight.normal },
        body2: { fontSize: typography.fontSize.sm, lineHeight: typography.lineHeight.normal },
        caption: { fontSize: typography.fontSize.xs },
    },
    shape: {
        borderRadius: borderRadius.md,
    },
    spacing: spacing.sm,
    components: {
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    boxShadow: shadows.sm,
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 500,
                    borderRadius: borderRadius.md,
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: borderRadius.lg,
                    backgroundImage: 'none',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    backgroundImage: 'none',
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: borderRadius.sm,
                },
            },
        },
        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    fontSize: typography.fontSize.sm,
                    borderRadius: borderRadius.sm,
                },
            },
        },
    },
};

// Dark Theme (Default - Suwayomi style)
export const darkTheme = createTheme({
    ...baseThemeOptions,
    palette: {
        mode: 'dark',
        primary: colors.primary,
        secondary: colors.secondary,
        success: { main: colors.success },
        warning: { main: colors.warning },
        error: { main: colors.error },
        info: { main: colors.info },
        background: {
            default: colors.background.dark,
            paper: colors.background.paper,
        },
        text: colors.text.dark,
        divider: colors.divider.dark,
    },
});

// Midnight Theme (Deeper dark)
export const midnightTheme = createTheme({
    ...baseThemeOptions,
    palette: {
        mode: 'dark',
        primary: {
            main: '#bb86fc',      // Purple accent
            light: '#efb7ff',
            dark: '#8858c8',
        },
        secondary: {
            main: '#03dac6',      // Teal accent
            light: '#66fff9',
            dark: '#00a896',
        },
        success: { main: colors.success },
        warning: { main: colors.warning },
        error: { main: '#cf6679' },
        info: { main: colors.info },
        background: {
            default: colors.background.darkest,
            paper: colors.background.darker,
        },
        text: colors.text.dark,
        divider: colors.divider.dark,
    },
});

// Light Theme
export const lightTheme = createTheme({
    ...baseThemeOptions,
    palette: {
        mode: 'light',
        primary: {
            main: '#00897b',      // Teal 600
            light: '#4ebaaa',
            dark: '#005b4f',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#5c6bc0',      // Indigo 400
            light: '#8e99f3',
            dark: '#26418f',
            contrastText: '#ffffff',
        },
        success: { main: '#43a047' },
        warning: { main: '#fb8c00' },
        error: { main: '#e53935' },
        info: { main: '#039be5' },
        background: {
            default: colors.light.default,
            paper: colors.light.paper,
        },
        text: colors.text.light,
        divider: colors.divider.light,
    },
});

// Theme registry
export const themes = {
    dark: darkTheme,
    midnight: midnightTheme,
    light: lightTheme,
} as const;

export type ThemeName = keyof typeof themes;

// Get theme by name
export const getTheme = (name: ThemeName) => themes[name] || darkTheme;

// Default export
export default darkTheme;
