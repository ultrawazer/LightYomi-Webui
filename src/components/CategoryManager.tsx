/**
 * Category Management Component
 * 
 * Features:
 * - View all categories
 * - Create new category
 * - Edit category name
 * - Delete category
 * - Drag and drop reordering
 */

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    TextField,
    Button,
    Box,
    Typography,
    Divider,
    Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';

interface Category {
    id: number;
    name: string;
    sort: number;
}

interface Props {
    open: boolean;
    onClose: () => void;
    onCategoriesChange?: () => void;
}

export default function CategoryManager({ open, onClose, onCategoriesChange }: Props) {
    const [categories, setCategories] = useState<Category[]>([]);

    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingName, setEditingName] = useState('');
    const [draggedId, setDraggedId] = useState<number | null>(null);

    useEffect(() => {
        if (open) {
            fetchCategories();
        }
    }, [open]);

    const fetchCategories = async () => {
        try {
            const res = await axios.get('/api/categories');
            // Filter out the default category (id=1) which shouldn't be editable
            setCategories(res.data.filter((c: Category) => c.id !== 1));
        } catch (e) {
            console.error('Failed to fetch categories:', e);
        }
    };

    const handleCreate = async () => {
        if (!newCategoryName.trim()) return;
        try {
            await axios.post('/api/categories', { name: newCategoryName.trim() });
            setNewCategoryName('');
            fetchCategories();
            onCategoriesChange?.();
        } catch (e) {
            console.error('Failed to create category:', e);
        }
    };

    const handleUpdate = async (id: number) => {
        if (!editingName.trim()) return;
        try {
            await axios.put(`/api/categories/${id}`, { name: editingName.trim() });
            setEditingId(null);
            setEditingName('');
            fetchCategories();
            onCategoriesChange?.();
        } catch (e) {
            console.error('Failed to update category:', e);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this category? Novels will be moved to Default.')) return;
        try {
            await axios.delete(`/api/categories/${id}`);
            fetchCategories();
            onCategoriesChange?.();
        } catch (e) {
            console.error('Failed to delete category:', e);
        }
    };

    const startEditing = (cat: Category) => {
        setEditingId(cat.id);
        setEditingName(cat.name);
    };

    const handleDragStart = (id: number) => {
        setDraggedId(id);
    };

    const handleDragOver = (e: React.DragEvent, targetId: number) => {
        e.preventDefault();
        if (draggedId === null || draggedId === targetId) return;

        const draggedIndex = categories.findIndex((c) => c.id === draggedId);
        const targetIndex = categories.findIndex((c) => c.id === targetId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        const newCategories = [...categories];
        const [draggedItem] = newCategories.splice(draggedIndex, 1);
        newCategories.splice(targetIndex, 0, draggedItem);
        setCategories(newCategories);
    };

    const handleDragEnd = async () => {
        setDraggedId(null);
        // Save new order to server
        try {
            const updates = categories.map((cat, index) => ({
                id: cat.id,
                sort: index,
            }));
            await axios.post('/api/categories/reorder', { categories: updates });
            onCategoriesChange?.();
        } catch (e) {
            console.error('Failed to save order:', e);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Manage Categories</DialogTitle>
            <DialogContent>
                {/* Add New Category */}
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="New category name..."
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    />
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleCreate}
                        disabled={!newCategoryName.trim()}
                    >
                        Add
                    </Button>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Category List */}
                {categories.length === 0 ? (
                    <Typography color="text.secondary" textAlign="center" py={4}>
                        No custom categories yet.
                    </Typography>
                ) : (
                    <List>
                        {categories.map((cat) => (
                            <ListItem
                                key={cat.id}
                                draggable
                                onDragStart={() => handleDragStart(cat.id)}
                                onDragOver={(e) => handleDragOver(e, cat.id)}
                                onDragEnd={handleDragEnd}
                                sx={{
                                    bgcolor: draggedId === cat.id ? 'action.selected' : 'transparent',
                                    borderRadius: 1,
                                    mb: 0.5,
                                    cursor: 'grab',
                                    '&:active': { cursor: 'grabbing' },
                                }}
                            >
                                <Tooltip title="Drag to reorder">
                                    <DragIndicatorIcon sx={{ color: 'text.secondary', mr: 1 }} />
                                </Tooltip>

                                {editingId === cat.id ? (
                                    <TextField
                                        size="small"
                                        value={editingName}
                                        onChange={(e) => setEditingName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleUpdate(cat.id);
                                            if (e.key === 'Escape') {
                                                setEditingId(null);
                                                setEditingName('');
                                            }
                                        }}
                                        autoFocus
                                        sx={{ flexGrow: 1 }}
                                    />
                                ) : (
                                    <ListItemText primary={cat.name} />
                                )}

                                <ListItemSecondaryAction>
                                    {editingId === cat.id ? (
                                        <>
                                            <Button size="small" onClick={() => handleUpdate(cat.id)}>
                                                Save
                                            </Button>
                                            <Button size="small" onClick={() => setEditingId(null)}>
                                                Cancel
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Tooltip title="Edit">
                                                <IconButton size="small" onClick={() => startEditing(cat)}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton size="small" onClick={() => handleDelete(cat.id)} color="error">
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </>
                                    )}
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
}
