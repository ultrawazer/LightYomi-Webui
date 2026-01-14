import { useState, useEffect } from 'react';
import {
    Typography, Box, Paper, List, ListItem, ListItemText, ListItemSecondaryAction,
    IconButton, TextField, Button, CircularProgress, Switch, FormControlLabel, Divider
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';

interface Category {
    id: number;
    name: string;
    sort: number;
}

export default function SettingsLibrary() {
    // --- Categories State ---
    const [categories, setCategories] = useState<Category[]>([]);
    const [loadingCats, setLoadingCats] = useState(true);
    const [newCatName, setNewCatName] = useState('');

    // --- Library Settings State (Local Storage) ---
    const [updateOnLaunch, setUpdateOnLaunch] = useState(localStorage.getItem('lib_updateOnLaunch') === 'true');
    const [autoDownload, setAutoDownload] = useState(localStorage.getItem('lib_autoDownload') === 'true');
    const [onlyOngoing, setOnlyOngoing] = useState(localStorage.getItem('lib_onlyOngoing') === 'true');
    const [refreshMetadata, setRefreshMetadata] = useState(localStorage.getItem('lib_refreshMetadata') === 'true');

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoadingCats(true);
        try {
            const res = await axios.get('/api/categories');
            setCategories(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingCats(false);
        }
    };

    const handleAddCategory = async () => {
        if (!newCatName) return;
        try {
            await axios.post('/api/categories', { name: newCatName });
            setNewCatName('');
            fetchCategories();
        } catch (e: any) {
            alert(e.response?.data?.error || 'Failed to add category');
        }
    };

    const handleDeleteCategory = async (id: number) => {
        if (!confirm('Delete this category? Novels will be moved to Default.')) return;
        try {
            await axios.delete(`/api/categories/${id}`);
            fetchCategories();
        } catch (e) {
            alert('Failed to delete category');
        }
    };

    // --- Persist Settings ---
    const toggleSetting = (key: string, setter: (val: boolean) => void, val: boolean) => {
        setter(val);
        localStorage.setItem(key, String(val));
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>Library Settings</Typography>

            {/* General Library Options */}
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Typography variant="subtitle2" color="primary" gutterBottom>General</Typography>
                <FormControlLabel
                    control={<Switch checked={updateOnLaunch} onChange={(e) => toggleSetting('lib_updateOnLaunch', setUpdateOnLaunch, e.target.checked)} />}
                    label="Update library on launch"
                />
                <FormControlLabel
                    control={<Switch checked={onlyOngoing} onChange={(e) => toggleSetting('lib_onlyOngoing', setOnlyOngoing, e.target.checked)} />}
                    label="Only update ongoing novels"
                />
                <FormControlLabel
                    control={<Switch checked={autoDownload} onChange={(e) => toggleSetting('lib_autoDownload', setAutoDownload, e.target.checked)} />}
                    label="Download new chapters automatically"
                />
                <FormControlLabel
                    control={<Switch checked={refreshMetadata} onChange={(e) => toggleSetting('lib_refreshMetadata', setRefreshMetadata, e.target.checked)} />}
                    label="Refresh novel metadata"
                />
            </Paper>

            <Divider sx={{ my: 3 }} />

            {/* Categories Management */}
            <Typography variant="h6" gutterBottom>Categories</Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
                Manage categories to organize your library.
            </Typography>

            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                        fullWidth
                        size="small"
                        label="New Category Name"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                    />
                    <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddCategory}>
                        Add
                    </Button>
                </Box>
            </Paper>

            <Paper variant="outlined">
                {loadingCats ? (
                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                        <CircularProgress size={24} />
                    </Box>
                ) : (
                    <List dense>
                        {categories.map((cat) => (
                            <ListItem key={cat.id} divider>
                                <ListItemText primary={cat.name} secondary={cat.id <= 2 ? 'System Category' : null} />
                                {cat.id > 2 && (
                                    <ListItemSecondaryAction>
                                        <IconButton edge="end" onClick={() => handleDeleteCategory(cat.id)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                )}
                            </ListItem>
                        ))}
                    </List>
                )}
            </Paper>
        </Box>
    );
}
