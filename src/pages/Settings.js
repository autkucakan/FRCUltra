import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Button,
  Switch,
  FormControlLabel,
  TextField,
  Divider,
  Alert,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  CardActions
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import apiService from '../services/api';

const Settings = () => {
  const [offlineMode, setOfflineMode] = useState(false);
  const [dataRetention, setDataRetention] = useState(30);
  
  // FIRST API settings
  const [year, setYear] = useState(new Date().getFullYear());
  const [eventCode, setEventCode] = useState('');
  const [firstUsername, setFirstUsername] = useState('');
  const [firstApiKey, setFirstApiKey] = useState('');
  
  // Test results
  const [firstApiTestResult, setFirstApiTestResult] = useState(null);
  const [firstApiTestLoading, setFirstApiTestLoading] = useState(false);
  const [firstApiRefreshLoading, setFirstApiRefreshLoading] = useState(false);
  
  const [cachedData, setCachedData] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = apiService.getFromLocalStorage('app_settings');
    if (savedSettings) {
      setOfflineMode(savedSettings.offlineMode || false);
      setDataRetention(savedSettings.dataRetention || 30);
      
      // FIRST API settings
      setYear(savedSettings.year || new Date().getFullYear());
      setEventCode(savedSettings.eventCode || '');
      setFirstUsername(savedSettings.firstUsername || '');
      setFirstApiKey(savedSettings.firstApiKey || '');
    }
    
    refreshCachedData();
  }, []);
  
  // Refresh cached data list
  const refreshCachedData = () => {
    // Get list of cached data
    const keys = Object.keys(localStorage);
    const dataKeys = keys.filter(key => 
      key !== 'app_settings' && 
      key !== 'darkMode' && 
      !key.startsWith('notes_')
    );
    
    const dataItems = dataKeys.map(key => {
      const size = new Blob([localStorage.getItem(key)]).size;
      return {
        key,
        size: formatBytes(size),
        date: new Date().toLocaleDateString()
      };
    });
    
    setCachedData(dataItems);
  };
  
  // Format bytes to human-readable format
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };
  
  // Test FIRST API connection
  const testFirstApiConnection = async () => {
    if (!year || !eventCode || !firstUsername || !firstApiKey) {
      showSnackbar('Please enter all FIRST API credentials', 'error');
      return;
    }
    
    try {
      setFirstApiTestLoading(true);
      
      // Set API credentials
      apiService.setFirstApiAuth(firstUsername, firstApiKey);
      
      // Test connection by fetching event details
      const testResponse = await apiService.getEventDetails(year, eventCode);
      
      if (testResponse) {
        setFirstApiTestResult({
          success: true,
          message: 'Connection successful!'
        });
        showSnackbar('FIRST API connection successful!', 'success');
      } else {
        setFirstApiTestResult({
          success: false,
          message: 'Failed to retrieve event data'
        });
        showSnackbar('FIRST API connection failed', 'error');
      }
    } catch (error) {
      console.error('FIRST API test error:', error);
      setFirstApiTestResult({
        success: false,
        message: error.message || 'Failed to connect to FIRST API'
      });
      showSnackbar(`FIRST API connection failed: ${error.message}`, 'error');
    } finally {
      setFirstApiTestLoading(false);
    }
  };
  
  // Save settings
  const saveSettings = () => {
    const settings = {
      offlineMode,
      dataRetention,
      year,
      eventCode,
      firstUsername,
      firstApiKey
    };
    
    try {
      apiService.saveToLocalStorage('app_settings', settings);
      
      // Set API keys
      if (firstUsername && firstApiKey) {
        apiService.setFirstApiKey(firstUsername, firstApiKey);
      }
      
      showSnackbar('Settings saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      showSnackbar('Failed to save settings', 'error');
    }
  };
  
  // Refresh data from FIRST API
  const refreshDataFromFirstApi = async () => {
    if (!year || !eventCode || !firstUsername || !firstApiKey) {
      showSnackbar('Please enter all FIRST API credentials', 'error');
      return;
    }
    
    try {
      setFirstApiRefreshLoading(true);
      
      // Set API key
      apiService.setFirstApiKey(firstUsername, firstApiKey);
      
      // Fetch teams
      const teamsData = await apiService.getFirstEventTeams(year, eventCode);
      
      if (!teamsData || teamsData.length === 0) {
        throw new Error('No teams found for this event');
      }
      
      // Convert teams to our format
      const teams = apiService.convertFirstTeams(teamsData);
      
      // Save teams to localStorage
      apiService.saveToLocalStorage('teams', teams);
      
      // Fetch matches and results
      const matchesData = await apiService.getFirstEventMatches(year, eventCode);
      const resultsData = await apiService.getFirstEventMatchResults(year, eventCode);
      
      // Convert matches to our format
      const matches = apiService.convertFirstMatches(matchesData, resultsData);
      
      // Save matches to localStorage
      apiService.saveToLocalStorage('match_data', matches);
      
      showSnackbar(`Successfully refreshed data: ${teams.length} teams, ${matches.length} matches`, 'success');
      refreshCachedData();
    } catch (error) {
      console.error('FIRST API refresh error:', error);
      showSnackbar(`Failed to refresh data: ${error.message}`, 'error');
    } finally {
      setFirstApiRefreshLoading(false);
    }
  };
  
  // Clear all cached data
  const clearAllData = () => {
    if (window.confirm('Are you sure you want to clear all cached data? This action cannot be undone.')) {
      const keys = Object.keys(localStorage);
      const dataKeys = keys.filter(key => 
        key !== 'app_settings' && 
        key !== 'darkMode'
      );
      
      dataKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      
      setCachedData([]);
      showSnackbar('All cached data has been cleared', 'success');
    }
  };
  
  // Delete specific cached item
  const deleteCachedItem = (key) => {
    localStorage.removeItem(key);
    setCachedData(cachedData.filter(item => item.key !== key));
    showSnackbar(`Deleted ${key}`, 'success');
  };
  
  // Export all data
  const exportData = () => {
    const dataToExport = {};
    
    Object.keys(localStorage).forEach(key => {
      if (key !== 'darkMode') {
        try {
          dataToExport[key] = JSON.parse(localStorage.getItem(key));
        } catch (e) {
          dataToExport[key] = localStorage.getItem(key);
        }
      }
    });
    
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `frc_ultra_export_${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showSnackbar('Data exported successfully', 'success');
  };
  
  // Import data
  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        Object.keys(data).forEach(key => {
          localStorage.setItem(key, JSON.stringify(data[key]));
        });
        
        // Refresh cached data list
        refreshCachedData();
        
        showSnackbar('Data imported successfully', 'success');
        
        // Reload settings
        if (data.app_settings) {
          setOfflineMode(data.app_settings.offlineMode || false);
          setDataRetention(data.app_settings.dataRetention || 30);
          setYear(data.app_settings.year || new Date().getFullYear());
          setEventCode(data.app_settings.eventCode || '');
          setFirstUsername(data.app_settings.firstUsername || '');
          setFirstApiKey(data.app_settings.firstApiKey || '');
        }
        
      } catch (error) {
        showSnackbar('Error importing data: Invalid format', 'error');
        console.error('Import error:', error);
      }
    };
    
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = null;
  };
  
  // Show snackbar message
  const showSnackbar = (message, severity) => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };
  
  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      
      <Grid container spacing={3}>
        {/* General Settings */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                General Settings
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={offlineMode}
                    onChange={(e) => setOfflineMode(e.target.checked)}
                    color="primary"
                  />
                }
                label="Offline Mode"
              />
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                When enabled, the app will not attempt to connect to any APIs and will use only cached data.
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="data-retention-label">Data Retention Period</InputLabel>
                <Select
                  labelId="data-retention-label"
                  value={dataRetention}
                  label="Data Retention Period"
                  onChange={(e) => setDataRetention(e.target.value)}
                >
                  <MenuItem value={7}>7 days</MenuItem>
                  <MenuItem value={14}>14 days</MenuItem>
                  <MenuItem value={30}>30 days</MenuItem>
                  <MenuItem value={90}>90 days</MenuItem>
                  <MenuItem value={365}>1 year</MenuItem>
                </Select>
                <FormHelperText>
                  How long to keep cached data before automatically clearing it.
                </FormHelperText>
              </FormControl>
            </CardContent>
            <CardActions>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={saveSettings}
              >
                Save Settings
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        {/* FIRST API Settings */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                FIRST API Settings
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Year"
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    margin="normal"
                    helperText="Current competition year"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Event Code"
                    value={eventCode}
                    onChange={(e) => setEventCode(e.target.value)}
                    margin="normal"
                    helperText="Example: CAOC or TXDAL"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="FIRST API Username"
                    value={firstUsername}
                    onChange={(e) => setFirstUsername(e.target.value)}
                    margin="normal"
                    helperText="Your FIRST API username"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="FIRST API Key"
                    type="password"
                    value={firstApiKey}
                    onChange={(e) => setFirstApiKey(e.target.value)}
                    margin="normal"
                    helperText="Your FIRST API key"
                  />
                </Grid>
              </Grid>
              
              {firstApiTestResult && (
                <Alert 
                  severity={firstApiTestResult.success ? "success" : "error"}
                  sx={{ mt: 2 }}
                >
                  {firstApiTestResult.message}
                </Alert>
              )}
            </CardContent>
            <CardActions>
              <Button
                variant="outlined"
                color="primary"
                onClick={testFirstApiConnection}
                disabled={firstApiTestLoading}
                startIcon={firstApiTestLoading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
              >
                Test Connection
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={refreshDataFromFirstApi}
                disabled={firstApiRefreshLoading || offlineMode}
                startIcon={firstApiRefreshLoading ? <CircularProgress size={20} /> : <RefreshIcon />}
              >
                Refresh Data
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        {/* Data Management */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Data Management
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Typography variant="body2" paragraph>
                Total cached items: {cachedData.length}
              </Typography>
              
              <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Key</TableCell>
                      <TableCell>Size</TableCell>
                      <TableCell>Last Modified</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cachedData.map((item) => (
                      <TableRow key={item.key}>
                        <TableCell>{item.key}</TableCell>
                        <TableCell>{item.size}</TableCell>
                        <TableCell>{item.date}</TableCell>
                        <TableCell>
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => deleteCachedItem(item.key)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
            <CardActions>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<FileDownloadIcon />}
                onClick={exportData}
              >
                Export Data
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<FileUploadIcon />}
                component="label"
              >
                Import Data
                <input
                  type="file"
                  hidden
                  accept=".json"
                  onChange={importData}
                />
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteSweepIcon />}
                onClick={clearAllData}
              >
                Clear All Data
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Settings; 