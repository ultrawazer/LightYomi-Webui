/**
 * Filter Drawer Component
 * Main container for filter UI with saved searches, reset, and apply functionality
 */

import { useState, useEffect } from 'react';
import {
    Drawer, Box, Typography, Button, IconButton, Divider,
    Chip, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
    CircularProgress, Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';

import FiltersRenderer from './FiltersRenderer';
import type { Filters, FilterValues } from './types';

interface FilterDrawerProps {
    open: boolean;
    onClose: () => void;
    pluginId: string;
    filters: Filters | null;
    values: FilterValues;
    onChange: (values: FilterValues) => void;
    onApply: () => void;
    onReset: () => void;
}

export default function FilterDrawer({
    open,
    onClose,
    pluginId,
    filters,
    values,
    onChange,
    onApply,
    onReset
}: FilterDrawerProps) {
    const [savedSearches, setSavedSearches] = useState<Record<string, FilterValues>>({});
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const [newSearchName, setNewSearchName] = useState('');
    const [loading, setLoading] = useState(false);

    // Load saved searches on open
    useEffect(() => {
        if (open && pluginId) {
            loadSavedSearches();
        }
    }, [open, pluginId]);

    const loadSavedSearches = async () => {
        try {
            const res = await axios.get(`/api/source/${pluginId}/saved-searches`);
            setSavedSearches(res.data?.searches || {});
        } catch (e) {
            console.error('Failed to load saved searches', e);
        }
    };

    const handleSaveSearch = async () => {
        if (!newSearchName.trim()) return;
        setLoading(true);
        try {
            await axios.post(`/api/source/${pluginId}/saved-searches`, {
                name: newSearchName.trim(),
                filters: values
            });
            await loadSavedSearches();
            setNewSearchName('');
            setSaveDialogOpen(false);
        } catch (e) {
            console.error('Failed to save search', e);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSearch = async (name: string) => {
        try {
            await axios.delete(`/api/source/${pluginId}/saved-searches/${encodeURIComponent(name)}`);
            await loadSavedSearches();
        } catch (e) {
            console.error('Failed to delete saved search', e);
        }
    };

    const handleSelectSearch = (name: string) => {
        const searchFilters = savedSearches[name];
        if (searchFilters) {
            onChange(searchFilters);
        }
    };

    const handleFilterChange = (name: string, value: any) => {
        onChange({ ...values, [name]: { ...values[name], value } });
    };

    const handleApply = () => {
        onApply();
        onClose();
    };

    const handleReset = () => {
        onReset();
    };

    const savedSearchNames = Object.keys(savedSearches);

    return (
        <>
            <Drawer
                anchor="right"
                open={open}
                onClose={onClose}
                PaperProps={{
                    sx: { width: { xs: '100%', sm: 360 }, p: 2 }
                }}
            >
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">Filters</Typography>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>

                {/* Action buttons */}
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<RestartAltIcon />}
                        onClick={handleReset}
                    >
                        Reset
                    </Button>
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<SaveIcon />}
                        onClick={() => setSaveDialogOpen(true)}
                    >
                        Save Search
                    </Button>
                    <Button
                        variant="contained"
                        size="small"
                        onClick={handleApply}
                        sx={{ ml: 'auto' }}
                    >
                        Apply
                    </Button>
                </Box>

                {/* Saved searches */}
                {savedSearchNames.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                            Saved Searches
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {savedSearchNames.map((name) => (
                                <Chip
                                    key={name}
                                    label={name}
                                    size="small"
                                    onClick={() => handleSelectSearch(name)}
                                    onDelete={() => handleDeleteSearch(name)}
                                    deleteIcon={<DeleteIcon fontSize="small" />}
                                />
                            ))}
                        </Box>
                    </Box>
                )}

                <Divider sx={{ mb: 2 }} />

                {/* Filters */}
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                    {!filters ? (
                        <Alert severity="info">
                            This source has no configurable filters.
                        </Alert>
                    ) : (
                        <FiltersRenderer
                            filters={filters}
                            values={values}
                            onChange={handleFilterChange}
                        />
                    )}
                </Box>
            </Drawer>

            {/* Save Search Dialog */}
            <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
                <DialogTitle>Save Search</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        fullWidth
                        label="Search Name"
                        value={newSearchName}
                        onChange={(e) => setNewSearchName(e.target.value)}
                        sx={{ mt: 1 }}
                        placeholder="e.g., Fantasy + Completed"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleSaveSearch}
                        variant="contained"
                        disabled={!newSearchName.trim() || loading}
                    >
                        {loading ? <CircularProgress size={20} /> : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
