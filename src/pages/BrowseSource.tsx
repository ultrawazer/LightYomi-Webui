import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container, Typography, Box, Card, CardMedia, CardContent,
    Tabs, Tab, TextField, InputAdornment, IconButton, CircularProgress,
    Button, Alert, Badge, Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import FilterListIcon from '@mui/icons-material/FilterList';
import axios from 'axios';
import WebViewBypass from '../components/WebViewBypass';
import { FilterDrawer } from '../components/filters';
import type { Filters, FilterValues } from '../components/filters';
import { useToolbar } from '../contexts/ToolbarContext';

interface NovelItem {
    path: string;
    title: string;
    cover?: string;
}

interface PluginInfo {
    id: string;
    name: string;
    site: string;
    filters?: Filters;
}

export default function BrowseSource() {
    const { pluginId } = useParams();
    const navigate = useNavigate();
    const { setToolbarContent, setPageTitle, setBackPath } = useToolbar();

    // Core state
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [novels, setNovels] = useState<NovelItem[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [tab, setTab] = useState('popular');
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Plugin info
    const [pluginInfo, setPluginInfo] = useState<PluginInfo | null>(null);

    // Filter state
    const [showFilters, setShowFilters] = useState(false);
    const [pluginFilters, setPluginFilters] = useState<Filters | null>(null);
    const [filterValues, setFilterValues] = useState<FilterValues>({});
    const [activeFilterCount, setActiveFilterCount] = useState(0);

    // WebView bypass state
    const [showBypass, setShowBypass] = useState(false);
    const [bypassUrl, setBypassUrl] = useState('');

    // Infinite scroll ref
    const loadMoreRef = useRef<HTMLDivElement>(null);

    // Load plugin info and filters on mount
    useEffect(() => {
        if (pluginId) {
            loadPluginInfo();
            loadPluginFilters();
        }
    }, [pluginId]);

    // Set toolbar content with back button, title, and action icons
    useEffect(() => {
        setPageTitle(pluginInfo?.name || pluginId || 'Browse');
        setBackPath('/browse'); // Enable back button to browse page
        setToolbarContent(
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tooltip title="Filters">
                    <IconButton color="inherit" onClick={() => setShowFilters(true)}>
                        <Badge badgeContent={activeFilterCount} color="error">
                            <FilterListIcon />
                        </Badge>
                    </IconButton>
                </Tooltip>
                <Tooltip title="Open in WebView">
                    <IconButton color="inherit" onClick={() => setShowBypass(true)}>
                        <OpenInNewIcon />
                    </IconButton>
                </Tooltip>
            </Box>
        );
        return () => {
            setToolbarContent(null);
            setPageTitle(null);
            setBackPath(null);
        };
    }, [pluginInfo, pluginId, activeFilterCount, setToolbarContent, setPageTitle, setBackPath]);

    // Fetch novels when tab, page, or filters change
    useEffect(() => {
        if (page === 1) {
            setNovels([]);
            fetchNovels(true);
        } else {
            fetchNovels(false);
        }
    }, [pluginId, tab, page, searchQuery]);

    // Infinite scroll observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !loading && !loadingMore && hasMore) {
                    setPage(p => p + 1);
                }
            },
            { threshold: 0.1 }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [loading, loadingMore, hasMore]);

    const loadPluginInfo = async () => {
        try {
            const res = await axios.get('/api/source/installed');
            const plugin = res.data.find((p: any) => p.id === pluginId);
            if (plugin) {
                setPluginInfo(plugin);
                setBypassUrl(plugin.site);
            }
        } catch (e) {
            console.error('Failed to load plugin info', e);
        }
    };

    const loadPluginFilters = async () => {
        try {
            const res = await axios.get(`/api/source/${pluginId}/filters`);
            if (res.data?.filters) {
                setPluginFilters(res.data.filters);
                // Initialize filter values with defaults
                const defaults: FilterValues = {};
                Object.entries(res.data.filters).forEach(([key, filter]: [string, any]) => {
                    defaults[key] = { type: filter.type, value: filter.value };
                });
                setFilterValues(defaults);
            }
        } catch (e) {
            console.error('Failed to load plugin filters', e);
        }
    };

    const fetchNovels = async (reset: boolean) => {
        if (!pluginId) return;

        if (reset) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }
        setError(null);

        try {
            let url = `/api/source/${pluginId}/${tab}?page=${page}`;

            // Add filters if set
            if (Object.keys(filterValues).length > 0) {
                url += `&filters=${encodeURIComponent(JSON.stringify(filterValues))}`;
            }

            if (tab === 'popular') {
                url += `&showLatestNovels=false`;
            }

            if (searchQuery) {
                url = `/api/source/${pluginId}/search?query=${encodeURIComponent(searchQuery)}&page=${page}`;
            }

            const res = await axios.get(url);
            const newNovels = res.data || [];

            if (reset) {
                setNovels(newNovels);
            } else {
                setNovels(prev => [...prev, ...newNovels]);
            }

            // Check if we have more pages
            setHasMore(newNovels.length >= 20); // Assume 20 per page

        } catch (e: any) {
            console.error("Failed to fetch novels", e);
            const errorMsg = e.response?.data?.error || e.message || 'Failed to fetch novels';
            setError(errorMsg);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
    };

    const handleTabChange = (newTab: string) => {
        setTab(newTab);
        setPage(1);
        setSearchQuery('');
    };

    const handleApplyFilters = () => {
        // Count active filters (non-default values)
        let count = 0;
        if (pluginFilters) {
            Object.entries(filterValues).forEach(([key, val]: [string, any]) => {
                const defaultVal = pluginFilters[key]?.value;
                if (JSON.stringify(val.value) !== JSON.stringify(defaultVal)) {
                    count++;
                }
            });
        }
        setActiveFilterCount(count);
        setPage(1);
    };

    const handleResetFilters = () => {
        if (pluginFilters) {
            const defaults: FilterValues = {};
            Object.entries(pluginFilters).forEach(([key, filter]: [string, any]) => {
                defaults[key] = { type: filter.type, value: filter.value };
            });
            setFilterValues(defaults);
        }
        setActiveFilterCount(0);
    };

    const handleBypassSuccess = () => {
        setShowBypass(false);
        setPage(1);
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 2, mb: 4, px: { xs: 2, md: 4 } }}>

            {/* Tabs */}
            <Box sx={{ mb: 2 }}>
                <Tabs
                    value={tab}
                    onChange={(_, v) => handleTabChange(v)}
                    aria-label="source tabs"
                >
                    <Tab label="Popular" value="popular" />
                    <Tab label="Latest" value="latest" />
                </Tabs>
            </Box>

            {/* Search */}
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

            {/* Error Alert */}
            {error && (
                <Alert
                    severity="error"
                    sx={{ mb: 2 }}
                    action={
                        <Button
                            color="inherit"
                            size="small"
                            startIcon={<OpenInNewIcon />}
                            onClick={() => setShowBypass(true)}
                        >
                            Open WebView
                        </Button>
                    }
                >
                    {error}
                </Alert>
            )}

            {/* Novels Grid */}
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
                    {novels.map((novel, index) => (
                        <Card
                            key={`${novel.path}-${index}`}
                            sx={{ cursor: 'pointer', borderRadius: 2, overflow: 'hidden' }}
                            onClick={() => navigate(`/novel/source/${pluginId}/${encodeURIComponent(novel.path)}`)}
                        >
                            {/* Padding-top trick for 2:3 aspect ratio (150% = 3/2) */}
                            <Box sx={{ position: 'relative', pt: '150%' }}>
                                <Box
                                    component="img"
                                    src={novel.cover?.startsWith('http')
                                        ? `/api/image-proxy?url=${encodeURIComponent(novel.cover)}`
                                        : novel.cover || ''}
                                    alt={novel.title}
                                    sx={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                    }}
                                />
                                {/* Title overlay with gradient */}
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
                                        p: 1,
                                        pt: 4,
                                    }}
                                >
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: 'white',
                                            fontWeight: 500,
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                            lineHeight: 1.2,
                                            textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                                        }}
                                        title={novel.title}
                                    >
                                        {novel.title}
                                    </Typography>
                                </Box>
                            </Box>
                        </Card>
                    ))}
                </Box>
            )}

            {/* No results */}
            {novels.length === 0 && !loading && !error && (
                <Typography sx={{ mt: 2, textAlign: 'center' }}>
                    No novels found.
                </Typography>
            )}

            {/* Load more indicator / Infinite scroll trigger */}
            {hasMore && !loading && novels.length > 0 && (
                <Box ref={loadMoreRef} sx={{ display: 'flex', justifyContent: 'center', mt: 4, py: 2 }}>
                    {loadingMore ? (
                        <CircularProgress size={30} />
                    ) : (
                        <Typography variant="body2" color="text.secondary">
                            Scroll for more...
                        </Typography>
                    )}
                </Box>
            )}

            {/* End of results */}
            {!hasMore && novels.length > 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
                    End of results
                </Typography>
            )}

            {/* Filter Drawer */}
            <FilterDrawer
                open={showFilters}
                onClose={() => setShowFilters(false)}
                pluginId={pluginId || ''}
                filters={pluginFilters}
                values={filterValues}
                onChange={setFilterValues}
                onApply={handleApplyFilters}
                onReset={handleResetFilters}
            />

            {/* WebView Bypass */}
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
