import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  TextField,
  Paper,
  Alert,
  Snackbar,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';

const ImportTeams = () => {
  const navigate = useNavigate();
  const [jsonData, setJsonData] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Handle JSON data change
  const handleJsonDataChange = (event) => {
    setJsonData(event.target.value);
  };

  // Import teams from JSON
  const importTeams = () => {
    if (!jsonData) {
      showSnackbar('Please enter JSON data', 'error');
      return;
    }

    try {
      setLoading(true);
      
      // Parse JSON data
      const data = JSON.parse(jsonData);
      
      // Validate data structure
      if (!data.teams || !Array.isArray(data.teams)) {
        throw new Error('Invalid data format: Missing teams array');
      }
      
      // Import teams
      const importResult = apiService.importTeamsFromJson(data.teams);
      
      setResult(importResult);
      
      if (importResult.success) {
        showSnackbar(importResult.message, 'success');
      } else {
        showSnackbar(importResult.message, 'error');
      }
    } catch (error) {
      console.error('Error importing teams:', error);
      showSnackbar(`Error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Show sample data
  const showSampleData = () => {
    const sampleData = {
      "teamCountTotal": 2,
      "teamCountPage": 2,
      "pageCurrent": 1,
      "pageTotal": 1,
      "teams": [
        {
          "teamNumber": 9029,
          "nameFull": "Family/Community",
          "nameShort": "Team NF",
          "city": "Çankaya",
          "stateProv": "Ankara",
          "country": "Türkiye",
          "rookieYear": 2023,
          "robotName": "",
          "schoolName": "Family/Community"
        },
        {
          "teamNumber": 6436,
          "nameFull": "Another Team Full Name",
          "nameShort": "Another Team",
          "city": "Another City",
          "stateProv": "Another State",
          "country": "Turkey",
          "rookieYear": 2017,
          "robotName": "",
          "schoolName": "Another School"
        }
      ]
    };
    
    setJsonData(JSON.stringify(sampleData, null, 2));
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

  // Go to dashboard
  const goToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Import Teams
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                JSON Data
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <TextField
                fullWidth
                multiline
                rows={20}
                variant="outlined"
                value={jsonData}
                onChange={handleJsonDataChange}
                placeholder="Paste JSON data here..."
                sx={{ mb: 2, fontFamily: 'monospace' }}
              />
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={importTeams}
                  disabled={loading || !jsonData}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  Import Teams
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={showSampleData}
                >
                  Show Sample Data
                </Button>
                <Button
                  variant="outlined"
                  onClick={goToDashboard}
                >
                  Go to Dashboard
                </Button>
              </Box>
              
              {result && (
                <Alert 
                  severity={result.success ? "success" : "error"}
                  sx={{ mt: 2 }}
                >
                  {result.message}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Instructions
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Typography variant="body2" paragraph>
                1. Paste the JSON data containing team information in the text area.
              </Typography>
              <Typography variant="body2" paragraph>
                2. Click "Import Teams" to process the data.
              </Typography>
              <Typography variant="body2" paragraph>
                3. The teams will be saved to the local storage and can be viewed in the Dashboard.
              </Typography>
              <Typography variant="body2" paragraph>
                4. The JSON data should have a "teams" array with team objects.
              </Typography>
              <Typography variant="body2">
                5. Each team object should have properties like "teamNumber", "nameShort", etc.
              </Typography>
            </CardContent>
          </Card>
          
          {result && result.success && result.teams && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Imported Teams
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {result.teams.slice(0, 10).map((team) => (
                    <ListItem key={team.team_number} divider>
                      <ListItemText
                        primary={`${team.team_number} - ${team.nickname}`}
                        secondary={`${team.city}, ${team.state_prov}, ${team.country}`}
                      />
                    </ListItem>
                  ))}
                  {result.teams.length > 10 && (
                    <ListItem>
                      <ListItemText
                        primary={`... and ${result.teams.length - 10} more teams`}
                      />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          )}
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

export default ImportTeams; 