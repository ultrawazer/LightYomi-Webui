import { useState } from 'react';
import {
    Typography, Box, Paper, FormControl, Select, MenuItem, Slider, TextField, Stack
} from '@mui/material';

export default function SettingsReader() {
    const [readerSettings, setReaderSettings] = useState({
        fontSize: parseInt(localStorage.getItem('reader_fontSize') || '16'),
        lineHeight: parseFloat(localStorage.getItem('reader_lineHeight') || '1.5'),
        fontFamily: localStorage.getItem('reader_fontFamily') || 'Roboto',
        textAlign: localStorage.getItem('reader_textAlign') || 'left',
        padding: parseInt(localStorage.getItem('reader_padding') || '16'),
        textColor: localStorage.getItem('reader_textColor') || '#000000',
        backgroundColor: localStorage.getItem('reader_backgroundColor') || '#ffffff',
        customCSS: localStorage.getItem('reader_customCSS') || '',
    });

    const updateReaderSetting = (key: string, val: any) => {
        setReaderSettings(prev => ({ ...prev, [key]: val }));
        localStorage.setItem(`reader_${key}`, val.toString());
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>Reading Customization</Typography>

            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Stack spacing={3}>
                    {/* Typography */}
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: 1, minWidth: 200 }}>
                            <Typography gutterBottom>Font Family</Typography>
                            <FormControl fullWidth size="small">
                                <Select
                                    value={readerSettings.fontFamily}
                                    onChange={(e) => updateReaderSetting('fontFamily', e.target.value)}
                                >
                                    <MenuItem value="Roboto">Roboto</MenuItem>
                                    <MenuItem value="Open Sans">Open Sans</MenuItem>
                                    <MenuItem value="Lato">Lato</MenuItem>
                                    <MenuItem value="Merriweather">Merriweather</MenuItem>
                                    <MenuItem value="Monospace">Monospace</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        <Box sx={{ flex: 1, minWidth: 200 }}>
                            <Typography gutterBottom>Text Alignment</Typography>
                            <FormControl fullWidth size="small">
                                <Select
                                    value={readerSettings.textAlign}
                                    onChange={(e) => updateReaderSetting('textAlign', e.target.value)}
                                >
                                    <MenuItem value="left">Left</MenuItem>
                                    <MenuItem value="justify">Justify</MenuItem>
                                    <MenuItem value="center">Center</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>

                    <Box>
                        <Typography gutterBottom>Font Size ({readerSettings.fontSize}px)</Typography>
                        <Slider
                            value={readerSettings.fontSize}
                            min={12}
                            max={32}
                            valueLabelDisplay="auto"
                            onChange={(_, v) => updateReaderSetting('fontSize', v)}
                        />
                    </Box>

                    <Box>
                        <Typography gutterBottom>Line Height ({readerSettings.lineHeight})</Typography>
                        <Slider
                            value={readerSettings.lineHeight}
                            min={1.0}
                            max={2.5}
                            step={0.1}
                            valueLabelDisplay="auto"
                            onChange={(_, v) => updateReaderSetting('lineHeight', v)}
                        />
                    </Box>

                    <Box>
                        <Typography gutterBottom>Side Padding ({readerSettings.padding}px)</Typography>
                        <Slider
                            value={readerSettings.padding}
                            min={0}
                            max={100}
                            step={4}
                            valueLabelDisplay="auto"
                            onChange={(_, v) => updateReaderSetting('padding', v)}
                        />
                    </Box>
                </Stack>
            </Paper>

            <Typography variant="h6" gutterBottom>Colors & Theme</Typography>
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        fullWidth
                        label="Text Color"
                        type="color"
                        value={readerSettings.textColor}
                        onChange={(e) => updateReaderSetting('textColor', e.target.value)}
                    />
                    <TextField
                        fullWidth
                        label="Background Color"
                        type="color"
                        value={readerSettings.backgroundColor}
                        onChange={(e) => updateReaderSetting('backgroundColor', e.target.value)}
                    />
                </Box>
            </Paper>

            <Typography variant="h6" gutterBottom>Custom CSS</Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
                <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Custom CSS"
                    placeholder="body { ... }"
                    value={readerSettings.customCSS}
                    onChange={(e) => updateReaderSetting('customCSS', e.target.value)}
                />
            </Paper>
        </Box>
    );
}
