/**
 * Reader Settings Panel Component
 * 
 * Slide-out panel for customizing reading experience:
 * - Font family, size, line height
 * - Theme/colors
 * - Width and alignment
 * - Custom CSS
 */

import { useState, useEffect } from 'react';
import {
    Drawer,
    Box,
    Typography,
    Slider,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    IconButton,
    Divider,
    ToggleButtonGroup,
    ToggleButton,
    TextField,
    Button,
    Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignJustifyIcon from '@mui/icons-material/FormatAlignJustify';
import axios from 'axios';

export interface ReaderSettings {
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
    maxWidth: number;
    textAlign: 'left' | 'center' | 'justify';
    backgroundColor: string;
    textColor: string;
    padding: number;
    customCSS: string;
}

const defaultSettings: ReaderSettings = {
    fontFamily: 'sans-serif',
    fontSize: 18,
    lineHeight: 1.6,
    maxWidth: 800,
    textAlign: 'left',
    backgroundColor: '#1a1a1a',
    textColor: 'rgba(255,255,255,0.87)',
    padding: 20,
    customCSS: '',
};

const fontFamilies = [
    { value: 'sans-serif', label: 'Sans Serif (Default)' },
    { value: 'serif', label: 'Serif' },
    { value: '"Merriweather", Georgia, serif', label: 'Merriweather' },
    { value: '"Inter", sans-serif', label: 'Inter' },
    { value: '"Roboto", sans-serif', label: 'Roboto' },
    { value: '"Open Sans", sans-serif', label: 'Open Sans' },
    { value: '"Lora", serif', label: 'Lora' },
    { value: '"Source Sans Pro", sans-serif', label: 'Source Sans Pro' },
    { value: 'monospace', label: 'Monospace' },
    { value: '"Georgia", serif', label: 'Georgia' },
];

const colorPresets = [
    { bg: '#1a1a1a', text: 'rgba(255,255,255,0.87)', name: 'Dark' },
    { bg: '#0f0f0f', text: 'rgba(255,255,255,0.87)', name: 'Midnight' },
    { bg: '#fafafa', text: 'rgba(0,0,0,0.87)', name: 'Light' },
    { bg: '#f5e6c8', text: '#5c4b37', name: 'Sepia' },
    { bg: '#262626', text: '#a8d8a8', name: 'Green' },
    { bg: '#1e2430', text: '#c9d1d9', name: 'GitHub Dark' },
    { bg: '#282c34', text: '#abb2bf', name: 'One Dark' },
    { bg: '#272822', text: '#f8f8f2', name: 'Monokai' },
];

interface Props {
    open: boolean;
    onClose: () => void;
    settings: ReaderSettings;
    onSettingsChange: (settings: ReaderSettings) => void;
}

export default function ReaderSettingsPanel({ open, onClose, settings, onSettingsChange }: Props) {
    const [localSettings, setLocalSettings] = useState<ReaderSettings>(settings);
    const [showCustomCSS, setShowCustomCSS] = useState(false);

    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    const updateSetting = <K extends keyof ReaderSettings>(key: K, value: ReaderSettings[K]) => {
        const newSettings = { ...localSettings, [key]: value };
        setLocalSettings(newSettings);
        onSettingsChange(newSettings);
    };

    const saveToServer = async () => {
        try {
            await axios.post('/api/settings/reader', {
                fontFamily: localSettings.fontFamily,
                fontSize: String(localSettings.fontSize),
                lineHeight: String(localSettings.lineHeight),
                maxWidth: String(localSettings.maxWidth),
                textAlign: localSettings.textAlign,
                backgroundColor: localSettings.backgroundColor,
                textColor: localSettings.textColor,
                padding: String(localSettings.padding),
                customCSS: localSettings.customCSS,
            });
        } catch (e) {
            console.error('Failed to save settings:', e);
        }
    };

    const applyPreset = (preset: typeof colorPresets[0]) => {
        updateSetting('backgroundColor', preset.bg);
        updateSetting('textColor', preset.text);
    };

    const resetToDefaults = () => {
        setLocalSettings(defaultSettings);
        onSettingsChange(defaultSettings);
    };

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: { width: 320, p: 2, bgcolor: 'background.paper' }
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Reader Settings</Typography>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Font Family */}
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Font</InputLabel>
                <Select
                    value={localSettings.fontFamily}
                    label="Font"
                    onChange={(e) => updateSetting('fontFamily', e.target.value)}
                >
                    {fontFamilies.map((font) => (
                        <MenuItem key={font.value} value={font.value} sx={{ fontFamily: font.value }}>
                            {font.label}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            {/* Font Size */}
            <Typography variant="body2" gutterBottom>
                Font Size: {localSettings.fontSize}px
            </Typography>
            <Slider
                value={localSettings.fontSize}
                onChange={(_, value) => updateSetting('fontSize', value as number)}
                min={12}
                max={32}
                step={1}
                valueLabelDisplay="auto"
                sx={{ mb: 2 }}
            />

            {/* Line Height */}
            <Typography variant="body2" gutterBottom>
                Line Height: {localSettings.lineHeight}
            </Typography>
            <Slider
                value={localSettings.lineHeight}
                onChange={(_, value) => updateSetting('lineHeight', value as number)}
                min={1.2}
                max={2.5}
                step={0.1}
                valueLabelDisplay="auto"
                sx={{ mb: 2 }}
            />

            {/* Max Width */}
            <Typography variant="body2" gutterBottom>
                Max Width: {localSettings.maxWidth}px
            </Typography>
            <Slider
                value={localSettings.maxWidth}
                onChange={(_, value) => updateSetting('maxWidth', value as number)}
                min={400}
                max={1200}
                step={50}
                valueLabelDisplay="auto"
                sx={{ mb: 2 }}
            />

            {/* Padding */}
            <Typography variant="body2" gutterBottom>
                Padding: {localSettings.padding}px
            </Typography>
            <Slider
                value={localSettings.padding}
                onChange={(_, value) => updateSetting('padding', value as number)}
                min={0}
                max={60}
                step={4}
                valueLabelDisplay="auto"
                sx={{ mb: 2 }}
            />

            {/* Text Alignment */}
            <Typography variant="body2" gutterBottom>
                Text Alignment
            </Typography>
            <ToggleButtonGroup
                value={localSettings.textAlign}
                exclusive
                onChange={(_, value) => value && updateSetting('textAlign', value)}
                size="small"
                sx={{ mb: 2 }}
            >
                <ToggleButton value="left">
                    <Tooltip title="Left">
                        <FormatAlignLeftIcon />
                    </Tooltip>
                </ToggleButton>
                <ToggleButton value="center">
                    <Tooltip title="Center">
                        <FormatAlignCenterIcon />
                    </Tooltip>
                </ToggleButton>
                <ToggleButton value="justify">
                    <Tooltip title="Justify">
                        <FormatAlignJustifyIcon />
                    </Tooltip>
                </ToggleButton>
            </ToggleButtonGroup>

            <Divider sx={{ my: 2 }} />

            {/* Color Theme Presets */}
            <Typography variant="body2" gutterBottom>
                Color Theme
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {colorPresets.map((preset) => (
                    <Tooltip key={preset.name} title={preset.name}>
                        <Box
                            onClick={() => applyPreset(preset)}
                            sx={{
                                width: 32,
                                height: 32,
                                bgcolor: preset.bg,
                                border: '2px solid',
                                borderColor: localSettings.backgroundColor === preset.bg ? 'primary.main' : 'divider',
                                borderRadius: 1,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                '&:hover': { borderColor: 'primary.light' },
                            }}
                        >
                            <Typography sx={{ color: preset.text, fontSize: 10, fontWeight: 'bold' }}>
                                Aa
                            </Typography>
                        </Box>
                    </Tooltip>
                ))}
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Custom CSS */}
            <Button
                variant="text"
                size="small"
                onClick={() => setShowCustomCSS(!showCustomCSS)}
                sx={{ mb: 1 }}
            >
                {showCustomCSS ? 'Hide' : 'Show'} Custom CSS
            </Button>
            {showCustomCSS && (
                <TextField
                    multiline
                    rows={4}
                    fullWidth
                    size="small"
                    placeholder=".reader-content { ... }"
                    value={localSettings.customCSS}
                    onChange={(e) => updateSetting('customCSS', e.target.value)}
                    sx={{ mb: 2, fontFamily: 'monospace' }}
                />
            )}

            <Divider sx={{ my: 2 }} />

            {/* Actions */}
            <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" size="small" onClick={resetToDefaults} sx={{ flex: 1 }}>
                    Reset
                </Button>
                <Button variant="contained" size="small" onClick={saveToServer} sx={{ flex: 1 }}>
                    Save
                </Button>
            </Box>
        </Drawer>
    );
}

export { defaultSettings };
