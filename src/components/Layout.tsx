import React from 'react';
import { Box, AppBar, Toolbar, Typography, IconButton, CssBaseline, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';
import ExploreIcon from '@mui/icons-material/Explore';
import SettingsIcon from '@mui/icons-material/Settings';
import HistoryIcon from '@mui/icons-material/History';
import UpdateIcon from '@mui/icons-material/Update';
import QueueIcon from '@mui/icons-material/Queue';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useToolbar } from '../contexts/ToolbarContext';

const drawerWidth = 240;

export default function Layout() {
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { toolbarContent, pageTitle, backPath } = useToolbar();

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const menuItems = [
        { text: 'Library', icon: <LocalLibraryIcon />, path: '/' },
        { text: 'Updates', icon: <UpdateIcon />, path: '/updates' },
        { text: 'Queue', icon: <QueueIcon />, path: '/queue' },
        { text: 'Stats', icon: <EqualizerIcon />, path: '/stats' },
        { text: 'Browse', icon: <ExploreIcon />, path: '/browse' },
        { text: 'History', icon: <HistoryIcon />, path: '/history' },
        { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
    ];

    // Use custom page title if provided, otherwise use menu item text
    const currentTitle = pageTitle || menuItems.find(item => item.path === location.pathname)?.text || 'LightYomi';

    const drawer = (
        <div>
            <Toolbar>
                <Typography variant="h6" noWrap component="div">
                    LightYomi
                </Typography>
            </Toolbar>
            <List>
                {menuItems.map((item) => (
                    <ListItem key={item.text} disablePadding>
                        <ListItemButton
                            selected={location.pathname === item.path}
                            onClick={() => {
                                navigate(item.path);
                                setMobileOpen(false);
                            }}
                        >
                            <ListItemIcon>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.text} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </div>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                }}
            >
                <Toolbar sx={{ gap: 2 }}>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    {/* Back button when backPath is set */}
                    {backPath && (
                        <IconButton
                            color="inherit"
                            edge="start"
                            onClick={() => navigate(backPath)}
                            sx={{ mr: 1 }}
                        >
                            <ArrowBackIcon />
                        </IconButton>
                    )}
                    <Typography variant="h6" noWrap component="div" sx={{ flexShrink: 0 }}>
                        {currentTitle}
                    </Typography>
                    {/* Page-specific toolbar content */}
                    {toolbarContent && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
                            {toolbarContent}
                        </Box>
                    )}
                </Toolbar>
            </AppBar>
            <Box
                component="nav"
                sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
                aria-label="mailbox folders"
            >
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true, // Better open performance on mobile.
                    }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                >
                    {drawer}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    height: '100vh',
                    overflow: 'hidden',
                }}
            >
                <Toolbar /> {/* Spacer for fixed AppBar */}
                <Box sx={{
                    flex: 1,
                    overflow: 'auto',
                    p: 3,
                    display: 'flex',
                    flexDirection: 'column',
                }}>
                    <Outlet />
                </Box>
            </Box>
        </Box>
    );
}
