import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme/theme';
import { ToolbarProvider } from './contexts/ToolbarContext';
import Library from './pages/Library';
import Browse from './pages/Browse';
import BrowseSource from './pages/BrowseSource';
import Novel from './pages/Novel';
import Reader from './pages/Reader';
import Settings from './pages/Settings';
import HistoryPage from './pages/History';
import Updates from './pages/Updates';
import Queue from './pages/Queue';
import Stats from './pages/Stats';
import Downloads from './pages/Downloads';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <ToolbarProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Library />} />
              <Route path="browse" element={<Browse />} />
              <Route path="browse/:pluginId" element={<BrowseSource />} />
              <Route path="history" element={<HistoryPage />} />
              <Route path="updates" element={<Updates />} />
              <Route path="queue" element={<Queue />} />
              <Route path="downloads" element={<Downloads />} />
              <Route path="stats" element={<Stats />} />
              {/* Dynamic Routes */}
              <Route path="novel/:id" element={<Novel />} />
              <Route path="novel/source/:pluginId/:novelUrl" element={<Novel />} />
              <Route path="novel/:novelId/chapter/:chapterId" element={<Reader />} />
              <Route path="reader" element={<Reader />} />
              {/* Fallback/Legacy query param routes if needed, or just let them match index if not specific */}
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToolbarProvider>
    </ThemeProvider>
  );
}

export default App;
