/**
 * Reader Page - Complete Rewrite
 * 
 * Features:
 * - Full settings panel integration
 * - Chapter prefetching (next 2 chapters)
 * - Keyboard navigation (←/→/Esc/Space)
 * - Reading position persistence (scroll %)
 * - Suwayomi-style UI
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
    AppBar,
    Toolbar,
    IconButton,
    Typography,
    Box,
    CircularProgress,
    Button,
    Fade,
    Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SettingsIcon from '@mui/icons-material/Settings';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import axios from 'axios';
import ReaderSettingsPanel, { defaultSettings } from '../components/reader/ReaderSettingsPanel';
import type { ReaderSettings } from '../components/reader/ReaderSettingsPanel';

interface Chapter {
    id: number;
    name: string;
    path: string;
    content?: string;
    novelId?: number;
    chapterNumber?: number;
}

interface ChapterNavInfo {
    prevChapter?: Chapter;
    nextChapter?: Chapter;
}

// Storage key for reading position
const getPositionKey = (chapterId: number | string) => `reading_position_${chapterId}`;

export default function Reader() {
    const { novelId, chapterId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const qChapterPath = searchParams.get('chapterPath');
    const qNovelPath = searchParams.get('novelPath');
    const qPluginId = searchParams.get('pluginId');

    // State
    const [chapter, setChapter] = useState<Chapter | null>(null);
    const [navInfo, setNavInfo] = useState<ChapterNavInfo>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showOverlay, setShowOverlay] = useState(true);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [settings, setSettings] = useState<ReaderSettings>(defaultSettings);

    // Refs
    const contentRef = useRef<HTMLDivElement>(null);
    const prefetchedChapters = useRef<Map<string, Chapter>>(new Map());
    const lastScrollSave = useRef<number>(0);

    // Load settings on mount
    useEffect(() => {
        loadSettings();
    }, []);

    // Fetch chapter when ID changes
    useEffect(() => {
        fetchChapter();
        window.scrollTo(0, 0);
    }, [novelId, chapterId, qChapterPath, qPluginId]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            switch (e.key) {
                case 'ArrowLeft':
                    if (navInfo.prevChapter) {
                        navigateToChapter(navInfo.prevChapter);
                    }
                    break;
                case 'ArrowRight':
                    if (navInfo.nextChapter) {
                        navigateToChapter(navInfo.nextChapter);
                    }
                    break;
                case 'Escape':
                    handleBack();
                    break;
                case ' ':
                    e.preventDefault();
                    setShowOverlay((prev) => !prev);
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [navInfo]);

    // Save scroll position on scroll
    useEffect(() => {
        const handleScroll = () => {
            const now = Date.now();
            if (now - lastScrollSave.current < 1000) return; // Throttle to 1s
            lastScrollSave.current = now;

            const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
            const key = getPositionKey(chapterId || qChapterPath || '');
            if (key && !isNaN(scrollPercent)) {
                localStorage.setItem(key, String(Math.round(scrollPercent * 100)));
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [chapterId, qChapterPath]);

    // Restore scroll position after content loads
    useEffect(() => {
        if (chapter?.content && !loading) {
            const key = getPositionKey(chapter.id || qChapterPath || '');
            const savedPosition = localStorage.getItem(key);
            if (savedPosition) {
                const percent = parseInt(savedPosition, 10) / 100;
                setTimeout(() => {
                    const scrollY = percent * (document.body.scrollHeight - window.innerHeight);
                    window.scrollTo({ top: scrollY, behavior: 'smooth' });
                }, 100);
            }
        }
    }, [chapter?.content, loading]);

    const loadSettings = async () => {
        try {
            const res = await axios.get('/api/settings/reader');
            const data = res.data;
            setSettings({
                fontFamily: data['reader.fontFamily'] || defaultSettings.fontFamily,
                fontSize: parseInt(data['reader.fontSize']) || defaultSettings.fontSize,
                lineHeight: parseFloat(data['reader.lineHeight']) || defaultSettings.lineHeight,
                maxWidth: parseInt(data['reader.maxWidth']) || defaultSettings.maxWidth,
                textAlign: (data['reader.textAlign'] as any) || defaultSettings.textAlign,
                backgroundColor: data['reader.backgroundColor'] || defaultSettings.backgroundColor,
                textColor: data['reader.textColor'] || defaultSettings.textColor,
                padding: parseInt(data['reader.padding']) || defaultSettings.padding,
                customCSS: data['reader.customCSS'] || '',
            });
        } catch (e) {
            console.error('Failed to load reader settings:', e);
        }
    };

    const fetchChapter = async () => {
        setLoading(true);
        setError(null);

        try {
            let url = '';
            let cacheKey = '';

            if (chapterId) {
                url = `/api/novel/chapter?chapterId=${chapterId}`;
                cacheKey = `id:${chapterId}`;
            } else if (qChapterPath && qPluginId) {
                url = `/api/novel/chapter?path=${encodeURIComponent(qChapterPath)}&pluginId=${qPluginId}`;
                cacheKey = `path:${qPluginId}:${qChapterPath}`;
            }

            if (!url) {
                setError('Missing chapter information');
                setLoading(false);
                return;
            }

            // Check cache first
            const cached = prefetchedChapters.current.get(cacheKey);
            if (cached) {
                setChapter(cached);
                setLoading(false);
                prefetchedChapters.current.delete(cacheKey);

                // Update history
                if (cached.id) {
                    axios.post(`/api/history/${cached.id}`).catch(() => { });
                }

                // Prefetch next chapters
                prefetchNextChapters(cached);
                return;
            }

            const res = await axios.get(url);
            const chapterData = res.data;
            setChapter(chapterData);

            // Update history
            if (chapterData?.id) {
                axios.post(`/api/history/${chapterData.id}`).catch(() => { });
            }

            // Prefetch next chapters
            prefetchNextChapters(chapterData);

        } catch (e: any) {
            console.error(e);
            setError(e.response?.data?.message || e.message || 'Failed to load chapter');
        } finally {
            setLoading(false);
        }
    };

    const prefetchNextChapters = async (currentChapter: Chapter) => {
        if (!currentChapter?.novelId) return;

        try {
            // Get chapter list for navigation
            const chaptersRes = await axios.get(`/api/novel/chapters?novelId=${currentChapter.novelId}`);
            const chapters: Chapter[] = chaptersRes.data;

            const currentIndex = chapters.findIndex((c) => c.id === currentChapter.id);
            if (currentIndex === -1) return;

            // Find prev/next chapters
            const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : undefined;
            const nextChapter = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : undefined;

            setNavInfo({ prevChapter, nextChapter });

            // Prefetch next 2 chapters
            const toPrefetch = [nextChapter, chapters[currentIndex + 2]].filter(Boolean) as Chapter[];

            for (const ch of toPrefetch) {
                const key = `id:${ch.id}`;
                if (!prefetchedChapters.current.has(key)) {
                    try {
                        const res = await axios.get(`/api/novel/chapter?chapterId=${ch.id}`);
                        prefetchedChapters.current.set(key, res.data);
                    } catch (e) {
                        // Silently fail prefetch
                    }
                }
            }
        } catch (e) {
            console.error('Failed to get navigation info:', e);
        }
    };

    const navigateToChapter = (targetChapter: Chapter) => {
        if (novelId && targetChapter.id) {
            navigate(`/novel/${novelId}/chapter/${targetChapter.id}`);
        } else if (qPluginId && targetChapter.path) {
            navigate(`/reader?pluginId=${qPluginId}&novelPath=${encodeURIComponent(qNovelPath || '')}&chapterPath=${encodeURIComponent(targetChapter.path)}`);
        }
    };

    const toggleOverlay = useCallback(() => {
        setShowOverlay((prev) => !prev);
    }, []);

    const handleBack = () => {
        if (novelId) {
            navigate(`/novel/${novelId}`);
        } else if (qNovelPath && qPluginId) {
            navigate(`/novel/source/${qPluginId}/${encodeURIComponent(qNovelPath)}`);
        } else {
            navigate(-1);
        }
    };

    // Custom CSS styles
    const readerStyles = `
    .reader-content {
      font-family: ${settings.fontFamily};
      font-size: ${settings.fontSize}px;
      line-height: ${settings.lineHeight};
      color: ${settings.textColor};
      text-align: ${settings.textAlign};
      max-width: ${settings.maxWidth}px;
      margin: 0 auto;
      padding: ${settings.padding}px;
    }
    .reader-content p {
      margin-bottom: 1em;
    }
    .reader-content img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 1em auto;
    }
    ${settings.customCSS}
  `;

    return (
        <Box
            sx={{
                minHeight: '100vh',
                bgcolor: settings.backgroundColor,
                color: settings.textColor,
                position: 'relative',
            }}
        >
            <style>{readerStyles}</style>

            {/* Top AppBar */}
            <Fade in={showOverlay}>
                <AppBar
                    position="fixed"
                    sx={{
                        bgcolor: 'rgba(0,0,0,0.8)',
                        backdropFilter: 'blur(10px)',
                    }}
                >
                    <Toolbar>
                        <IconButton edge="start" color="inherit" onClick={handleBack}>
                            <ArrowBackIcon />
                        </IconButton>
                        <Typography
                            variant="h6"
                            sx={{
                                flexGrow: 1,
                                ml: 2,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}
                        >
                            {chapter?.name || 'Loading...'}
                        </Typography>
                        <Tooltip title="Reader Settings">
                            <IconButton color="inherit" onClick={() => setSettingsOpen(true)}>
                                <SettingsIcon />
                            </IconButton>
                        </Tooltip>
                    </Toolbar>
                </AppBar>
            </Fade>

            {/* Main Content */}
            <Box
                onClick={toggleOverlay}
                sx={{
                    pt: showOverlay ? 10 : 4,
                    pb: showOverlay ? 12 : 4,
                    minHeight: '100vh',
                    transition: 'padding 0.3s',
                }}
            >
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Box sx={{ mt: 10, textAlign: 'center' }}>
                        <Typography color="error" gutterBottom>
                            {error}
                        </Typography>
                        <Button variant="contained" onClick={fetchChapter}>
                            Retry
                        </Button>
                    </Box>
                ) : (
                    <div
                        ref={contentRef}
                        className="reader-content"
                        dangerouslySetInnerHTML={{ __html: chapter?.content || 'No content found.' }}
                    />
                )}
            </Box>

            {/* Bottom Navigation Bar */}
            <Fade in={showOverlay}>
                <Box
                    sx={{
                        position: 'fixed',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        p: 1.5,
                        bgcolor: 'rgba(0,0,0,0.8)',
                        backdropFilter: 'blur(10px)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <Button
                        startIcon={<ChevronLeftIcon />}
                        disabled={!navInfo.prevChapter}
                        onClick={() => navInfo.prevChapter && navigateToChapter(navInfo.prevChapter)}
                        sx={{ color: 'white' }}
                    >
                        Previous
                    </Button>
                    <Typography variant="caption" sx={{ opacity: 0.7, textAlign: 'center', flex: 1 }}>
                        {chapter?.name}
                    </Typography>
                    <Button
                        endIcon={<ChevronRightIcon />}
                        disabled={!navInfo.nextChapter}
                        onClick={() => navInfo.nextChapter && navigateToChapter(navInfo.nextChapter)}
                        sx={{ color: 'white' }}
                    >
                        Next
                    </Button>
                </Box>
            </Fade>

            {/* Settings Panel */}
            <ReaderSettingsPanel
                open={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                settings={settings}
                onSettingsChange={setSettings}
            />
        </Box>
    );
}
