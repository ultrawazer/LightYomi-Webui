import { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper, Divider, Chip } from '@mui/material';
import axios from 'axios';

interface StatsData {
    novelsCount: number;
    sourcesCount: number;
    chaptersCount: number;
    chaptersRead: number;
    chaptersUnread: number;
    chaptersDownloaded: number;
    genres: Record<string, number>;
    status: Record<string, number>;
}

export default function Stats() {
    const [stats, setStats] = useState<StatsData | null>(null);

    useEffect(() => {
        axios.get('/api/stats').then(res => setStats(res.data)).catch(console.error);
    }, []);

    if (!stats) return <Box p={4}><Typography>Loading...</Typography></Box>;

    return (
        <Container maxWidth="xl" sx={{ mt: 2, mb: 4, px: { xs: 2, md: 4 } }}>
            <Typography variant="h4" gutterBottom>Statistics</Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {/* General Stats */}
                <Box sx={{ flex: '1 1 300px' }}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="h6" color="primary" gutterBottom>General</Typography>
                        <StatRow label="Novels in Library" value={stats.novelsCount} />
                        <StatRow label="Sources Used" value={stats.sourcesCount} />
                        <Divider sx={{ my: 1 }} />
                        <StatRow label="Total Chapters" value={stats.chaptersCount} />
                        <StatRow label="Chapters Read" value={stats.chaptersRead} />
                        <StatRow label="Chapters Unread" value={stats.chaptersUnread} />
                        <StatRow label="Downloaded" value={stats.chaptersDownloaded} />
                    </Paper>
                </Box>

                {/* Status Distribution */}
                <Box sx={{ flex: '1 1 300px' }}>
                    <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                        <Typography variant="h6" color="primary" gutterBottom>Status Distribution</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {Object.entries(stats.status || {}).map(([status, count]) => (
                                <Chip key={status} label={`${status}: ${count}`} variant="outlined" />
                            ))}
                        </Box>
                    </Paper>
                </Box>
            </Box>

            {/* Genre Distribution */}
            <Box sx={{ mt: 3 }}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="h6" color="primary" gutterBottom>Genre Distribution</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {Object.entries(stats.genres || {})
                            .sort((a, b) => b[1] - a[1]) // Sort by count desc
                            .map(([genre, count]) => (
                                <Chip
                                    key={genre}
                                    label={`${genre} (${count})`}
                                    color="default"
                                    size="small"
                                />
                            ))}
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
}

function StatRow({ label, value }: { label: string, value: number }) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
            <Typography variant="body1">{label}</Typography>
            <Typography variant="body1" fontWeight="bold">{value}</Typography>
        </Box>
    );
}
