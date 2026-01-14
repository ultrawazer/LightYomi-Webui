import { useState } from 'react';
import { Container, Typography, Tabs, Tab, Box, Paper, FormControl, InputLabel, Select, MenuItem, Divider } from '@mui/material';
import TrackerSettings from '../components/TrackerSettings';
import SettingsRepositories from '../components/settings/SettingsRepositories';
import SettingsLibrary from '../components/settings/SettingsLibrary';
import SettingsData from '../components/settings/SettingsData';
import SettingsReader from '../components/settings/SettingsReader';
import SettingsNetwork from '../components/settings/SettingsNetwork';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`settings-tabpanel-${index}`}
            aria-labelledby={`settings-tab-${index}`}
            {...other}
            style={{ flexGrow: 1 }}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

export default function Settings() {
    const [value, setValue] = useState(0);

    // General (App Theme)
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
    const [language, setLanguage] = useState('en');

    const handleChange = (_: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    const handleThemeChange = (val: string) => {
        setTheme(val);
        localStorage.setItem('theme', val);
        window.location.reload();
    };

    return (
        <Container maxWidth={false} sx={{ mt: 2, px: { xs: 2, md: 4 } }}>
            <Typography variant="h4" gutterBottom>Settings</Typography>
            <Paper variant="outlined" sx={{ display: 'flex', minHeight: 'calc(100vh - 180px)' }}>
                <Box sx={{ borderRight: 1, borderColor: 'divider', width: '220px', flexShrink: 0 }}>
                    <Tabs
                        orientation="vertical"
                        variant="scrollable"
                        value={value}
                        onChange={handleChange}
                        aria-label="Settings tabs"
                        sx={{ borderRight: 1, borderColor: 'divider', height: '100%' }}
                    >
                        <Tab label="General" />
                        <Tab label="Repositories" />
                        <Tab label="Library" />
                        <Tab label="Reader" />
                        <Tab label="Trackers" />
                        <Tab label="Network" />
                        <Tab label="Data & Advanced" />
                    </Tabs>
                </Box>

                {/* General Settings */}
                <TabPanel value={value} index={0}>
                    <Typography variant="h6" gutterBottom>Appearance</Typography>
                    <FormControl fullWidth size="small" sx={{ mb: 2, maxWidth: 400 }}>
                        <InputLabel>App Theme</InputLabel>
                        <Select
                            value={theme}
                            label="App Theme"
                            onChange={(e) => handleThemeChange(e.target.value)}
                        >
                            <MenuItem value="light">Light</MenuItem>
                            <MenuItem value="dark">Dark</MenuItem>
                            <MenuItem value="midnight">Midnight Dusk</MenuItem>
                        </Select>
                    </FormControl>

                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>Language</Typography>
                    <FormControl fullWidth size="small" sx={{ mb: 2, maxWidth: 400 }}>
                        <InputLabel>Language</InputLabel>
                        <Select
                            value={language}
                            label="Language"
                            onChange={(e) => setLanguage(e.target.value)}
                        >
                            <MenuItem value="en">English</MenuItem>
                            <MenuItem value="es">Spanish</MenuItem>
                            <MenuItem value="fr">French</MenuItem>
                        </Select>
                    </FormControl>
                </TabPanel>

                <TabPanel value={value} index={1}>
                    <SettingsRepositories />
                </TabPanel>

                <TabPanel value={value} index={2}>
                    <SettingsLibrary />
                </TabPanel>

                <TabPanel value={value} index={3}>
                    <SettingsReader />
                </TabPanel>

                <TabPanel value={value} index={4}>
                    <TrackerSettings />
                </TabPanel>

                <TabPanel value={value} index={5}>
                    <SettingsNetwork />
                </TabPanel>

                <TabPanel value={value} index={6}>
                    <SettingsData />
                </TabPanel>

            </Paper>
        </Container>
    );
}
