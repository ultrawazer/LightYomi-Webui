/**
 * Updates Page - New Chapter Notifications
 * 
 * Features:
 * - Group updates by date
 * - Show new chapter counts per novel
 * - Manual and auto-update triggers
 * - WebSocket support for real-time updates
 * - Suwayomi-style UI
 */

import { useState, useEffect, useRef } from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    ListItemButton,
    IconButton,
    Button,
    Chip,
    Tooltip,
    CircularProgress,
    Switch,
    FormControlLabel,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import NotificationsIcon from '@mui/icons-material/Notifications';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface UpdateItem {
    novelId: number;
    novelName: string;
    novelCover: string;
    novelPath: string;
    chapters: {
        id: number;
        name: string;
        releaseTime: string;
    }[];
    updateDate: string;
}

export default function Updates() {
    const [updates, setUpdates] = useState<UpdateItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [autoUpdate, setAutoUpdate] = useState(false);
    const [wsConnected, setWsConnected] = useState(false);
    const navigate = useNavigate();
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        fetchUpdates();
        fetchSettings();
        connectWebSocket();

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    const connectWebSocket = () => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

        ws.onopen = () => {
            setWsConnected(true);
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'library:updated') {
                    fetchUpdates();
                }
            } catch (e) {
                console.error('WebSocket message parse error:', e);
            }
        };

        ws.onclose = () => {
            setWsConnected(false);
            setTimeout(connectWebSocket, 3000);
        };

        wsRef.current = ws;
    };

    const fetchUpdates = async () => {
        try {
            const res = await axios.get('/api/updates');
            setUpdates(res.data || []);
        } catch (e) {
            console.error('Failed to fetch updates:', e);
        } finally {
            setLoading(false);
        }
    };

    const fetchSettings = async () => {
        try {
            const res = await axios.get('/api/settings/library');
            setAutoUpdate(res.data['library.autoUpdate'] === 'true');
        } catch (e) {
            console.error('Failed to fetch settings:', e);
        }
    };

    const handleRefresh = async () => {
        setUpdating(true);
        try {
            await axios.post('/api/library/update');
            // WebSocket will notify when complete
        } catch (e) {
            console.error('Failed to trigger update:', e);
        } finally {
            setTimeout(() => {
                setUpdating(false);
                fetchUpdates();
            }, 2000);
        }
    };

    const handleClear = async () => {
        if (!confirm('Clear all update notifications?')) return;
        try {
            await axios.delete('/api/updates');
            setUpdates([]);
        } catch (e) {
            console.error('Failed to clear updates:', e);
        }
    };

    const handleOpenNovel = (novelId: number) => {
        navigate(`/novel/${novelId}`);
    };

    const handleAutoUpdateChange = async (enabled: boolean) => {
        setAutoUpdate(enabled);
        try {
            await axios.post('/api/settings/library.autoUpdate', { value: String(enabled) });
        } catch (e) {
            console.error('Failed to save setting:', e);
        }
    };

    const getCoverUrl = (cover: string) => {
        if (!cover) return '';
        if (cover.startsWith('http')) return `/api/image-proxy?url=${encodeURIComponent(cover)}`;
        return cover;
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return date.toLocaleDateString();
    };

    // Group by date
    const groupedUpdates = updates.reduce((acc, item) => {
        const date = item.updateDate || new Date().toISOString().split('T')[0];
        if (!acc[date]) acc[date] = [];
        acc[date].push(item);
        return acc;
    }, {} as Record<string, UpdateItem[]>);

    const sortedDates = Object.keys(groupedUpdates).sort(
        (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );

    const totalNewChapters = updates.reduce((sum, u) => sum + (u.chapters?.length || 1), 0);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="md" sx={{ mt: 2, pb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight={600}>
                    Updates
                    {totalNewChapters > 0 && (
                        <Chip
                            label={`${totalNewChapters} new`}
                            size="small"
                            color="primary"
                            sx={{ ml: 1 }}
                        />
                    )}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                        size="small"
                        icon={<Box sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: wsConnected ? 'success.main' : 'error.main',
                            ml: 1
                        }} />}
                        label={wsConnected ? 'Live' : 'Offline'}
                        variant="outlined"
                    />
                    <Tooltip title="Check for updates">
                        <IconButton onClick={handleRefresh} disabled={updating} color="primary">
                            {updating ? <CircularProgress size={24} /> : <RefreshIcon />}
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Clear all">
                        <IconButton onClick={handleClear} color="error">
                            <DeleteSweepIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* Settings */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={autoUpdate}
                            onChange={(e) => handleAutoUpdateChange(e.target.checked)}
                        />
                    }
                    label="Auto-update library on startup"
                />
            </Paper>

            {updates.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <NotificationsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography color="text.secondary" gutterBottom>
                        No updates available.
                    </Typography>
                    <Button variant="contained" startIcon={<RefreshIcon />} onClick={handleRefresh}>
                        Check for Updates
                    </Button>
                </Paper>
            ) : (
                sortedDates.map((dateStr) => (
                    <Box key={dateStr} sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            {formatDate(dateStr)}
                        </Typography>
                        <Paper variant="outlined">
                            <List disablePadding>
                                {groupedUpdates[dateStr].map((item, index) => (
                                    <ListItem
                                        key={item.novelId}
                                        disablePadding
                                        divider={index < groupedUpdates[dateStr].length - 1}
                                    >
                                        <ListItemButton onClick={() => handleOpenNovel(item.novelId)}>
                                            <ListItemAvatar>
                                                <Avatar
                                                    src={getCoverUrl(item.novelCover)}
                                                    variant="rounded"
                                                    sx={{ width: 50, height: 70 }}
                                                />
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={item.novelName}
                                                secondary={
                                                    item.chapters?.length > 0
                                                        ? `${item.chapters.length} new chapter${item.chapters.length > 1 ? 's' : ''}`
                                                        : 'New chapters available'
                                                }
                                                sx={{ ml: 1 }}
                                            />
                                            <Chip
                                                label={item.chapters?.length || '✓'}
                                                size="small"
                                                color="primary"
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                            </List>
                        </Paper>
                    </Box>
                ))
            )}
        </Container>
    );
}
