/**
 * Browse Page - Complete Redesign
 * 
 * Features:
 * - Source cards with icons
 * - Global search across all sources
 * - Extensions management
 * - Repository management (add/remove plugin repos)
 * - Suwayomi-style UI
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Typography,
    Box,
    Paper,
    Tabs,
    Tab,
    TextField,
    InputAdornment,
    Button,
    IconButton,
    Card,
    CardActionArea,
    CardContent,
    CardMedia,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Tooltip,
    CircularProgress,
    Alert,
    FormControl,
    Select,
    MenuItem,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LanguageIcon from '@mui/icons-material/Language';
import axios from 'axios';
import { useToolbar } from '../contexts/ToolbarContext';

interface Plugin {
    id: string;
    name: string;
    version: string;
    iconUrl: string;
    site: string;
    lang?: string;
}

interface Repository {
    id: number;
    name: string;
    url: string;
}

interface SearchResult {
    pluginId: string;
    pluginName: string;
    novels: {
        name: string;
        cover: string;
        path: string;
    }[];
}

export default function Browse() {
    const navigate = useNavigate();

    const [tab, setTab] = useState(0);
    const [installedPlugins, setInstalledPlugins] = useState<Plugin[]>([]);
    const [availablePlugins, setAvailablePlugins] = useState<any[]>([]);
    const [repositories, setRepositories] = useState<Repository[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [globalSearchQuery, setGlobalSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [loading, setLoading] = useState(true);

    // Language filter state
    const [selectedLanguage, setSelectedLanguage] = useState<string>('all');

    // Extract unique languages from plugins
    const availableLanguages = useMemo(() => {
        const allPlugins = [...installedPlugins, ...availablePlugins];
        const langSet = new Set<string>();
        allPlugins.forEach(p => {
            if (p.lang) langSet.add(p.lang);
        });
        return Array.from(langSet).sort();
    }, [installedPlugins, availablePlugins]);

    // Dialog states
    const [repoDialogOpen, setRepoDialogOpen] = useState(false);
    const [newRepoUrl, setNewRepoUrl] = useState('');

    useEffect(() => {
        fetchInstalled();
        fetchAvailable();
        fetchRepositories();
    }, []);

    const fetchInstalled = async () => {
        try {
            const res = await axios.get('/api/source/installed');
            setInstalledPlugins(res.data);
        } catch (e) {
            console.error('Failed to fetch installed plugins:', e);
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailable = async () => {
        try {
            const res = await axios.get('/api/source/available');
            setAvailablePlugins(res.data);
        } catch (e) {
            console.error('Failed to fetch available plugins:', e);
        }
    };

    const fetchRepositories = async () => {
        try {
            const res = await axios.get('/api/source/repos');
            setRepositories(res.data || []);
        } catch (e) {
            console.error('Failed to fetch repositories:', e);
        }
    };

    const handleInstall = async (plugin: any) => {
        try {
            await axios.post('/api/source/install', plugin);
            fetchInstalled();
        } catch (e) {
            console.error('Failed to install plugin:', e);
            alert('Failed to install plugin');
        }
    };

    const handleUninstall = async (plugin: Plugin) => {
        if (!confirm(`Uninstall ${plugin.name}?`)) return;
        try {
            await axios.post('/api/source/uninstall', plugin);
            fetchInstalled();
        } catch (e) {
            console.error('Failed to uninstall plugin:', e);
            alert('Failed to uninstall plugin');
        }
    };

    const handleAddRepo = async () => {
        if (!newRepoUrl.trim()) return;
        try {
            await axios.post('/api/source/repos', { url: newRepoUrl.trim() });
            setNewRepoUrl('');
            setRepoDialogOpen(false);
            fetchRepositories();
            fetchAvailable();
        } catch (e) {
            console.error('Failed to add repository:', e);
            alert('Failed to add repository');
        }
    };

    const handleRemoveRepo = async (repoId: number) => {
        try {
            await axios.delete(`/api/source/repos/${repoId}`);
            fetchRepositories();
            fetchAvailable();
        } catch (e) {
            console.error('Failed to remove repository:', e);
        }
    };

    const handleGlobalSearch = useCallback(async () => {
        if (!globalSearchQuery.trim()) return;
        setSearching(true);
        setSearchResults([]);

        try {
            const res = await axios.get(`/api/source/search?query=${encodeURIComponent(globalSearchQuery)}`);
            setSearchResults(res.data || []);
        } catch (e) {
            console.error('Global search failed:', e);
        } finally {
            setSearching(false);
        }
    }, [globalSearchQuery]);

    const isInstalled = (pluginId: string) => {
        return installedPlugins.some((p) => p.id === pluginId);
    };

    const filteredInstalled = installedPlugins.filter((p) =>
        (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.site.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (selectedLanguage === 'all' || p.lang === selectedLanguage)
    );

    const filteredAvailable = availablePlugins.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !isInstalled(p.id) &&
        (selectedLanguage === 'all' || p.lang === selectedLanguage)
    );

    // Set toolbar content for AppBar
    const { setToolbarContent } = useToolbar();

    useEffect(() => {
        const toolbarElements = (
            <>
                {/* Language Filter */}
                <FormControl size="small" sx={{ minWidth: 100, mr: 1 }}>
                    <Select
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                        sx={{
                            color: 'inherit',
                            '.MuiSelect-icon': { color: 'inherit' },
                            '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' },
                        }}
                        displayEmpty
                    >
                        <MenuItem value="all">All Languages</MenuItem>
                        {availableLanguages.map(lang => (
                            <MenuItem key={lang} value={lang}>{lang.toUpperCase()}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Box sx={{ flexGrow: 1 }} />
                <Tooltip title="Refresh">
                    <IconButton color="inherit" onClick={() => { fetchInstalled(); fetchAvailable(); }}>
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
            </>
        );
        setToolbarContent(toolbarElements);
        return () => setToolbarContent(null);
    }, [selectedLanguage, availableLanguages]);

    return (
        <Container maxWidth="xl" sx={{ mt: 2, pb: 4, px: { xs: 2, md: 4 } }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Tab label="Sources" />
                <Tab label="Global Search" />
                <Tab label="Extensions" />
                <Tab label="Repositories" />
            </Tabs>

            {/* Sources Tab */}
            {tab === 0 && (
                <>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Search installed sources..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ mb: 3 }}
                    />

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : filteredInstalled.length === 0 ? (
                        <Paper sx={{ p: 4, textAlign: 'center' }}>
                            <LanguageIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                            <Typography color="text.secondary">
                                {searchQuery ? 'No matching sources found.' : 'No sources installed. Go to Extensions to install some.'}
                            </Typography>
                        </Paper>
                    ) : (
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)', md: 'repeat(5, 1fr)', lg: 'repeat(6, 1fr)' }, gap: 2 }}>
                            {filteredInstalled.map((plugin) => (
                                <Box key={plugin.id}>
                                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                        <CardActionArea onClick={() => navigate(`/browse/${plugin.id}`)} sx={{ flex: 1 }}>
                                            <CardMedia
                                                component="img"
                                                height="80"
                                                image={plugin.iconUrl || '/api/image-proxy?url=https://via.placeholder.com/80'}
                                                alt={plugin.name}
                                                sx={{ objectFit: 'contain', p: 2, bgcolor: 'background.default' }}
                                            />
                                            <CardContent sx={{ p: 1.5 }}>
                                                <Typography variant="subtitle2" noWrap>
                                                    {plugin.name}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" noWrap>
                                                    {plugin.lang || 'EN'} • v{plugin.version}
                                                </Typography>
                                            </CardContent>
                                        </CardActionArea>
                                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 0.5, borderTop: 1, borderColor: 'divider' }}>
                                            <Tooltip title="Uninstall">
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleUninstall(plugin);
                                                    }}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </Card>
                                </Box>
                            ))}
                        </Box>
                    )}
                </>
            )}

            {/* Global Search Tab */}
            {tab === 1 && (
                <>
                    <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search across all sources..."
                            value={globalSearchQuery}
                            onChange={(e) => setGlobalSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleGlobalSearch()}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Button
                            variant="contained"
                            onClick={handleGlobalSearch}
                            disabled={searching || !globalSearchQuery.trim()}
                        >
                            {searching ? <CircularProgress size={24} /> : 'Search'}
                        </Button>
                    </Box>

                    {searchResults.length === 0 && !searching ? (
                        <Paper sx={{ p: 4, textAlign: 'center' }}>
                            <SearchIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                            <Typography color="text.secondary">
                                Search for novels across all installed sources
                            </Typography>
                        </Paper>
                    ) : (
                        searchResults.map((result) => (
                            <Box key={result.pluginId} sx={{ mb: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    {result.pluginName}
                                    <Chip label={`${result.novels.length} results`} size="small" sx={{ ml: 1 }} />
                                </Typography>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)', md: 'repeat(6, 1fr)' }, gap: 2 }}>
                                    {result.novels.slice(0, 6).map((novel, i) => (
                                        <Box key={i}>
                                            <Card>
                                                <CardActionArea
                                                    onClick={() => navigate(`/novel/source/${result.pluginId}/${encodeURIComponent(novel.path)}`)}
                                                >
                                                    <CardMedia
                                                        component="img"
                                                        height="150"
                                                        image={novel.cover?.startsWith('http')
                                                            ? `/api/image-proxy?url=${encodeURIComponent(novel.cover)}`
                                                            : novel.cover || '/api/image-proxy?url=https://via.placeholder.com/150'}
                                                        alt={novel.name}
                                                        sx={{ objectFit: 'cover' }}
                                                    />
                                                    <CardContent sx={{ p: 1 }}>
                                                        <Typography variant="caption" noWrap>
                                                            {novel.name}
                                                        </Typography>
                                                    </CardContent>
                                                </CardActionArea>
                                            </Card>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        ))
                    )}
                </>
            )
            }

            {/* Extensions Tab */}
            {
                tab === 2 && (
                    <>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search available extensions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ mb: 3 }}
                        />

                        {filteredAvailable.length === 0 ? (
                            <Paper sx={{ p: 4, textAlign: 'center' }}>
                                <DownloadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                                <Typography color="text.secondary">
                                    {searchQuery ? 'No matching extensions found.' : 'All available extensions are already installed.'}
                                </Typography>
                            </Paper>
                        ) : (
                            <List>
                                {filteredAvailable.map((plugin) => (
                                    <Paper key={plugin.id || plugin.url} sx={{ mb: 1 }}>
                                        <ListItem>
                                            <Box
                                                component="img"
                                                src={plugin.iconUrl || '/api/image-proxy?url=https://via.placeholder.com/40'}
                                                sx={{ width: 40, height: 40, mr: 2, borderRadius: 1 }}
                                            />
                                            <ListItemText
                                                primary={plugin.name}
                                                secondary={`${plugin.lang || 'EN'} • ${plugin.url || plugin.site}`}
                                            />
                                            <ListItemSecondaryAction>
                                                {isInstalled(plugin.id) ? (
                                                    <Chip icon={<CheckCircleIcon />} label="Installed" size="small" color="success" />
                                                ) : (
                                                    <Button
                                                        variant="contained"
                                                        size="small"
                                                        startIcon={<DownloadIcon />}
                                                        onClick={() => handleInstall(plugin)}
                                                    >
                                                        Install
                                                    </Button>
                                                )}
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                    </Paper>
                                ))}
                            </List>
                        )}
                    </>
                )
            }

            {/* Repositories Tab */}
            {
                tab === 3 && (
                    <>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => setRepoDialogOpen(true)}
                            >
                                Add Repository
                            </Button>
                        </Box>

                        {repositories.length === 0 ? (
                            <Alert severity="info">
                                No custom repositories added. The default LightYomi plugin repository is always available.
                            </Alert>
                        ) : (
                            <List>
                                {repositories.map((repo) => (
                                    <Paper key={repo.id} sx={{ mb: 1 }}>
                                        <ListItem>
                                            <ListItemText
                                                primary={repo.name || 'Custom Repository'}
                                                secondary={repo.url}
                                            />
                                            <ListItemSecondaryAction>
                                                <IconButton color="error" onClick={() => handleRemoveRepo(repo.id)}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                    </Paper>
                                ))}
                            </List>
                        )}
                    </>
                )
            }

            {/* Add Repository Dialog */}
            <Dialog open={repoDialogOpen} onClose={() => setRepoDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add Repository</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Repository URL"
                        placeholder="https://example.com/plugins.json"
                        value={newRepoUrl}
                        onChange={(e) => setNewRepoUrl(e.target.value)}
                        sx={{ mt: 1 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRepoDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleAddRepo} disabled={!newRepoUrl.trim()}>
                        Add
                    </Button>
                </DialogActions>
            </Dialog>
        </Container >
    );
}
