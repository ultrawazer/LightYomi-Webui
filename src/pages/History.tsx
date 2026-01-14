/**
 * History Page - Enhanced with Resume Reading
 * 
 * Features:
 * - Reading history with resume button
 * - Group by date
 * - Remove individual items or clear all
 * - Suwayomi-style UI
 */

import { useState, useEffect } from 'react';
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
    IconButton,
    Button,
    Chip,
    Tooltip,
    CircularProgress,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import HistoryIcon from '@mui/icons-material/History';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface HistoryItem {
    id: number;
    novelId: number;
    novelName: string;
    novelCover: string;
    name: string;
    readTime: string;
    progress?: number;
}

export default function HistoryPage() {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await axios.get('/api/history');
            setHistory(res.data);
        } catch (e) {
            console.error('Failed to fetch history:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleResume = (item: HistoryItem) => {
        navigate(`/novel/${item.novelId}/chapter/${item.id}`);
    };

    const handleOpenNovel = (novelId: number) => {
        navigate(`/novel/${novelId}`);
    };

    const handleDelete = async (chapterId: number) => {
        try {
            await axios.delete(`/api/history/${chapterId}`);
            setHistory((prev) => prev.filter((h) => h.id !== chapterId));
        } catch (e) {
            console.error('Failed to delete history item:', e);
        }
    };

    const handleClearAll = async () => {
        if (!confirm('Clear all reading history?')) return;
        try {
            await axios.delete('/api/history');
            setHistory([]);
        } catch (e) {
            console.error('Failed to clear history:', e);
        }
    };

    // Group by date
    const groupedHistory = history.reduce((acc, item) => {
        const date = new Date(item.readTime).toDateString();
        if (!acc[date]) acc[date] = [];
        acc[date].push(item);
        return acc;
    }, {} as Record<string, HistoryItem[]>);

    const sortedDates = Object.keys(groupedHistory).sort(
        (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );

    const getCoverUrl = (cover: string) => {
        if (!cover) return '';
        if (cover.startsWith('http')) return `/api/image-proxy?url=${encodeURIComponent(cover)}`;
        return cover;
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
                    History
                    <Chip label={history.length} size="small" sx={{ ml: 1 }} />
                </Typography>
                {history.length > 0 && (
                    <Button
                        startIcon={<DeleteSweepIcon />}
                        color="error"
                        onClick={handleClearAll}
                    >
                        Clear All
                    </Button>
                )}
            </Box>

            {history.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <HistoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography color="text.secondary">
                        No reading history yet.
                    </Typography>
                </Paper>
            ) : (
                sortedDates.map((dateStr) => (
                    <Box key={dateStr} sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            {formatDate(dateStr)}
                        </Typography>
                        <Paper variant="outlined">
                            <List disablePadding>
                                {groupedHistory[dateStr].map((item, index) => (
                                    <ListItem
                                        key={item.id}
                                        divider={index < groupedHistory[dateStr].length - 1}
                                        secondaryAction={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Tooltip title="Resume reading">
                                                    <IconButton
                                                        color="primary"
                                                        onClick={() => handleResume(item)}
                                                    >
                                                        <PlayArrowIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Remove from history">
                                                    <IconButton
                                                        onClick={() => handleDelete(item.id)}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        }
                                        sx={{ cursor: 'pointer' }}
                                        onClick={() => handleOpenNovel(item.novelId)}
                                    >
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
                                                <>
                                                    <Typography
                                                        component="span"
                                                        variant="body2"
                                                        color="text.primary"
                                                    >
                                                        {item.name}
                                                    </Typography>
                                                    <br />
                                                    <Typography
                                                        component="span"
                                                        variant="caption"
                                                        color="text.secondary"
                                                    >
                                                        {formatTime(item.readTime)}
                                                        {item.progress && ` • ${item.progress}% read`}
                                                    </Typography>
                                                </>
                                            }
                                            sx={{ ml: 1 }}
                                        />
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
