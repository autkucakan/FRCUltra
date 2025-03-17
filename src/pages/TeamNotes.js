import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Grid, Card, CardContent, TextField, Button, 
  List, ListItem, ListItemText, Divider, Box, Paper, Tabs, Tab, 
  IconButton, Alert, CircularProgress, Chip, Dialog, DialogTitle, 
  DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { 
  Save as SaveIcon, 
  Delete as DeleteIcon, 
  Edit as EditIcon,
  Add as AddIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import apiService from '../services/api';

// TabPanel component for the tabs
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`team-tabpanel-${index}`}
      aria-labelledby={`team-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const TeamNotes = () => {
  const { teamNumber } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [team, setTeam] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  
  // Notes state
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [editingNote, setEditingNote] = useState(null);
  
  // Match analysis state
  const [matchAnalysis, setMatchAnalysis] = useState([]);
  const [matches, setMatches] = useState([]);
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState('');
  const [analysisText, setAnalysisText] = useState('');
  
  // Load team data, notes, and match analysis
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get teams from local storage
        const teams = apiService.getFromLocalStorage('teams') || [];
        const team = teams.find(t => t.team_number === parseInt(teamNumber));
        
        if (!team) {
          throw new Error(`Team ${teamNumber} not found`);
        }
        
        setTeam(team);
        
        // Get matches from local storage
        const matches = apiService.getFromLocalStorage('match_data') || [];
        const teamMatches = matches.filter(match => {
          const redTeams = match.red_alliance || [];
          const blueTeams = match.blue_alliance || [];
          return redTeams.includes(parseInt(teamNumber)) || blueTeams.includes(parseInt(teamNumber));
        });
        
        setMatches(teamMatches);
        
        // Get team notes
        const teamNotes = apiService.getTeamNotes(teamNumber) || [];
        setNotes(teamNotes);
        
        // Get match analysis
        const analysis = apiService.getTeamMatchAnalysis(teamNumber) || [];
        setMatchAnalysis(analysis);
        
      } catch (error) {
        console.error('Error loading team data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [teamNumber]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Add a new note
  const addNote = () => {
    if (!newNote.trim()) return;
    
    const noteObj = {
      id: Date.now(),
      text: newNote,
      timestamp: new Date().toISOString()
    };
    
    const updatedNotes = [...notes, noteObj];
    setNotes(updatedNotes);
    apiService.saveTeamNotes(teamNumber, updatedNotes);
    setNewNote('');
  };
  
  // Delete a note
  const deleteNote = (noteId) => {
    const updatedNotes = notes.filter(note => note.id !== noteId);
    setNotes(updatedNotes);
    apiService.saveTeamNotes(teamNumber, updatedNotes);
  };
  
  // Start editing a note
  const startEditNote = (note) => {
    setEditingNote({
      id: note.id,
      text: note.text
    });
  };
  
  // Save edited note
  const saveEditedNote = () => {
    if (!editingNote || !editingNote.text.trim()) return;
    
    const updatedNotes = notes.map(note => 
      note.id === editingNote.id 
        ? { ...note, text: editingNote.text } 
        : note
    );
    
    setNotes(updatedNotes);
    apiService.saveTeamNotes(teamNumber, updatedNotes);
    setEditingNote(null);
  };
  
  // Open dialog to add match analysis
  const openAnalysisDialog = () => {
    setSelectedMatch('');
    setAnalysisText('');
    setDialogOpen(true);
  };
  
  // Save match analysis
  const saveMatchAnalysis = () => {
    if (!selectedMatch || !analysisText.trim()) return;
    
    const analysisObj = {
      id: Date.now(),
      match_number: selectedMatch,
      text: analysisText,
      timestamp: new Date().toISOString()
    };
    
    const updatedAnalysis = [...matchAnalysis, analysisObj];
    setMatchAnalysis(updatedAnalysis);
    apiService.saveTeamMatchAnalysis(teamNumber, updatedAnalysis);
    setDialogOpen(false);
  };
  
  // Delete match analysis
  const deleteAnalysis = (analysisId) => {
    const updatedAnalysis = matchAnalysis.filter(analysis => analysis.id !== analysisId);
    setMatchAnalysis(updatedAnalysis);
    apiService.saveTeamMatchAnalysis(teamNumber, updatedAnalysis);
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Render loading state
  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading team data...
        </Typography>
      </Container>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert 
          severity="error" 
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => navigate('/dashboard')}
            >
              Back to Dashboard
            </Button>
          }
        >
          {error}
        </Alert>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton 
          color="primary" 
          onClick={() => navigate('/dashboard')}
          sx={{ mr: 2 }}
        >
          <ArrowBackIcon />
        </IconButton>
        
        <Typography variant="h4" component="h1">
          Team {team.team_number} - {team.nickname || 'Unknown Team'}
        </Typography>
      </Box>
      
      <Paper sx={{ mb: 4 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          indicatorColor="primary"
          textColor="primary"
          centered
        >
          <Tab label="Team Info" />
          <Tab label="Notes" />
          <Tab label="Match Analysis" />
        </Tabs>
        
        {/* Team Info Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Team Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Typography variant="body1">
                    <strong>Team Number:</strong> {team.team_number}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Team Name:</strong> {team.nickname || 'N/A'}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Location:</strong> {team.city ? `${team.city}, ${team.state_prov}, ${team.country}` : 'N/A'}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Rookie Year:</strong> {team.rookie_year || 'N/A'}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Website:</strong> {team.website_url ? (
                      <a href={team.website_url} target="_blank" rel="noopener noreferrer">
                        {team.website_url}
                      </a>
                    ) : 'N/A'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Upcoming Matches
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  {matches.length > 0 ? (
                    <List>
                      {matches.map((match) => {
                        const isRed = match.red_alliance && match.red_alliance.includes(parseInt(teamNumber));
                        return (
                          <ListItem key={match.match_number} divider>
                            <ListItemText
                              primary={`Match ${match.match_number}`}
                              secondary={
                                <>
                                  <Chip 
                                    size="small" 
                                    label={isRed ? "Red Alliance" : "Blue Alliance"} 
                                    color={isRed ? "error" : "primary"}
                                    sx={{ mr: 1 }}
                                  />
                                  {isRed ? (
                                    `Red: ${match.red_alliance.join(', ')}`
                                  ) : (
                                    `Blue: ${match.blue_alliance.join(', ')}`
                                  )}
                                  <br />
                                  {isRed ? (
                                    `Blue: ${match.blue_alliance.join(', ')}`
                                  ) : (
                                    `Red: ${match.red_alliance.join(', ')}`
                                  )}
                                </>
                              }
                            />
                          </ListItem>
                        );
                      })}
                    </List>
                  ) : (
                    <Alert severity="info">
                      No matches found for this team.
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Notes Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Team Notes
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ mb: 3 }}>
                    <TextField
                      fullWidth
                      label="Add a note about this team"
                      multiline
                      rows={3}
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      variant="outlined"
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<SaveIcon />}
                      onClick={addNote}
                      disabled={!newNote.trim()}
                      sx={{ mt: 2 }}
                    >
                      Add Note
                    </Button>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  {notes.length > 0 ? (
                    <List>
                      {notes.map((note) => (
                        <ListItem key={note.id} divider>
                          {editingNote && editingNote.id === note.id ? (
                            <Box sx={{ width: '100%' }}>
                              <TextField
                                fullWidth
                                multiline
                                rows={2}
                                value={editingNote.text}
                                onChange={(e) => setEditingNote({...editingNote, text: e.target.value})}
                                variant="outlined"
                                sx={{ mb: 1 }}
                              />
                              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                <Button 
                                  size="small" 
                                  onClick={() => setEditingNote(null)}
                                >
                                  Cancel
                                </Button>
                                <Button 
                                  size="small" 
                                  variant="contained" 
                                  onClick={saveEditedNote}
                                >
                                  Save
                                </Button>
                              </Box>
                            </Box>
                          ) : (
                            <>
                              <ListItemText
                                primary={note.text}
                                secondary={`Added: ${formatDate(note.timestamp)}`}
                                sx={{ pr: 8 }}
                              />
                              <Box sx={{ position: 'absolute', right: 16, display: 'flex' }}>
                                <IconButton 
                                  edge="end" 
                                  aria-label="edit"
                                  onClick={() => startEditNote(note)}
                                  sx={{ mr: 1 }}
                                >
                                  <EditIcon />
                                </IconButton>
                                <IconButton 
                                  edge="end" 
                                  aria-label="delete"
                                  onClick={() => deleteNote(note.id)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Box>
                            </>
                          )}
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Alert severity="info">
                      No notes have been added for this team yet.
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Match Analysis Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Match Analysis
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<AddIcon />}
                      onClick={openAnalysisDialog}
                    >
                      Add Analysis
                    </Button>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  
                  {matchAnalysis.length > 0 ? (
                    <List>
                      {matchAnalysis.map((analysis) => (
                        <ListItem key={analysis.id} divider>
                          <ListItemText
                            primary={`Match ${analysis.match_number}`}
                            secondary={
                              <>
                                <Typography variant="body2" component="span">
                                  {analysis.text}
                                </Typography>
                                <Typography variant="caption" component="p" sx={{ mt: 1 }}>
                                  Added: {formatDate(analysis.timestamp)}
                                </Typography>
                              </>
                            }
                            sx={{ pr: 8 }}
                          />
                          <Box sx={{ position: 'absolute', right: 16 }}>
                            <IconButton 
                              edge="end" 
                              aria-label="delete"
                              onClick={() => deleteAnalysis(analysis.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Alert severity="info">
                      No match analysis has been added for this team yet.
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
      
      {/* Dialog for adding match analysis */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Match Analysis</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
            <InputLabel id="match-select-label">Select Match</InputLabel>
            <Select
              labelId="match-select-label"
              value={selectedMatch}
              label="Select Match"
              onChange={(e) => setSelectedMatch(e.target.value)}
            >
              {matches.map((match) => (
                <MenuItem key={match.match_number} value={match.match_number}>
                  Match {match.match_number}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            label="Analysis"
            multiline
            rows={4}
            value={analysisText}
            onChange={(e) => setAnalysisText(e.target.value)}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={saveMatchAnalysis} 
            variant="contained" 
            color="primary"
            disabled={!selectedMatch || !analysisText.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TeamNotes; 