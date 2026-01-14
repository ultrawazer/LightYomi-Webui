import { useState, useEffect } from 'react';
import {
    Typography, Box, Paper, List, ListItem, ListItemText, ListItemSecondaryAction,
    IconButton, TextField, Button, CircularProgress, Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';

interface Repository {
    id: number;
    url: string;
}

export default function SettingsRepositories() {
    const [repos, setRepos] = useState<Repository[]>([]);
    const [loading, setLoading] = useState(true);
    const [newRepoUrl, setNewRepoUrl] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchRepos();
    }, []);

    const fetchRepos = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/source/repos');
            setRepos(res.data);
        } catch (e) {
            console.error(e);
            setError('Failed to load repositories');
        } finally {
            setLoading(false);
        }
    };

    const handleAddRepo = async () => {
        if (!newRepoUrl) return;
        try {
            await axios.post('/api/source/repos', { url: newRepoUrl });
            setNewRepoUrl('');
            fetchRepos();
        } catch (e: any) {
            console.error(e);
            alert(e.response?.data?.error || 'Failed to add repository');
        }
    };

    const handleDeleteRepo = async (id: number) => {
        if (!confirm('Are you sure you want to delete this repository?')) return;
        try {
            await axios.delete(`/api/source/repos/${id}`);
            fetchRepos();
        } catch (e) {
            console.error(e);
            alert('Failed to delete repository');
        }
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>Extension Repositories</Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
                Add external repositories to find more plugins.
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                        fullWidth
                        size="small"
                        label="Repository URL"
                        value={newRepoUrl}
                        onChange={(e) => setNewRepoUrl(e.target.value)}
                        placeholder="https://raw.githubusercontent.com/..."
                    />
                    <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddRepo}>
                        Add
                    </Button>
                </Box>
            </Paper>

            <Paper variant="outlined">
                {loading ? (
                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                        <CircularProgress size={24} />
                    </Box>
                ) : (
                    <List>
                        {repos.map((repo) => (
                            <ListItem key={repo.id} divider>
                                <ListItemText primary={repo.url} />
                                <ListItemSecondaryAction>
                                    <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteRepo(repo.id)}>
                                        <DeleteIcon />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                        {repos.length === 0 && (
                            <ListItem>
                                <ListItemText primary="No repositories added." secondary="Add one above to get started." />
                            </ListItem>
                        )}
                    </List>
                )}
            </Paper>
        </Box>
    );
}
