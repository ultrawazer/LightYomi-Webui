/**
 * Tracker Settings - MAL and AniList Integration
 * 
 * Features:
 * - OAuth connection for MyAnimeList and AniList
 * - Connection status display
 * - Disconnect functionality
 * - Status persistence via backend
 */

import { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    CardActions,
    Typography,
    Avatar,
    Stack,
    Chip,
    CircularProgress,
    Alert,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import axios from 'axios';

interface TrackerStatus {
    mal: {
        connected: boolean;
        username?: string;
    };
    anilist: {
        connected: boolean;
        username?: string;
    };
}

export default function TrackerSettings() {
    const [status, setStatus] = useState<TrackerStatus>({
        mal: { connected: false },
        anilist: { connected: false },
    });
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState<string | null>(null);

    useEffect(() => {
        fetchStatus();

        // Listen for OAuth callback
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'tracker-oauth-success') {
                fetchStatus();
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const fetchStatus = async () => {
        try {
            const res = await axios.get('/api/tracker/status');
            setStatus(res.data || {
                mal: { connected: false },
                anilist: { connected: false },
            });
        } catch (e) {
            console.error('Failed to fetch tracker status:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async (tracker: string) => {
        setConnecting(tracker);
        try {
            const res = await axios.get(`/api/tracker/${tracker}/auth-url`);
            const { url } = res.data;
            if (url) {
                // Open OAuth popup
                const popup = window.open(url, '_blank', 'width=500,height=600');

                // Poll for popup close
                const pollTimer = setInterval(() => {
                    if (popup?.closed) {
                        clearInterval(pollTimer);
                        setConnecting(null);
                        fetchStatus();
                    }
                }, 500);
            } else {
                setConnecting(null);
                alert('OAuth not configured for this tracker');
            }
        } catch (e) {
            console.error(e);
            setConnecting(null);
            alert('Failed to get auth URL. OAuth may not be configured.');
        }
    };

    const handleDisconnect = async (tracker: string) => {
        if (!confirm(`Disconnect from ${tracker}?`)) return;
        try {
            await axios.post(`/api/tracker/${tracker}/disconnect`);
            fetchStatus();
        } catch (e) {
            console.error(e);
            alert('Failed to disconnect');
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Tracking Services
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Connect your tracking accounts to sync reading progress automatically.
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
                OAuth integration requires configuring API credentials on the server.
                Contact your administrator if connection fails.
            </Alert>

            <Stack spacing={2}>
                {/* MyAnimeList */}
                <Card variant="outlined">
                    <CardContent>
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <Avatar
                                src="https://upload.wikimedia.org/wikipedia/commons/7/7a/MyAnimeList_Logo.png"
                                sx={{ width: 48, height: 48 }}
                            />
                            <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="h6">MyAnimeList</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {status.mal.connected && status.mal.username
                                        ? `Connected as ${status.mal.username}`
                                        : 'Not connected'}
                                </Typography>
                            </Box>
                            {status.mal.connected && (
                                <Chip
                                    icon={<CheckCircleIcon />}
                                    label="Connected"
                                    color="success"
                                    size="small"
                                />
                            )}
                        </Stack>
                    </CardContent>
                    <CardActions>
                        {status.mal.connected ? (
                            <Button
                                size="small"
                                color="error"
                                startIcon={<LinkOffIcon />}
                                onClick={() => handleDisconnect('MyAnimeList')}
                            >
                                Disconnect
                            </Button>
                        ) : (
                            <Button
                                size="small"
                                variant="contained"
                                onClick={() => handleConnect('MyAnimeList')}
                                disabled={connecting === 'MyAnimeList'}
                            >
                                {connecting === 'MyAnimeList' ? (
                                    <CircularProgress size={20} />
                                ) : (
                                    'Connect'
                                )}
                            </Button>
                        )}
                    </CardActions>
                </Card>

                {/* AniList */}
                <Card variant="outlined">
                    <CardContent>
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <Avatar
                                sx={{ width: 48, height: 48, bgcolor: '#02A9FF' }}
                            >
                                AL
                            </Avatar>
                            <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="h6">AniList</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {status.anilist.connected && status.anilist.username
                                        ? `Connected as ${status.anilist.username}`
                                        : 'Not connected'}
                                </Typography>
                            </Box>
                            {status.anilist.connected && (
                                <Chip
                                    icon={<CheckCircleIcon />}
                                    label="Connected"
                                    color="success"
                                    size="small"
                                />
                            )}
                        </Stack>
                    </CardContent>
                    <CardActions>
                        {status.anilist.connected ? (
                            <Button
                                size="small"
                                color="error"
                                startIcon={<LinkOffIcon />}
                                onClick={() => handleDisconnect('AniList')}
                            >
                                Disconnect
                            </Button>
                        ) : (
                            <Button
                                size="small"
                                variant="contained"
                                onClick={() => handleConnect('AniList')}
                                disabled={connecting === 'AniList'}
                            >
                                {connecting === 'AniList' ? (
                                    <CircularProgress size={20} />
                                ) : (
                                    'Connect'
                                )}
                            </Button>
                        )}
                    </CardActions>
                </Card>
            </Stack>
        </Box>
    );
}
