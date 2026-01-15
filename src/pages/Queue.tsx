import { useState, useEffect } from 'react';
import { Container, Typography, Box, List, ListItem, ListItemText, LinearProgress, Paper, Button } from '@mui/material';
import axios from 'axios';
import { useToolbar } from '../contexts/ToolbarContext';

interface QueueItem {
    id: string;
    task: {
        name: string;
        data?: any;
    };
    meta: {
        name: string;
        isRunning: boolean;
        progress?: number;
        progressText?: string;
    };
}

export default function Queue() {
    const [queue, setQueue] = useState<QueueItem[]>([]);

    useEffect(() => {
        fetchQueue();
        const interval = setInterval(fetchQueue, 2000); // Poll every 2s
        return () => clearInterval(interval);
    }, []);

    const fetchQueue = async () => {
        try {
            const res = await axios.get('/api/queue');
            setQueue(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleStop = async () => {
        try {
            await axios.delete('/api/queue');
            fetchQueue();
        } catch (e) {
            console.error(e);
        }
    };

    // Set page title and toolbar for AppBar
    const { setToolbarContent, setPageTitle } = useToolbar();

    useEffect(() => {
        setPageTitle('Task Queue');
        const toolbarElements = queue.length > 0 ? (
            <>
                <Box sx={{ flexGrow: 1 }} />
                <Button color="inherit" variant="outlined" onClick={handleStop} sx={{ borderColor: 'rgba(255,255,255,0.3)' }}>
                    Stop All
                </Button>
            </>
        ) : null;
        setToolbarContent(toolbarElements);
        return () => {
            setToolbarContent(null);
            setPageTitle(null);
        };
    }, [queue.length]);

    return (
        <Container maxWidth="xl" sx={{ mt: 2, mb: 4, px: { xs: 2, md: 4 } }}>

            <Paper variant="outlined">
                <List>
                    {queue.length === 0 && (
                        <ListItem>
                            <ListItemText primary="No active tasks." />
                        </ListItem>
                    )}
                    {queue.map((item) => (
                        <ListItem key={item.id} divider>
                            <ListItemText
                                primary={item.meta.name || item.task.name}
                                secondary={
                                    <Box sx={{ mt: 1 }}>
                                        <Typography variant="caption">{item.meta.progressText}</Typography>
                                        {item.meta.progress !== undefined && (
                                            <LinearProgress
                                                variant="determinate"
                                                value={item.meta.progress * 100}
                                            />
                                        )}
                                        {item.meta.isRunning && item.meta.progress === undefined && (
                                            <LinearProgress />
                                        )}
                                    </Box>
                                }
                            />
                        </ListItem>
                    ))}
                </List>
            </Paper>
        </Container>
    );
}
