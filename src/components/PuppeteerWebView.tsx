/**
 * PuppeteerWebView - Interactive WebView component using server-side Puppeteer
 * 
 * Features:
 * - Display live screenshots from Puppeteer
 * - Forward mouse clicks and keyboard input
 * - Navigation controls (back, refresh)
 * - Auto-save cookies on close
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    CircularProgress,
    IconButton,
    TextField,
    Tooltip,
    Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';
import axios from 'axios';

interface PuppeteerWebViewProps {
    open: boolean;
    onClose: () => void;
    url: string;
    pluginId: string;
    onSuccess?: () => void;
}

export default function PuppeteerWebView({
    open,
    onClose,
    url,
    pluginId,
    onSuccess
}: PuppeteerWebViewProps) {
    const [loading, setLoading] = useState(true);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [screenshot, setScreenshot] = useState<string | null>(null);
    const [currentUrl, setCurrentUrl] = useState(url);
    const [pageTitle, setPageTitle] = useState('Loading...');
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const imageRef = useRef<HTMLImageElement>(null);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);
    const sessionIdRef = useRef<string | null>(null);

    // Start session when dialog opens
    useEffect(() => {
        if (open && !sessionId) {
            startSession();
        }

        return () => {
            // Stop polling when dialog closes
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
        };
    }, [open]);

    // Keep sessionIdRef in sync
    useEffect(() => {
        sessionIdRef.current = sessionId;
    }, [sessionId]);

    const startSession = async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await axios.post('/api/webview/start', {
                pluginId,
                url
            });

            if (res.data.sessionId) {
                setSessionId(res.data.sessionId);
                setLoading(false);
                startPolling(res.data.sessionId);
            } else {
                setError('Failed to start session');
                setLoading(false);
            }
        } catch (e: any) {
            setError(e.response?.data?.error || e.message || 'Failed to start WebView');
            setLoading(false);
        }
    };

    const startPolling = (sid: string) => {
        // Poll for screenshots every 500ms
        pollingRef.current = setInterval(async () => {
            try {
                const res = await axios.get(`/api/webview/screenshot/${sid}`);
                if (res.data.screenshot) {
                    setScreenshot(`data:image/jpeg;base64,${res.data.screenshot}`);
                    setCurrentUrl(res.data.url || currentUrl);
                    setPageTitle(res.data.title || 'Untitled');
                }
            } catch (e) {
                // Session might have ended
                console.log('Screenshot poll error:', e);
            }
        }, 500);
    };

    const handleClick = useCallback(async (e: React.MouseEvent<HTMLImageElement>) => {
        if (!sessionIdRef.current || !imageRef.current) return;

        // Calculate click position relative to the image
        const rect = imageRef.current.getBoundingClientRect();
        const scaleX = 1024 / rect.width;
        const scaleY = 768 / rect.height;

        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        try {
            await axios.post(`/api/webview/input/${sessionIdRef.current}`, {
                type: 'click',
                x: Math.round(x),
                y: Math.round(y)
            });
        } catch (err) {
            console.error('Click error:', err);
        }
    }, []);

    const handleKeyDown = useCallback(async (e: React.KeyboardEvent) => {
        if (!sessionIdRef.current) return;

        e.preventDefault();

        try {
            // For printable characters, use 'type'
            if (e.key.length === 1) {
                await axios.post(`/api/webview/input/${sessionIdRef.current}`, {
                    type: 'type',
                    text: e.key
                });
            } else {
                // For special keys, use keydown/keyup
                await axios.post(`/api/webview/input/${sessionIdRef.current}`, {
                    type: 'keydown',
                    key: e.key
                });
            }
        } catch (err) {
            console.error('Key error:', err);
        }
    }, []);

    const handleScroll = useCallback(async (e: React.WheelEvent) => {
        if (!sessionIdRef.current) return;

        try {
            await axios.post(`/api/webview/input/${sessionIdRef.current}`, {
                type: 'scroll',
                deltaX: e.deltaX,
                deltaY: e.deltaY
            });
        } catch (err) {
            console.error('Scroll error:', err);
        }
    }, []);

    const handleBack = async () => {
        if (!sessionId) return;
        try {
            await axios.post(`/api/webview/back/${sessionId}`);
        } catch (err) {
            console.error('Back error:', err);
        }
    };

    const handleRefresh = async () => {
        if (!sessionId) return;
        try {
            await axios.post(`/api/webview/refresh/${sessionId}`);
        } catch (err) {
            console.error('Refresh error:', err);
        }
    };

    const handleClose = async () => {
        if (!sessionId) {
            onClose();
            return;
        }

        setSaving(true);

        try {
            // Stop polling
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
            }

            // Stop session and save cookies
            const res = await axios.post(`/api/webview/stop/${sessionId}`);

            if (res.data.cookiesSaved) {
                console.log('Cookies saved successfully!');
                onSuccess?.();
            }

            setSessionId(null);
            setScreenshot(null);
            onClose();
        } catch (err) {
            console.error('Close error:', err);
            onClose();
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: { height: '90vh', maxHeight: 900 }
            }}
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
                <Tooltip title="Go Back">
                    <IconButton size="small" onClick={handleBack} disabled={!sessionId || loading}>
                        <ArrowBackIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Refresh">
                    <IconButton size="small" onClick={handleRefresh} disabled={!sessionId || loading}>
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
                <Typography
                    variant="body2"
                    sx={{
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        mx: 1
                    }}
                >
                    {pageTitle}
                </Typography>
                <IconButton onClick={handleClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <Box sx={{ px: 2, pb: 1 }}>
                <TextField
                    size="small"
                    fullWidth
                    value={currentUrl}
                    InputProps={{
                        readOnly: true,
                        sx: { fontSize: '0.8rem' }
                    }}
                />
            </Box>

            <DialogContent
                dividers
                sx={{
                    p: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#1a1a1a',
                    overflow: 'hidden'
                }}
                tabIndex={0}
                onKeyDown={handleKeyDown}
            >
                {loading ? (
                    <Box sx={{ textAlign: 'center' }}>
                        <CircularProgress sx={{ mb: 2 }} />
                        <Typography color="text.secondary">
                            Starting browser session...
                        </Typography>
                    </Box>
                ) : error ? (
                    <Box sx={{ textAlign: 'center', p: 4 }}>
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                        <Button variant="contained" onClick={startSession}>
                            Retry
                        </Button>
                    </Box>
                ) : screenshot ? (
                    <img
                        ref={imageRef}
                        src={screenshot}
                        alt="WebView"
                        onClick={handleClick}
                        onWheel={handleScroll}
                        style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain',
                            cursor: 'pointer'
                        }}
                    />
                ) : (
                    <Typography color="text.secondary">
                        Waiting for screenshot...
                    </Typography>
                )}
            </DialogContent>

            <DialogActions>
                <Alert severity="info" sx={{ flex: 1, mr: 2 }}>
                    Complete any challenges, then close this window. Cookies will be saved automatically.
                </Alert>
                <Button
                    onClick={handleClose}
                    variant="contained"
                    disabled={saving}
                >
                    {saving ? 'Saving...' : 'Done & Save Cookies'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
