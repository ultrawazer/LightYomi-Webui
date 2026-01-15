/**
 * WebView Cloudflare Bypass Component
 * 
 * Displays a site in an iframe/popup to let users manually solve Cloudflare challenges.
 * After solving, cookies are saved for the specific plugin, and User-Agent is auto-extracted
 * if not already set.
 */

import { useState, useEffect, useRef } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    CircularProgress,
    Alert,
    IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import axios from 'axios';

interface WebViewBypassProps {
    open: boolean;
    onClose: () => void;
    url: string;
    pluginId: string;
    onSuccess?: () => void;
}

export default function WebViewBypass({ open, onClose, url, pluginId, onSuccess }: WebViewBypassProps) {
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState<'iframe' | 'popup'>('popup'); // Default to popup (more reliable)
    const [status, setStatus] = useState<'waiting' | 'success' | 'error'>('waiting');
    const popupRef = useRef<Window | null>(null);
    const iframeRef = useRef<HTMLIFrameElement | null>(null);

    // Load user preference
    useEffect(() => {
        const savedMode = localStorage.getItem('cloudflareBypassMode');
        if (savedMode === 'iframe' || savedMode === 'popup') {
            setMode(savedMode);
        }
    }, []);

    useEffect(() => {
        if (!open) return;

        if (mode === 'popup') {
            // Open popup
            const popup = window.open(
                url,
                'cloudflare_bypass',
                'width=800,height=600,menubar=no,toolbar=no,location=yes'
            );
            popupRef.current = popup;

            // Poll for popup close
            const pollTimer = setInterval(() => {
                if (popup?.closed) {
                    clearInterval(pollTimer);
                    handleBypassComplete();
                }
            }, 500);

            return () => {
                clearInterval(pollTimer);
                if (popup && !popup.closed) {
                    popup.close();
                }
            };
        }
    }, [open, mode, url]);

    const handleBypassComplete = async () => {
        setStatus('success');

        try {
            // Get the browser's User-Agent to save if Network UA is empty
            const browserUA = navigator.userAgent;

            // Notify server - it will save cookies for this plugin
            // and User-Agent if the current setting is empty
            await axios.post('/api/source/cloudflare-solved', {
                pluginId,
                url,
                userAgent: browserUA
            });

            onSuccess?.();
        } catch (e) {
            console.error('Failed to notify server:', e);
        }

        setTimeout(() => {
            onClose();
        }, 1500);
    };

    const handleOpenPopup = () => {
        if (popupRef.current && !popupRef.current.closed) {
            popupRef.current.focus();
        } else {
            const popup = window.open(
                url,
                'cloudflare_bypass',
                'width=800,height=600,menubar=no,toolbar=no,location=yes'
            );
            popupRef.current = popup;
        }
    };

    const handleIframeLoad = () => {
        setLoading(false);
        // Note: We can't access iframe cookies due to same-origin policy
        // User needs to manually confirm when bypass is complete
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { height: mode === 'iframe' ? '80vh' : 'auto' }
            }}
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6">Solve Challenge</Typography>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                {status === 'success' ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="h6" color="success.main" gutterBottom>
                            ✓ Challenge Completed!
                        </Typography>
                        <Typography color="text.secondary">
                            Settings saved. Retrying request...
                        </Typography>
                    </Box>
                ) : mode === 'popup' ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Alert severity="info" sx={{ mb: 3 }}>
                            A popup window has opened. Please complete any challenge (e.g., CAPTCHA) there.
                        </Alert>
                        <Typography variant="body1" gutterBottom>
                            After completing the challenge:
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            1. Wait for the page to fully load<br />
                            2. Close the popup window<br />
                            3. The request will automatically retry
                        </Typography>
                        <Button
                            variant="outlined"
                            startIcon={<OpenInNewIcon />}
                            onClick={handleOpenPopup}
                        >
                            Reopen Popup
                        </Button>
                    </Box>
                ) : (
                    <Box sx={{ height: '100%', position: 'relative' }}>
                        {loading && (
                            <Box sx={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                zIndex: 1
                            }}>
                                <CircularProgress />
                            </Box>
                        )}
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            Note: Iframe mode may not work for all sites due to security restrictions.
                            If the page doesn't load, use popup mode instead.
                        </Alert>
                        <iframe
                            ref={iframeRef}
                            src={url}
                            style={{
                                width: '100%',
                                height: 'calc(100% - 60px)',
                                border: 'none',
                                borderRadius: 4,
                            }}
                            onLoad={handleIframeLoad}
                            sandbox="allow-same-origin allow-scripts allow-forms"
                        />
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                {status !== 'success' && (
                    <>
                        <Button onClick={() => setMode(mode === 'popup' ? 'iframe' : 'popup')}>
                            Switch to {mode === 'popup' ? 'Iframe' : 'Popup'}
                        </Button>
                        {mode === 'iframe' && (
                            <Button
                                variant="contained"
                                onClick={handleBypassComplete}
                            >
                                I've Completed the Challenge
                            </Button>
                        )}
                    </>
                )}
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
}
