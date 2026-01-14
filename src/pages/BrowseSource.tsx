import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container, Typography, Box, Card, CardMedia, CardContent,
    Tabs, Tab, TextField, InputAdornment, IconButton, CircularProgress,
    Button, Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import axios from 'axios';
import WebViewBypass from '../components/WebViewBypass';

interface NovelItem {
    path: string;
    title: string;
    cover?: string;
}

export default function BrowseSource() {
    const { pluginId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [novels, setNovels] = useState<NovelItem[]>([]);
    const [page, setPage] = useState(1);
    const [tab, setTab] = useState('latest');
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [showBypass, setShowBypass] = useState(false);
    const [bypassUrl, setBypassUrl] = useState('');

    useEffect(() => {
        fetchNovels();
    }, [pluginId, tab, page]);

    const fetchNovels = async () => {
        if (!pluginId) return;
        setLoading(true);
        setError(null);
        try {
            let url = `/api/source/${pluginId}/${tab}?page=${page}`;
            if (searchQuery) {
                url = `/api/source/${pluginId}/search?query=${encodeURIComponent(searchQuery)}&page=${page}`;
            }

            const res = await axios.get(url);
            setNovels(res.data);
        } catch (e: any) {
            console.error("Failed to fetch novels", e);
            const errorMsg = e.response?.data?.error || e.message || 'Failed to fetch novels';
            setError(errorMsg);
            setNovels([]);

            // Check if it's a Cloudflare error
            if (errorMsg.toLowerCase().includes('cloudflare') || e.response?.status === 503) {
                // Get the source URL from the plugin
                try {
                    const pluginRes = await axios.get('/api/source/installed');
                    const plugin = pluginRes.data.find((p: any) => p.id === pluginId);
                    if (plugin?.site) {
                        setBypassUrl(plugin.site);
                    }
                } catch {
                    // Fallback to a generic approach
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchNovels();
    };

    const handleBypassSuccess = () => {
        setShowBypass(false);
        fetchNovels(); // Retry
    };

    return (
        <Container sx={{ mt: 2, mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <IconButton onClick={() => navigate('/browse')} sx={{ mr: 1 }}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h5">{pluginId}</Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
                <Tabs value={tab} onChange={(_, v) => { setTab(v); setPage(1); setSearchQuery(''); }} aria-label="source tabs">
                    <Tab label="Popular" value="popular" />
                    <Tab label="Latest" value="latest" />
                </Tabs>
            </Box>

            <Box sx={{ mb: 3 }} component="form" onSubmit={handleSearch}>
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>

            {error && (
                <Alert
                    severity="error"
                    sx={{ mb: 2 }}
                    action={
                        error.toLowerCase().includes('cloudflare') || error.toLowerCase().includes('internal') ? (
                            <Button
                                color="inherit"
                                size="small"
                                startIcon={<OpenInNewIcon />}
                                onClick={() => setShowBypass(true)}
                            >
                                Open WebView
                            </Button>
                        ) : undefined
                    }
                >
                    {error}
                    {(error.toLowerCase().includes('cloudflare') || error.toLowerCase().includes('internal')) && (
                        <Typography variant="caption" display="block">
                            This source may be protected by Cloudflare. Click "Open WebView" to solve the challenge.
                        </Typography>
                    )}
                </Alert>
            )}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: 'repeat(3, 1fr)', sm: 'repeat(4, 1fr)', md: 'repeat(6, 1fr)' },
                    gap: 2
                }}>
                    {novels.map((novel) => (
                        <Box key={novel.path}>
                            <Card
                                sx={{ height: '100%', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
                                onClick={() => navigate(`/novel/source/${pluginId}/${encodeURIComponent(novel.path)}`)}
                            >
                                <CardMedia
                                    component="img"
                                    image={novel.cover?.startsWith('http')
                                        ? `/api/image-proxy?url=${encodeURIComponent(novel.cover)}`
                                        : novel.cover || ''}
                                    alt={novel.title}
                                    sx={{ aspectRatio: '2/3', objectFit: 'cover' }}
                                />
                                <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                                    <Typography variant="body2" noWrap title={novel.title}>
                                        {novel.title}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Box>
                    ))}
                    {novels.length === 0 && !loading && !error && (
                        <Typography sx={{ mt: 2, ml: 2, gridColumn: '1 / -1' }}>No novels found.</Typography>
                    )}
                </Box>
            )}

            <WebViewBypass
                open={showBypass}
                onClose={() => setShowBypass(false)}
                url={bypassUrl || `https://${pluginId?.replace(/\.[^.]+$/, '')}.com`}
                pluginId={pluginId || ''}
                onSuccess={handleBypassSuccess}
            />
        </Container>
    );
}

