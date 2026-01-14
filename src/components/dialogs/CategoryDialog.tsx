import { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, List, ListItem, ListItemText, Checkbox,
    TextField, Box, ListItemButton
} from '@mui/material';
import axios from 'axios';

interface Category {
    id: number;
    name: string;
    sort: number;
    novelIds?: string; // string list "1,2,3"
}

interface CategoryDialogProps {
    open: boolean;
    onClose: () => void;
    novelId: number;
}

export default function CategoryDialog({ open, onClose, novelId }: CategoryDialogProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
    const [newCategoryName, setNewCategoryName] = useState('');

    useEffect(() => {
        if (open && novelId) {
            fetchCategories();
            fetchNovelCategories();
        }
    }, [open, novelId]);

    const fetchCategories = async () => {
        try {
            const res = await axios.get('/api/categories');
            setCategories(res.data);
        } catch (e) {
            console.error('Failed to fetch categories', e);
        }
    };

    const fetchNovelCategories = async () => {
        try {
            const res = await axios.get(`/api/categories/novel/${novelId}`);
            const ids = res.data.map((c: Category) => c.id);
            setSelectedCategories(ids);
        } catch (e) {
            console.error('Failed to fetch novel categories', e);
        }
    };

    const handleToggle = async (categoryId: number) => {
        const isSelected = selectedCategories.includes(categoryId);
        try {
            if (isSelected) {
                // Delete
                await axios.delete(`/api/categories/${categoryId}/novels/${novelId}`);
                setSelectedCategories(prev => prev.filter(id => id !== categoryId));
            } else {
                // Add
                await axios.post(`/api/categories/${categoryId}/novels`, { novelId });
                setSelectedCategories(prev => [...prev, categoryId]);
            }
        } catch (e) {
            console.error('Failed to toggle category', e);
        }
    };

    const handleCreate = async () => {
        if (!newCategoryName.trim()) return;
        try {
            await axios.post('/api/categories', { name: newCategoryName });
            setNewCategoryName('');
            fetchCategories();
        } catch (e) {
            console.error('Failed to create category', e);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
            <DialogTitle>Edit Categories</DialogTitle>
            <DialogContent dividers>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField
                        size="small"
                        fullWidth
                        placeholder="New Category..."
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                    />
                    <Button variant="contained" onClick={handleCreate}>Add</Button>
                </Box>
                <List>
                    {categories.map((category) => (
                        <ListItem
                            key={category.id}
                            disablePadding
                        >
                            <ListItemButton onClick={() => handleToggle(category.id)}>
                                <Checkbox
                                    checked={selectedCategories.includes(category.id)}
                                    tabIndex={-1}
                                    disableRipple
                                />
                                <ListItemText primary={category.name} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Done</Button>
            </DialogActions>
        </Dialog>
    );
}
