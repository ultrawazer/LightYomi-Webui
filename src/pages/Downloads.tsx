/**
 * Downloads Page - Queue Management with Real-time Progress
 * 
 * Features:
 * - View download queue with real-time progress via WebSocket
 * - Pause/resume downloads
 * - Cancel individual or all downloads
 * - View download history
 * - Format selection for new downloads
 * - Storage usage display
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    ListItemSecondaryAction,
    IconButton,
    Button,
    LinearProgress,
    Chip,
    Divider,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Alert,
    Tooltip,
    Tabs,
    Tab,
    CircularProgress,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteIcon from '@mui/icons-material/Delete';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import StorageIcon from '@mui/icons-material/Storage';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import RefreshIcon from '@mui/icons-material/Refresh';
import axios from 'axios';

interface DownloadTask {
    id: string;
    name: string;
    data: {
        chapterId: number;
        novelName: string;
        chapterName: string;
    };
    status: 'pending' | 'downloading' | 'completed' | 'error';
    progress: number;
    error?: string;
}

interface StorageInfo {
    used: string;
    free: string;
    total: string;
    novelCount: number;
    chapterCount: number;
}

type DownloadFormat = 'txt' | 'md' | 'html';

export default function Downloads() {
    const [activeTab, setActiveTab] = useState(0);
    const [tasks, setTasks] = useState<DownloadTask[]>([]);
    const [wsConnected, setWsConnected] = useState(false);
    const [defaultFormat, setDefaultFormat] = useState<DownloadFormat>('html');
    const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
    const [isPaused, setIsPaused] = useState(false);

    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        fetchQueue();
        fetchStorageInfo();
        fetchSettings();
        connectWebSocket();

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    const connectWebSocket = useCallback(() => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

        ws.onopen = () => {
            console.log('WebSocket connected');
            setWsConnected(true);
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                handleWsMessage(message);
            } catch (e) {
                console.error('WebSocket message parse error:', e);
            }
        };

        ws.onclose = () => {
            console.log('WebSocket disconnected');
            setWsConnected(false);
            // Reconnect after 3 seconds
            setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        wsRef.current = ws;
    }, []);

    const handleWsMessage = (message: any) => {
        switch (message.type) {
            case 'download:started':
                setTasks((prev) => prev.map((t) =>
                    t.data.chapterId === message.data.chapterId
                        ? { ...t, status: 'downloading' as const }
                        : t
                ));
                break;
            case 'download:progress':
                setTasks((prev) => prev.map((t) =>
                    t.data.chapterId === message.data.chapterId
                        ? { ...t, progress: message.data.progress }
                        : t
                ));
                break;
            case 'download:completed':
                setTasks((prev) => prev.map((t) =>
                    t.data.chapterId === message.data.chapterId
                        ? { ...t, status: 'completed' as const, progress: 100 }
                        : t
                ));
                fetchStorageInfo();
                break;
            case 'download:error':
                setTasks((prev) => prev.map((t) =>
                    t.data.chapterId === message.data.chapterId
                        ? { ...t, status: 'error' as const, error: message.data.error }
                        : t
                ));
                break;
            case 'download:queue':
                setTasks(message.data.queue.map((item: any) => ({
                    id: `task_${item.id}`,
                    name: item.name,
                    data: item.data || {},
                    status: item.status || 'pending',
                    progress: item.progress || 0,
                })));
                break;
        }
    };

    const fetchQueue = async () => {
        try {
            const res = await axios.get('/api/queue');
            const queueTasks = (res.data || []).map((item: any, index: number) => ({
                id: `task_${index}`,
                name: item.name || 'Download',
                data: item.data || {},
                status: 'pending' as const,
                progress: 0,
            }));
            setTasks(queueTasks);
        } catch (e) {
            console.error('Failed to fetch queue:', e);
        }
    };

    const fetchStorageInfo = async () => {
        try {
            const res = await axios.get('/api/stats/storage');
            setStorageInfo(res.data);
        } catch (e) {
            console.error('Failed to fetch storage info:', e);
        }
    };

    const fetchSettings = async () => {
        try {
            const res = await axios.get('/api/settings/storage');
            setDefaultFormat(res.data['storage.defaultFormat'] || 'html');
        } catch (e) {
            console.error('Failed to fetch settings:', e);
        }
    };

    const handleFormatChange = async (format: DownloadFormat) => {
        setDefaultFormat(format);
        try {
            await axios.post('/api/settings/storage.defaultFormat', { value: format });
        } catch (e) {
            console.error('Failed to save format setting:', e);
        }
    };

    const handleClearCompleted = () => {
        setTasks((prev) => prev.filter((t) => t.status !== 'completed'));
    };

    const handleClearAll = async () => {
        try {
            await axios.delete('/api/queue');
            setTasks([]);
        } catch (e) {
            console.error('Failed to clear queue:', e);
        }
    };

    const handleCancelTask = async (taskId: string) => {
        try {
            await axios.delete(`/api/queue/${taskId}`);
            setTasks((prev) => prev.filter((t) => t.id !== taskId));
        } catch (e) {
            console.error('Failed to cancel task:', e);
        }
    };

    const handleClearCache = async () => {
        if (!confirm('This will delete all downloaded chapters. Continue?')) return;
        try {
            await axios.delete('/api/novel/downloads');
            fetchStorageInfo();
            alert('Cache cleared successfully');
        } catch (e) {
            console.error('Failed to clear cache:', e);
            alert('Failed to clear cache');
        }
    };

    const getStatusIcon = (status: DownloadTask['status']) => {
        switch (status) {
            case 'completed':
                return <CheckCircleIcon color="success" />;
            case 'error':
                return <ErrorIcon color="error" />;
            case 'downloading':
                return <DownloadIcon color="primary" />;
            default:
                return <DownloadIcon color="disabled" />;
        }
    };

    const pendingCount = tasks.filter((t) => t.status === 'pending').length;
    const activeCount = tasks.filter((t) => t.status === 'downloading').length;
    const completedCount = tasks.filter((t) => t.status === 'completed').length;

    return (
        <Container maxWidth="xl" sx={{ mt: 2, pb: 4, px: { xs: 2, md: 4 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h5" fontWeight={600}>
                    Downloads
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
                        label={wsConnected ? 'Connected' : 'Disconnected'}
                        variant="outlined"
                    />
                    <Tooltip title="Refresh">
                        <IconButton onClick={fetchQueue}>
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2 }}>
                <Tab label={`Queue (${pendingCount + activeCount})`} />
                <Tab label={`Completed (${completedCount})`} />
                <Tab label="Settings" />
            </Tabs>

            {/* Queue Tab */}
            {activeTab === 0 && (
                <>
                    {tasks.filter((t) => t.status !== 'completed').length === 0 ? (
                        <Paper sx={{ p: 4, textAlign: 'center' }}>
                            <DownloadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                            <Typography color="text.secondary">
                                No active downloads
                            </Typography>
                        </Paper>
                    ) : (
                        <>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 2 }}>
                                <Button
                                    startIcon={isPaused ? <PlayArrowIcon /> : <PauseIcon />}
                                    onClick={() => setIsPaused(!isPaused)}
                                    disabled
                                >
                                    {isPaused ? 'Resume' : 'Pause'}
                                </Button>
                                <Button
                                    startIcon={<ClearAllIcon />}
                                    color="error"
                                    onClick={handleClearAll}
                                >
                                    Clear All
                                </Button>
                            </Box>
                            <List>
                                {tasks.filter((t) => t.status !== 'completed').map((task) => (
                                    <Paper key={task.id} sx={{ mb: 1 }}>
                                        <ListItem>
                                            <ListItemIcon>
                                                {task.status === 'downloading' ? (
                                                    <CircularProgress size={24} />
                                                ) : (
                                                    getStatusIcon(task.status)
                                                )}
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={task.data.chapterName || task.name}
                                                secondary={task.data.novelName}
                                            />
                                            <ListItemSecondaryAction>
                                                <IconButton
                                                    edge="end"
                                                    onClick={() => handleCancelTask(task.id)}
                                                    size="small"
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                        {task.status === 'downloading' && (
                                            <LinearProgress
                                                variant="determinate"
                                                value={task.progress}
                                                sx={{ mx: 2, mb: 1 }}
                                            />
                                        )}
                                        {task.status === 'error' && (
                                            <Alert severity="error" sx={{ mx: 2, mb: 1 }}>
                                                {task.error || 'Download failed'}
                                            </Alert>
                                        )}
                                    </Paper>
                                ))}
                            </List>
                        </>
                    )}
                </>
            )}

            {/* Completed Tab */}
            {activeTab === 1 && (
                <>
                    {completedCount === 0 ? (
                        <Paper sx={{ p: 4, textAlign: 'center' }}>
                            <CheckCircleIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                            <Typography color="text.secondary">
                                No completed downloads
                            </Typography>
                        </Paper>
                    ) : (
                        <>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                                <Button startIcon={<ClearAllIcon />} onClick={handleClearCompleted}>
                                    Clear Completed
                                </Button>
                            </Box>
                            <List>
                                {tasks.filter((t) => t.status === 'completed').map((task) => (
                                    <Paper key={task.id} sx={{ mb: 1 }}>
                                        <ListItem>
                                            <ListItemIcon>
                                                <CheckCircleIcon color="success" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={task.data.chapterName || task.name}
                                                secondary={task.data.novelName}
                                            />
                                        </ListItem>
                                    </Paper>
                                ))}
                            </List>
                        </>
                    )}
                </>
            )}

            {/* Settings Tab */}
            {activeTab === 2 && (
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Download Settings
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    {/* Format Selection */}
                    <FormControl fullWidth sx={{ mb: 3 }}>
                        <InputLabel>Default Download Format</InputLabel>
                        <Select
                            value={defaultFormat}
                            label="Default Download Format"
                            onChange={(e) => handleFormatChange(e.target.value as DownloadFormat)}
                        >
                            <MenuItem value="txt">Plain Text (.txt) - Smallest, no formatting</MenuItem>
                            <MenuItem value="md">Markdown (.md) - Readable with basic formatting</MenuItem>
                            <MenuItem value="html">HTML (.html) - Full formatting preserved</MenuItem>
                            <MenuItem value="epub" disabled>EPUB (.epub) - Coming soon</MenuItem>
                        </Select>
                    </FormControl>

                    <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                        Storage
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    {storageInfo ? (
                        <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <StorageIcon color="primary" />
                                <Typography>
                                    {storageInfo.used} used of {storageInfo.total}
                                </Typography>
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={parseFloat(storageInfo.used) / parseFloat(storageInfo.total) * 100 || 0}
                                sx={{ height: 8, borderRadius: 1, mb: 2 }}
                            />
                            <Typography variant="body2" color="text.secondary">
                                {storageInfo.novelCount} novels, {storageInfo.chapterCount} chapters downloaded
                            </Typography>
                        </Box>
                    ) : (
                        <Typography color="text.secondary">Loading storage info...</Typography>
                    )}

                    <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={handleClearCache}
                    >
                        Clear All Downloaded Chapters
                    </Button>
                </Paper>
            )}
        </Container>
    );
}
