/**
 * Library Page - Complete Redesign
 * 
 * Features:
 * - Grid/List display toggle
 * - Filter by status (all, reading, completed, on hold)
 * - Sort by name, last read, date added, unread count
 * - Category tabs
 * - Search within library
 * - Batch selection mode
 * - Suwayomi-style UI
 */

import { useEffect, useState, useMemo } from 'react';
import {
    Container,
    CircularProgress,
    Typography,
    Box,
    IconButton,
    TextField,
    InputAdornment,
    ToggleButtonGroup,
    ToggleButton,
    Menu,
    MenuItem,
    Tabs,
    Tab,
    Checkbox,
    Button,
    Chip,
    Tooltip,
    Fade,
    Paper,
} from '@mui/material';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewListIcon from '@mui/icons-material/ViewList';
import SearchIcon from '@mui/icons-material/Search';
import SortIcon from '@mui/icons-material/Sort';
import RefreshIcon from '@mui/icons-material/Refresh';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import CategoryIcon from '@mui/icons-material/Category';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import NovelCard from '../components/NovelCard';
import type { Novel } from '../components/NovelCard';
import { useToolbar } from '../contexts/ToolbarContext';

interface Category {
    id: number;
    name: string;
    sort: number;
}

type SortOption = 'name' | 'lastRead' | 'dateAdded' | 'unread';
type DisplayMode = 'grid' | 'list';

export default function Library() {
    const navigate = useNavigate();

    // Data state
    const [novels, setNovels] = useState<Novel[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    // UI state
    const [displayMode, setDisplayMode] = useState<DisplayMode>(() =>
        (localStorage.getItem('library.displayMode') as DisplayMode) || 'grid'
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<number>(0); // 0 = All
    const [sortBy, setSortBy] = useState<SortOption>(() =>
        (localStorage.getItem('library.sortBy') as SortOption) || 'lastRead'
    );
    const [sortAsc, setSortAsc] = useState(false);

    // Selection state
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedNovels, setSelectedNovels] = useState<Set<number>>(new Set());

    // Menu anchors
    const [sortAnchor, setSortAnchor] = useState<null | HTMLElement>(null);

    useEffect(() => {
        fetchLibrary();
        fetchCategories();
    }, []);

    useEffect(() => {
        localStorage.setItem('library.displayMode', displayMode);
    }, [displayMode]);

    useEffect(() => {
        localStorage.setItem('library.sortBy', sortBy);
    }, [sortBy]);

    const fetchLibrary = async () => {
        try {
            const response = await axios.get('/api/library');
            const data = response.data.map((n: any) => ({
                ...n,
                url: n.path,
            }));
            setNovels(data);
        } catch (error) {
            console.error('Failed to fetch library', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await axios.get('/api/categories');
            setCategories([{ id: 0, name: 'All', sort: -1 }, ...response.data]);
        } catch (error) {
            console.error('Failed to fetch categories', error);
        }
    };

    // Filter and sort novels
    const filteredNovels = useMemo(() => {
        let result = [...novels];

        // Filter by category
        if (selectedCategory !== 0) {
            result = result.filter((n: any) => n.categoryIds?.includes(selectedCategory));
        }

        // Filter by search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter((n) => n.name.toLowerCase().includes(query));
        }

        // Sort
        result.sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'lastRead':
                    comparison = ((b as any).lastReadAt || 0) - ((a as any).lastReadAt || 0);
                    break;
                case 'dateAdded':
                    comparison = ((b as any).addedAt || b.id) - ((a as any).addedAt || a.id);
                    break;
                case 'unread':
                    comparison = (b.chaptersUnread || 0) - (a.chaptersUnread || 0);
                    break;
            }
            return sortAsc ? -comparison : comparison;
        });

        return result;
    }, [novels, searchQuery, selectedCategory, sortBy, sortAsc]);

    const toggleSelection = (novelId: number) => {
        const newSelection = new Set(selectedNovels);
        if (newSelection.has(novelId)) {
            newSelection.delete(novelId);
        } else {
            newSelection.add(novelId);
        }
        setSelectedNovels(newSelection);
    };

    const selectAll = () => {
        setSelectedNovels(new Set(filteredNovels.map((n) => n.id)));
    };

    const clearSelection = () => {
        setSelectedNovels(new Set());
        setSelectionMode(false);
    };

    const handleBatchDelete = async () => {
        if (selectedNovels.size === 0) return;
        try {
            await Promise.all(
                Array.from(selectedNovels).map((id) =>
                    axios.delete(`/api/library/${id}`)
                )
            );
            fetchLibrary();
            clearSelection();
        } catch (e) {
            console.error('Failed to delete novels:', e);
        }
    };

    const handleRefresh = async () => {
        setLoading(true);
        // Trigger library update
        try {
            await axios.post('/api/library/update');
        } catch (e) {
            console.error('Failed to trigger update:', e);
        }
        fetchLibrary();
    };

    // Set toolbar content for the AppBar (must be before any conditional returns)
    const { setToolbarContent } = useToolbar();

    useEffect(() => {
        if (loading) return;
        const toolbarElements = (
            <>
                <Chip
                    label={filteredNovels.length}
                    size="small"
                    sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}
                />
                <TextField
                    size="small"
                    placeholder="Search library..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small" />
                            </InputAdornment>
                        ),
                    }}
                    sx={{ width: 200, bgcolor: 'action.hover', borderRadius: 1, '& .MuiOutlinedInput-notchedOutline': { border: 'none' } }}
                />
                <Box sx={{ flexGrow: 1 }} />
                <Tooltip title="Sort">
                    <IconButton color="inherit" onClick={(e) => setSortAnchor(e.currentTarget)}>
                        <SortIcon />
                    </IconButton>
                </Tooltip>
                <ToggleButtonGroup
                    value={displayMode}
                    exclusive
                    onChange={(_, value) => value && setDisplayMode(value)}
                    size="small"
                    sx={{ '& .MuiToggleButton-root': { color: 'inherit', borderColor: 'rgba(255,255,255,0.3)' } }}
                >
                    <ToggleButton value="grid">
                        <GridViewIcon fontSize="small" />
                    </ToggleButton>
                    <ToggleButton value="list">
                        <ViewListIcon fontSize="small" />
                    </ToggleButton>
                </ToggleButtonGroup>
                <Tooltip title={selectionMode ? 'Exit Selection' : 'Select'}>
                    <IconButton
                        color="inherit"
                        onClick={() => {
                            if (selectionMode) {
                                clearSelection();
                            } else {
                                setSelectionMode(true);
                            }
                        }}
                    >
                        <SelectAllIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Update Library">
                    <IconButton color="inherit" onClick={handleRefresh}>
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
            </>
        );
        setToolbarContent(toolbarElements);
        return () => setToolbarContent(null);
    }, [loading, filteredNovels.length, searchQuery, displayMode, selectionMode, sortAnchor]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ mt: 2, pb: 4, px: { xs: 2, md: 4 } }}>
            {/* Sort Menu (needs to be in body for portal) */}
            <Menu
                anchorEl={sortAnchor}
                open={Boolean(sortAnchor)}
                onClose={() => setSortAnchor(null)}
            >
                {(['name', 'lastRead', 'dateAdded', 'unread'] as SortOption[]).map((option) => (
                    <MenuItem
                        key={option}
                        selected={sortBy === option}
                        onClick={() => {
                            if (sortBy === option) {
                                setSortAsc(!sortAsc);
                            } else {
                                setSortBy(option);
                                setSortAsc(false);
                            }
                            setSortAnchor(null);
                        }}
                    >
                        {option === 'name' && 'Title'}
                        {option === 'lastRead' && 'Last Read'}
                        {option === 'dateAdded' && 'Date Added'}
                        {option === 'unread' && 'Unread Count'}
                        {sortBy === option && (sortAsc ? ' ↑' : ' ↓')}
                    </MenuItem>
                ))}
            </Menu>

            {/* Category Tabs */}
            {categories.length > 1 && (
                <Tabs
                    value={selectedCategory}
                    onChange={(_, value) => setSelectedCategory(value)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
                >
                    {categories.map((cat) => (
                        <Tab key={cat.id} label={cat.name} value={cat.id} />
                    ))}
                </Tabs>
            )}

            {/* Selection Actions Bar */}
            <Fade in={selectionMode && selectedNovels.size > 0}>
                <Paper
                    elevation={3}
                    sx={{
                        position: 'fixed',
                        bottom: 16,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        px: 3,
                        py: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        zIndex: 1000,
                        bgcolor: 'background.paper',
                        borderRadius: 2,
                    }}
                >
                    <Typography variant="body2">
                        {selectedNovels.size} selected
                    </Typography>
                    <Button size="small" startIcon={<SelectAllIcon />} onClick={selectAll}>
                        Select All
                    </Button>
                    <Button size="small" startIcon={<DownloadIcon />} disabled>
                        Download
                    </Button>
                    <Button size="small" startIcon={<CategoryIcon />} disabled>
                        Move
                    </Button>
                    <Button
                        size="small"
                        startIcon={<DeleteIcon />}
                        color="error"
                        onClick={handleBatchDelete}
                    >
                        Remove
                    </Button>
                    <Button size="small" onClick={clearSelection}>
                        Cancel
                    </Button>
                </Paper>
            </Fade>

            {/* Empty State */}
            {filteredNovels.length === 0 && (
                <Box sx={{ textAlign: 'center', mt: 8 }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        {searchQuery ? 'No novels match your search.' : 'Your library is empty.'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {!searchQuery && 'Browse sources to add novels to your library.'}
                    </Typography>
                    {!searchQuery && (
                        <Button
                            variant="contained"
                            sx={{ mt: 2 }}
                            onClick={() => navigate('/browse')}
                        >
                            Browse Sources
                        </Button>
                    )}
                </Box>
            )}

            {/* Grid View */}
            {displayMode === 'grid' && (
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                            xs: 'repeat(2, 1fr)',
                            sm: 'repeat(3, 1fr)',
                            md: 'repeat(4, 1fr)',
                            lg: 'repeat(6, 1fr)',
                            xl: 'repeat(8, 1fr)',
                        },
                        gap: 2,
                    }}
                >
                    {filteredNovels.map((novel) => (
                        <Box key={novel.id} sx={{ position: 'relative' }}>
                            {selectionMode && (
                                <Checkbox
                                    checked={selectedNovels.has(novel.id)}
                                    onChange={() => toggleSelection(novel.id)}
                                    sx={{
                                        position: 'absolute',
                                        top: 4,
                                        left: 4,
                                        zIndex: 10,
                                        bgcolor: 'rgba(0,0,0,0.5)',
                                        borderRadius: 1,
                                        '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                                    }}
                                />
                            )}
                            <NovelCard novel={novel} />
                        </Box>
                    ))}
                </Box>
            )}

            {/* List View */}
            {displayMode === 'list' && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {filteredNovels.map((novel) => (
                        <Paper
                            key={novel.id}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                p: 1,
                                cursor: 'pointer',
                                '&:hover': { bgcolor: 'action.hover' },
                            }}
                            onClick={() => {
                                if (selectionMode) {
                                    toggleSelection(novel.id);
                                } else {
                                    navigate(`/novel/${novel.id}`);
                                }
                            }}
                        >
                            {selectionMode && (
                                <Checkbox
                                    checked={selectedNovels.has(novel.id)}
                                    onChange={() => toggleSelection(novel.id)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            )}
                            <Box
                                component="img"
                                src={novel.cover?.startsWith('http')
                                    ? `/api/image-proxy?url=${encodeURIComponent(novel.cover)}`
                                    : novel.cover}
                                sx={{ width: 50, height: 70, objectFit: 'cover', borderRadius: 1, mr: 2 }}
                            />
                            <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="subtitle1" noWrap>
                                    {novel.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {novel.chaptersUnread ? `${novel.chaptersUnread} unread` : 'Up to date'}
                                </Typography>
                            </Box>
                            {novel.chaptersDownloaded && novel.chaptersDownloaded > 0 && (
                                <Chip
                                    icon={<DownloadIcon />}
                                    label={novel.chaptersDownloaded}
                                    size="small"
                                    sx={{ mr: 1 }}
                                />
                            )}
                            {novel.chaptersUnread && novel.chaptersUnread > 0 && (
                                <Chip
                                    label={novel.chaptersUnread}
                                    size="small"
                                    color="primary"
                                />
                            )}
                        </Paper>
                    ))}
                </Box>
            )}
        </Container>
    );
}
