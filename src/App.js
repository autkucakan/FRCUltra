import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Box, 
  useMediaQuery,
  Container
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import BrightnessHighIcon from '@mui/icons-material/BrightnessHigh';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import ErrorBoundary from './components/ErrorBoundary';

import Dashboard from './pages/Dashboard';
import TeamDetails from './pages/TeamDetails';
import MatchTracking from './pages/MatchTracking';
import HeatmapAnalysis from './pages/HeatmapAnalysis';
import StrategyPlanning from './pages/StrategyPlanning';
import Settings from './pages/Settings';
import TeamNotes from './pages/TeamNotes';
import QuickMatchAnalysis from './pages/QuickMatchAnalysis';
import ImportTeams from './pages/ImportTeams';
import AddMatch from './pages/AddMatch';
import Sidebar from './components/Sidebar';
import apiService from './services/api';
import TeamStrategy from './pages/TeamStrategy';
import './App.css';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width:600px)');
  const drawerWidth = 240;
  
  useEffect(() => {
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme) {
      setDarkMode(JSON.parse(savedTheme));
    } else {
      const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDarkMode);
    }
    
    const savedSettings = apiService.getFromLocalStorage('app_settings');
    if (savedSettings) {
      if (savedSettings.username && savedSettings.authToken) {
        apiService.setFirstApiAuth(savedSettings.username, savedSettings.authToken);
      }
    }
  }, []);
  
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);
  
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
      background: {
        default: darkMode ? '#121212' : '#f5f5f5',
        paper: darkMode ? '#1e1e1e' : '#ffffff',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h4: {
        fontWeight: 600,
      },
      h5: {
        fontWeight: 500,
      },
      h6: {
        fontWeight: 500,
      },
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            boxShadow: darkMode 
              ? '0 4px 8px rgba(0, 0, 0, 0.4)' 
              : '0 2px 4px rgba(0, 0, 0, 0.1)',
            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: darkMode 
                ? '0 8px 16px rgba(0, 0, 0, 0.6)' 
                : '0 4px 8px rgba(0, 0, 0, 0.2)',
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            textTransform: 'none',
            fontWeight: 500,
          },
        },
      },
    },
  });
  
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };
  
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Box sx={{ display: 'flex' }}>
            <AppBar
              position="fixed"
              sx={{
                width: { sm: `calc(100% - ${drawerWidth}px)` },
                ml: { sm: `${drawerWidth}px` },
              }}
            >
              <Toolbar>
                <IconButton
                  color="inherit"
                  aria-label="open drawer"
                  edge="start"
                  onClick={handleDrawerToggle}
                  sx={{ mr: 2, display: { sm: 'none' } }}
                >
                  <MenuIcon />
                </IconButton>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                  FRC Ultra Scouting
                </Typography>
                <IconButton color="inherit" onClick={toggleDarkMode}>
                  {darkMode ? <BrightnessHighIcon /> : <Brightness4Icon />}
                </IconButton>
              </Toolbar>
            </AppBar>
            
            <Sidebar 
              drawerWidth={drawerWidth} 
              mobileOpen={mobileOpen} 
              handleDrawerToggle={handleDrawerToggle} 
            />
            
            <Box
              component="main"
              sx={{
                flexGrow: 1,
                p: 3,
                width: { sm: `calc(100% - ${drawerWidth}px)` },
                mt: ['56px', '64px'],
              }}
            >
              <Container maxWidth="lg">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/dashboard" element={<Navigate to="/" replace />} />
                  <Route path="/match-tracking" element={<MatchTracking />} />
                  <Route path="/match-tracking/:matchNumber" element={<MatchTracking />} />
                  <Route path="/team-details" element={<TeamDetails />} />
                  <Route path="/heatmap" element={<HeatmapAnalysis />} />
                  <Route path="/strategy" element={<TeamStrategy />} />
                  <Route path="/strategy-planning" element={<StrategyPlanning />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/team/:teamNumber" element={<TeamNotes />} />
                  <Route path="/match-analysis/:matchNumber" element={<QuickMatchAnalysis />} />
                  <Route path="/import-teams" element={<ImportTeams />} />
                  <Route path="/add-match" element={<AddMatch />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Container>
            </Box>
          </Box>
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
