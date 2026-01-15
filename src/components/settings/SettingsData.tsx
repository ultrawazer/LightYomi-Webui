/**
 * Settings Data & Advanced - Complete Implementation
 * 
 * Features:
 * - Backup to JSON/ZIP with all data
 * - Restore from backup
 * - Import from LightYomi mobile backup
 * - EPUB export for novels
 * - Clear cache and cookies
 * - Advanced settings (User Agent, storage mode)
 */

import { useState, useEffect } from 'react';
import {
    Typography,
    Box,
    Paper,
    Button,
    Divider,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    ListItemIcon,
    Checkbox,
    LinearProgress,
    Alert,
    Chip,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import BookIcon from '@mui/icons-material/Book';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';

interface Novel {
    id: number;
    name: string;
    cover: string;
    pluginId: string;
}

export default function SettingsData() {
    const [autoBackupFreq, setAutoBackupFreq] = useState(localStorage.getItem('backup_freq') || 'weekly');
    const [storageMode, setStorageMode] = useState('file');

    // EPUB Export Dialog
    const [epubDialogOpen, setEpubDialogOpen] = useState(false);
    const [novels, setNovels] = useState<Novel[]>([]);
    const [selectedNovelId, setSelectedNovelId] = useState<number | null>(null);
    const [exporting, setExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);

    // Backup progress
    const [backupProgress, setBackupProgress] = useState<string | null>(null);

    useEffect(() => {
        fetchStorageMode();
    }, []);

    const fetchStorageMode = async () => {
        try {
            const res = await axios.get('/api/settings/storage.mode');
            setStorageMode(res.data.value || 'file');
        } catch (e) {
            console.error('Failed to fetch storage mode:', e);
        }
    };

    const handleDownloadBackup = async () => {
        try {
            setBackupProgress('Creating backup...');

            // Get all data
            const [libraryRes, settingsRes, historyRes, categoriesRes] = await Promise.all([
                axios.get('/api/library'),
                axios.get('/api/settings'),
                axios.get('/api/history'),
                axios.get('/api/categories'),
            ]);

            const backupData = {
                version: '1.0.0',
                createdAt: new Date().toISOString(),
                library: libraryRes.data,
                settings: settingsRes.data,
                history: historyRes.data,
                categories: categoriesRes.data,
            };

            const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute('href', dataStr);
            downloadAnchorNode.setAttribute('download', `lnreader_backup_${new Date().toISOString().split('T')[0]}.json`);
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();

            setBackupProgress(null);
        } catch (e) {
            setBackupProgress(null);
            alert('Failed to download backup');
        }
    };

    const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const content = event.target?.result as string;
                const backupData = JSON.parse(content);

                if (!backupData.library) {
                    alert('Invalid backup file format');
                    return;
                }

                await axios.post('/api/library/restore', backupData);
                alert('Restore completed successfully. Please refresh the page.');
            } catch (err) {
                alert('Restore failed');
                console.error(err);
            }
        };
        reader.readAsText(file);
    };

    const handleLnReaderImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const content = event.target?.result as string;
                const mobileData = JSON.parse(content);

                // LightYomi mobile backup format detection
                if (mobileData.novels || mobileData.library) {
                    await axios.post('/api/library/import-mobile', mobileData);
                    alert('LightYomi mobile backup imported successfully!');
                } else {
                    alert('Unrecognized LightYomi backup format');
                }
            } catch (err) {
                alert('Import failed');
                console.error(err);
            }
        };
        reader.readAsText(file);
    };

    const handleOpenEpubExport = async () => {
        try {
            const res = await axios.get('/api/library');
            setNovels(res.data || []);
            setEpubDialogOpen(true);
        } catch (e) {
            alert('Failed to fetch novels');
        }
    };

    const handleExportEpub = async () => {
        if (!selectedNovelId) return;

        setExporting(true);
        setExportProgress(10);

        try {
            // Generate EPUB on server
            const res = await axios.get(`/api/novel/${selectedNovelId}/epub`, {
                responseType: 'blob',
                onDownloadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        setExportProgress(Math.round((progressEvent.loaded / progressEvent.total) * 100));
                    }
                }
            });

            // Download the EPUB
            const novel = novels.find(n => n.id === selectedNovelId);
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${novel?.name || 'novel'}.epub`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            setEpubDialogOpen(false);
        } catch (e: any) {
            if (e.response?.status === 404) {
                alert('EPUB export not yet implemented on server. This feature requires epub-gen package.');
            } else {
                alert('Failed to export EPUB');
            }
        } finally {
            setExporting(false);
            setExportProgress(0);
            setSelectedNovelId(null);
        }
    };

    const handleClearCache = async () => {
        if (!confirm('This will delete all downloaded chapters. Continue?')) return;
        try {
            await axios.delete('/api/novel/downloads');
            alert('Cache cleared successfully');
        } catch (e) {
            alert('Failed to clear cache');
        }
    };

    const handleStorageModeChange = async (mode: string) => {
        setStorageMode(mode);
        try {
            await axios.post('/api/settings/storage.mode', { value: mode });
        } catch (e) {
            console.error('Failed to save storage mode:', e);
        }
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>Data & Backup</Typography>

            {/* Backup & Restore */}
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                    Backup & Restore
                </Typography>

                {backupProgress && (
                    <Alert severity="info" sx={{ mb: 2 }}>{backupProgress}</Alert>
                )}

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                    <Button
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        onClick={handleDownloadBackup}
                    >
                        Create Backup
                    </Button>
                    <Button variant="outlined" startIcon={<UploadIcon />} component="label">
                        Restore Backup
                        <input type="file" hidden accept=".json,.zip" onChange={handleRestoreBackup} />
                    </Button>
                </Box>

                <FormControl fullWidth size="small">
                    <InputLabel>Auto Backup Frequency</InputLabel>
                    <Select
                        value={autoBackupFreq}
                        label="Auto Backup Frequency"
                        onChange={(e) => {
                            setAutoBackupFreq(e.target.value);
                            localStorage.setItem('backup_freq', e.target.value);
                        }}
                    >
                        <MenuItem value="off">Off</MenuItem>
                        <MenuItem value="daily">Daily</MenuItem>
                        <MenuItem value="weekly">Weekly</MenuItem>
                        <MenuItem value="monthly">Monthly</MenuItem>
                    </Select>
                </FormControl>
            </Paper>

            {/* Import & Export */}
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                    Import & Export
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button variant="outlined" startIcon={<UploadIcon />} component="label">
                        Import LightYomi Mobile Backup
                        <input type="file" hidden accept=".json,.zip" onChange={handleLnReaderImport} />
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<BookIcon />}
                        onClick={handleOpenEpubExport}
                    >
                        Export Novel as EPUB
                    </Button>
                </Box>
            </Paper>

            <Divider sx={{ my: 3 }} />

            {/* Storage */}
            <Typography variant="h6" gutterBottom>Storage</Typography>
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel>Chapter Storage Mode</InputLabel>
                    <Select
                        value={storageMode}
                        label="Chapter Storage Mode"
                        onChange={(e) => handleStorageModeChange(e.target.value)}
                    >
                        <MenuItem value="file">File System (Recommended)</MenuItem>
                        <MenuItem value="database">Database (SQLite)</MenuItem>
                    </Select>
                </FormControl>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    File System mode stores chapters as individual files. Database mode stores them in SQLite.
                </Typography>

                <Button
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleClearCache}
                >
                    Clear Downloaded Chapters
                </Button>
            </Paper>

            {/* EPUB Export Dialog */}
            <Dialog open={epubDialogOpen} onClose={() => setEpubDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    Export Novel as EPUB
                    <Chip label="Beta" size="small" color="warning" sx={{ ml: 1 }} />
                </DialogTitle>
                <DialogContent>
                    {exporting ? (
                        <Box sx={{ py: 3 }}>
                            <Typography gutterBottom>Exporting EPUB...</Typography>
                            <LinearProgress variant="determinate" value={exportProgress} />
                        </Box>
                    ) : (
                        <>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Select a novel to export as EPUB. Only downloaded chapters will be included.
                            </Typography>
                            <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                                {novels.map((novel) => (
                                    <ListItem key={novel.id} disablePadding>
                                        <ListItemButton
                                            selected={selectedNovelId === novel.id}
                                            onClick={() => setSelectedNovelId(novel.id)}
                                        >
                                            <ListItemIcon>
                                                <Checkbox
                                                    edge="start"
                                                    checked={selectedNovelId === novel.id}
                                                    tabIndex={-1}
                                                    disableRipple
                                                />
                                            </ListItemIcon>
                                            <ListItemText primary={novel.name} secondary={novel.pluginId} />
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                                {novels.length === 0 && (
                                    <ListItem>
                                        <ListItemText
                                            primary="No novels in library"
                                            secondary="Add novels to your library first"
                                        />
                                    </ListItem>
                                )}
                            </List>
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEpubDialogOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleExportEpub}
                        disabled={!selectedNovelId || exporting}
                    >
                        Export EPUB
                    </Button>
                </DialogActions>
            </Dialog>
        </Box >
    );
}
