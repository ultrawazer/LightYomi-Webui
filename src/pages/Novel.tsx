import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container, Typography, Box, CircularProgress, Button, List, ListItem,
    ListItemText, ListItemButton, Paper, Chip, Stack, Dialog, DialogTitle,
    DialogContent, DialogActions
} from '@mui/material';
import { Menu, MenuItem, Checkbox, IconButton } from '@mui/material';
import { useRef } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import CategoryIcon from '@mui/icons-material/Category';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';
import CategoryDialog from '../components/dialogs/CategoryDialog';

interface Chapter {
    id: number;
    name: string;
    path: string;
    releaseTime?: string;
    chapterNumber?: number;
    isDownloaded: boolean;
    unread: boolean;
}

interface NovelDetails {
    id: number;
    name: string;
    cover: string;
    author: string;
    status: string;
    summary: string;
    genres: string;
    inLibrary: boolean;
    path: string;
    pluginId: string;
    chapters?: Chapter[];
}

export default function Novel() {
    const { id, pluginId, novelUrl } = useParams();
    const navigate = useNavigate();

    const isLibraryNovel = !!id;

    const [novel, setNovel] = useState<NovelDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [chapters, setChapters] = useState<Chapter[]>([]);

    const [trackerOpen, setTrackerOpen] = useState(false);
    const [categoryOpen, setCategoryOpen] = useState(false);

    // Selection Mode State
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedChapters, setSelectedChapters] = useState<Set<string>>(new Set());

    // Context Menu State
    const [contextMenu, setContextMenu] = useState<{
        mouseX: number;
        mouseY: number;
        chapter: Chapter;
    } | null>(null);

    // Long Press Refs
    const longPressTimer = useRef<any>(null);
    const isLongPress = useRef(false);

    useEffect(() => {
        fetchNovel();
    }, [id, pluginId, novelUrl]);

    // ... (rest of methods)

    const fetchNovel = async () => {
        try {
            setLoading(true);
            let res;
            if (isLibraryNovel) {
                res = await axios.get(`/api/novel/${id}`);
            } else {
                res = await axios.get(`/api/novel?path=${encodeURIComponent(novelUrl!)}&pluginId=${pluginId}`);
            }
            setNovel(res.data);

            if (res.data.chapters) {
                setChapters(res.data.chapters);
            } else {
                const url = isLibraryNovel
                    ? `/api/novel/chapters?novelId=${id}`
                    : `/api/novel/chapters?path=${encodeURIComponent(novelUrl!)}&pluginId=${pluginId}`;
                const chapRes = await axios.get(url);
                setChapters(chapRes.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const toggleLibrary = async () => {
        if (!novel) return;
        try {
            await axios.post('/api/library/manage', {
                novelPath: novel.path,
                pluginId: novel.pluginId
            });

            const res = await axios.get(`/api/novel?path=${encodeURIComponent(novel.path)}&pluginId=${novel.pluginId}`);

            if (res.data.id && !isLibraryNovel) {
                navigate(`/novel/${res.data.id}`, { replace: true });
            } else {
                fetchNovel();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const openChapter = (chapter: Chapter) => {
        if (isLongPress.current) {
            isLongPress.current = false;
            return;
        }
        if (selectionMode) {
            toggleSelection(chapter);
        } else {
            let url = `/reader?pluginId=${novel!.pluginId}&novelPath=${encodeURIComponent(novel!.path)}&chapterPath=${encodeURIComponent(chapter.path)}`;
            navigate(url);
        }
    };

    const handleDownload = async () => {
        if (!novel || !chapters.length) return;

        // Determine chapters to download
        let toDownload: Chapter[] = [];
        if (selectionMode && selectedChapters.size > 0) {
            toDownload = chapters.filter(c => selectedChapters.has(c.path) && !c.isDownloaded);
        } else {
            // Default behavior (download all not downloaded)
            toDownload = chapters.filter(c => !c.isDownloaded);
        }

        if (!toDownload.length) {
            alert('No new chapters to download');
            return;
        }

        try {
            await axios.post('/api/queue/download', {
                novelId: novel.id,
                chapters: toDownload
            });
            alert(`Queued ${toDownload.length} chapters`);
            setSelectionMode(false);
            setSelectedChapters(new Set());
        } catch (e) {
            console.error(e);
            alert('Failed to queue downloads');
        }
    };

    const handleDelete = async () => {
        if (!novel || !chapters.length) return;

        let toDelete: Chapter[] = [];
        if (selectionMode && selectedChapters.size > 0) {
            toDelete = chapters.filter(c => selectedChapters.has(c.path) && c.isDownloaded);
        } else if (contextMenu) {
            if (contextMenu.chapter.isDownloaded) {
                toDelete = [contextMenu.chapter];
            }
        }

        if (!toDelete.length) {
            // alert('No downloaded chapters selected to delete'); // Optional
            if (contextMenu) setContextMenu(null);
            return;
        }

        if (!confirm(`Are you sure you want to delete ${toDelete.length} chapters?`)) {
            if (contextMenu) setContextMenu(null);
            return;
        }

        try {
            await axios.post('/api/novel/chapter/delete', {
                novelId: novel.id,
                pluginId: novel.pluginId,
                chapters: toDelete
            });
            alert(`Deleted ${toDelete.length} chapters`);
            setSelectionMode(false);
            setSelectedChapters(new Set());
            setContextMenu(null);
            fetchNovel();
        } catch (e) {
            console.error(e);
            alert('Failed to delete chapters');
        }
    };

    // --- Interaction Handlers ---

    const handleChapterMouseDown = (e: React.MouseEvent, chapter: Chapter) => {
        if (e.button === 0) { // Left click
            isLongPress.current = false;
            longPressTimer.current = setTimeout(() => {
                isLongPress.current = true;
                setContextMenu({
                    mouseX: e.clientX - 2,
                    mouseY: e.clientY - 4,
                    chapter: chapter,
                });
            }, 1000); // 1 second hold
        }
    };

    const handleChapterMouseUp = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    const handleChapterContextMenu = (e: React.MouseEvent) => {
        e.preventDefault(); // Always prevent default context menu on chapters
    };

    const toggleSelection = (chapter: Chapter) => {
        const newSet = new Set(selectedChapters);
        if (newSet.has(chapter.path)) {
            newSet.delete(chapter.path);
        } else {
            newSet.add(chapter.path);
        }
        setSelectedChapters(newSet);
    };

    const handleSelectAll = () => {
        if (selectedChapters.size === chapters.length) {
            setSelectedChapters(new Set());
        } else {
            const all = new Set(chapters.map(c => c.path));
            setSelectedChapters(all);
        }
    };

    const isAllSelected = chapters.length > 0 && selectedChapters.size === chapters.length;

    // --- Render ---

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!novel) return <Typography>Novel not found</Typography>;

    return (
        <Box sx={{ mb: 4 }}>
            {/* Blurred Background Header */}
            <Box sx={{
                position: 'relative',
                mx: -3, mt: -3, mb: 3,
                height: 300,
                overflow: 'hidden',
                zIndex: 0,
            }}>
                <Box
                    component="img"
                    src={(() => {
                        const cover = novel.cover;
                        if (!cover) return '';
                        if (cover.startsWith('http')) return `/api/image-proxy?url=${encodeURIComponent(cover)}`;
                        if (cover.startsWith('file://')) {
                            return cover.replace(/.*[\/\\]data[\/\\]files[\/\\]/, '/api/files/').replace(/\\/g, '/');
                        }
                        return cover;
                    })()}
                    sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        filter: 'blur(10px) brightness(0.5)',
                        transform: 'scale(1.1)',
                    }}
                />
                <Box sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    background: 'linear-gradient(to top, rgba(36,36,36,1) 0%, rgba(36,36,36,0) 100%)',
                    height: '50%',
                }} />
            </Box>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} sx={{ position: 'relative', zIndex: 1, mt: -15, px: 2 }}>
                <Box sx={{ width: { xs: '100%', sm: 300 }, flexShrink: 0, mx: 'auto' }}>
                    <Paper elevation={6} sx={{ borderRadius: 2, overflow: 'hidden', aspectRatio: '2/3' }}>
                        <Box
                            component="img"
                            src={(() => {
                                const cover = novel.cover;
                                if (!cover) return '';
                                if (cover.startsWith('http')) return `/api/image-proxy?url=${encodeURIComponent(cover)}`;
                                if (cover.startsWith('file://')) {
                                    return cover.replace(/.*[\/\\]data[\/\\]files[\/\\]/, '/api/files/').replace(/\\/g, '/');
                                }
                                return cover;
                            })()}
                            alt={novel.name}
                            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    </Paper>
                </Box>
                <Box sx={{ flex: 1, mt: { xs: 2, sm: 8 } }}>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                        {novel.name}
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ mt: 1 }}>
                        {novel.author}
                    </Typography>

                    <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
                        <Chip
                            label={novel.status}
                            color={novel.status === 'Ongoing' ? 'success' : 'default'}
                            variant="filled"
                        />
                        {novel.genres?.split(',').map(g => (
                            <Chip key={g} label={g.trim()} size="small" variant="outlined" />
                        ))}
                    </Stack>

                    <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
                        <Button
                            variant={novel.inLibrary ? "outlined" : "contained"}
                            size="large"
                            startIcon={novel.inLibrary ? <EditIcon /> : <BookmarkAddIcon />}
                            onClick={toggleLibrary}
                            sx={{ borderRadius: 8, px: 4 }}
                        >
                            {novel.inLibrary ? 'In Library' : 'Add to Library'}
                        </Button>
                        {novel.inLibrary && (
                            <>
                                <Button startIcon={<CategoryIcon />} onClick={() => setCategoryOpen(true)}>
                                    Category
                                </Button>
                                <Button startIcon={<TrackChangesIcon />} onClick={() => setTrackerOpen(true)}>
                                    Track
                                </Button>
                                <Button startIcon={<DownloadIcon />} onClick={handleDownload}>
                                    Download All
                                </Button>
                            </>
                        )}
                    </Stack>
                </Box>
            </Stack>

            <Container maxWidth="xl" sx={{ mt: 4, px: { xs: 2, md: 4 } }}>
                <Typography variant="h5" gutterBottom>Synopsis</Typography>
                <Paper sx={{ p: 3, bgcolor: 'action.hover', borderRadius: 2 }}>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                        {novel.summary}
                    </Typography>
                </Paper>
            </Container>

            <Container maxWidth="xl" sx={{ mt: 4, px: { xs: 2, md: 4 } }}>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">Chapters ({chapters.length})</Typography>
                    {/* Selection Mode Toolbar */}
                    {selectionMode && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Button onClick={handleSelectAll}>
                                {isAllSelected ? 'Deselect All' : 'Select All'}
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<DownloadIcon />}
                                disabled={selectedChapters.size === 0}
                                onClick={handleDownload}
                            >
                                Download ({selectedChapters.size})
                            </Button>
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<DeleteIcon />}
                                disabled={selectedChapters.size === 0}
                                onClick={handleDelete}
                            >
                                Delete
                            </Button>
                            <IconButton onClick={() => { setSelectionMode(false); setSelectedChapters(new Set()); }}>
                                <CloseIcon />
                            </IconButton>
                        </Box>
                    )}
                </Box>

                <Paper sx={{ mt: 1 }}>
                    <List>
                        {chapters.map((chapter) => (
                            <ListItem
                                key={chapter.path}
                                divider
                                disablePadding
                                onMouseDown={(e) => handleChapterMouseDown(e, chapter)}
                                onMouseUp={handleChapterMouseUp}
                                onMouseLeave={handleChapterMouseUp}
                                onContextMenu={handleChapterContextMenu}
                            >
                                <ListItemButton
                                    onClick={() => openChapter(chapter)}
                                    selected={selectedChapters.has(chapter.path)}
                                >
                                    {/* Selection Circle */}
                                    {selectionMode && (
                                        <Checkbox
                                            edge="start"
                                            checked={selectedChapters.has(chapter.path)}
                                            tabIndex={-1}
                                            disableRipple
                                            onClick={(e) => { e.stopPropagation(); toggleSelection(chapter); }}
                                        />
                                    )}
                                    {/* Downloaded Indicator */}
                                    {chapter.isDownloaded && (
                                        <CheckCircleIcon color="success" fontSize="small" sx={{ mr: 1 }} />
                                    )}

                                    <ListItemText
                                        primary={chapter.name}
                                        secondary={chapter.releaseTime}
                                        sx={{ color: chapter.unread ? 'text.primary' : 'text.disabled' }}
                                    />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                </Paper>
            </Container>

            <Dialog open={trackerOpen} onClose={() => setTrackerOpen(false)}>
                <DialogTitle>Trackers</DialogTitle>
                <DialogContent>
                    <Typography>MyAnimeList / Anilist integration coming soon.</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setTrackerOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {novel.inLibrary && (
                <CategoryDialog
                    open={categoryOpen}
                    onClose={() => setCategoryOpen(false)}
                    novelId={novel.id}
                />
            )}

            {/* Context Menu */}
            <Menu
                open={contextMenu !== null}
                onClose={() => setContextMenu(null)}
                anchorReference="anchorPosition"
                anchorPosition={
                    contextMenu !== null
                        ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                        : undefined
                }
            >
                <MenuItem onClick={() => {
                    if (contextMenu) {
                        // Download single
                        axios.post('/api/queue/download', {
                            novelId: novel.id,
                            chapters: [contextMenu.chapter]
                        }).then(() => alert('Queued download')).catch(console.error);
                        setContextMenu(null);
                    }
                }}>Download</MenuItem>
                {contextMenu?.chapter.isDownloaded && (
                    <MenuItem onClick={handleDelete}>Delete</MenuItem>
                )}
                <MenuItem onClick={() => {
                    setSelectionMode(true);
                    if (contextMenu) {
                        toggleSelection(contextMenu.chapter);
                    }
                    setContextMenu(null);
                }}>Select to Download</MenuItem>
            </Menu>

        </Box>
    );
}
