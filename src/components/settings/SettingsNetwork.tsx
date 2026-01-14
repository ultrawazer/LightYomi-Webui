import { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Paper, Alert } from '@mui/material';
import axios from 'axios';

export default function SettingsNetwork() {
    const [userAgent, setUserAgent] = useState('');
    const [cookie, setCookie] = useState('');
    const [flareSolverrUrl, setFlareSolverrUrl] = useState('');
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const uaRes = await axios.get('/api/settings/string/USER_AGENT');
            if (uaRes.data?.value) setUserAgent(uaRes.data.value);

            const cookieRes = await axios.get('/api/settings/string/COOKIE_HEADER');
            if (cookieRes.data?.value) setCookie(cookieRes.data.value);

            const fsRes = await axios.get('/api/settings/string/FLARESOLVERR_URL');
            if (fsRes.data?.value) setFlareSolverrUrl(fsRes.data.value);

        } catch (e) {
            console.error('Failed to load network settings', e);
        }
    };

    const handleSave = async () => {
        try {
            await axios.post('/api/settings/string/USER_AGENT', { value: userAgent });
            await axios.post('/api/settings/string/COOKIE_HEADER', { value: cookie });
            await axios.post('/api/settings/string/FLARESOLVERR_URL', { value: flareSolverrUrl });
            setSaved(true);
            setError('');
            setTimeout(() => setSaved(false), 3000);
        } catch (e) {
            console.error(e);
            setError('Failed to save settings');
        }
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>Network Settings</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Configure network headers to bypass protections (e.g., Cloudflare).
                You can extract these from your browser (Network Tab &rarr; request headers).
            </Typography>

            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <TextField
                    fullWidth
                    label="User Agent"
                    variant="outlined"
                    value={userAgent}
                    onChange={(e) => setUserAgent(e.target.value)}
                    helperText="Browser User-Agent string"
                    sx={{ mb: 3 }}
                />

                <TextField
                    fullWidth
                    label="Cookie Header"
                    variant="outlined"
                    value={cookie}
                    onChange={(e) => setCookie(e.target.value)}
                    helperText="Full Cookie string (e.g., 'cf_clearance=...; other_cookie=...')"
                    multiline
                    minRows={3}
                    sx={{ mb: 3 }}
                />

                <TextField
                    fullWidth
                    label="FlareSolverr URL"
                    variant="outlined"
                    value={flareSolverrUrl}
                    onChange={(e) => setFlareSolverrUrl(e.target.value)}
                    helperText="URL of your FlareSolverr instance (e.g. http://localhost:8191)"
                    placeholder="http://localhost:8191"
                    sx={{ mb: 3 }}
                />

                <Button variant="contained" onClick={handleSave}>
                    Save Network Settings
                </Button>

                {saved && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                        Settings saved successfully.
                    </Alert>
                )}
                {error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {error}
                    </Alert>
                )}
            </Paper>

            <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography variant="subtitle1" gutterBottom>Cloudflare Bypass Mode</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    When a source requires solving a Cloudflare challenge, how should it be presented?
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant={localStorage.getItem('cloudflareBypassMode') !== 'iframe' ? 'contained' : 'outlined'}
                        onClick={() => {
                            localStorage.setItem('cloudflareBypassMode', 'popup');
                            window.location.reload();
                        }}
                    >
                        Popup Window (Recommended)
                    </Button>
                    <Button
                        variant={localStorage.getItem('cloudflareBypassMode') === 'iframe' ? 'contained' : 'outlined'}
                        onClick={() => {
                            localStorage.setItem('cloudflareBypassMode', 'iframe');
                            window.location.reload();
                        }}
                    >
                        Inline Iframe
                    </Button>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Popup is more reliable. Iframe may be blocked by some sites.
                </Typography>
            </Paper>
        </Box>
    );
}
