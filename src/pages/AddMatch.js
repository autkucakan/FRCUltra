import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  IconButton,
  Chip,
  Snackbar,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import apiService from '../services/api';

const AddMatch = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [matchNumber, setMatchNumber] = useState('');
  const [matchStatus, setMatchStatus] = useState('scheduled');
  const [compLevel, setCompLevel] = useState('qm');
  const [redTeam1, setRedTeam1] = useState('');
  const [redTeam2, setRedTeam2] = useState('');
  const [redTeam3, setRedTeam3] = useState('');
  const [blueTeam1, setBlueTeam1] = useState('');
  const [blueTeam2, setBlueTeam2] = useState('');
  const [blueTeam3, setBlueTeam3] = useState('');
  const [redScore, setRedScore] = useState('');
  const [blueScore, setBlueScore] = useState('');
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get teams from local storage
        const cachedTeams = apiService.getFromLocalStorage('teams') || [];
        setTeams(cachedTeams);
        
        // Get matches from local storage
        const cachedMatches = apiService.getFromLocalStorage('match_data') || [];
        setMatches(cachedMatches);
      } catch (error) {
        console.error('Error fetching data:', error);
        showSnackbar('Failed to load data', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    if (!matchNumber || !redTeam1 || !redTeam2 || !redTeam3 || !blueTeam1 || !blueTeam2 || !blueTeam3) {
      showSnackbar('Please fill in all required fields', 'error');
      return;
    }
    
    // Check if match number already exists
    const matchExists = matches.some(match => match.match_number === parseInt(matchNumber));
    if (matchExists) {
      showSnackbar('Match number already exists', 'error');
      return;
    }
    
    // Create match object
    const newMatch = {
      match_number: parseInt(matchNumber),
      comp_level: compLevel,
      red_alliance: [
        parseInt(redTeam1),
        parseInt(redTeam2),
        parseInt(redTeam3)
      ],
      blue_alliance: [
        parseInt(blueTeam1),
        parseInt(blueTeam2),
        parseInt(blueTeam3)
      ],
      status: matchStatus
    };
    
    // Add score if match is completed
    if (matchStatus === 'completed' && redScore && blueScore) {
      newMatch.score_breakdown = {
        red: { total_points: parseInt(redScore) },
        blue: { total_points: parseInt(blueScore) }
      };
      
      // Determine winning alliance
      if (parseInt(redScore) > parseInt(blueScore)) {
        newMatch.winning_alliance = 'red';
      } else if (parseInt(blueScore) > parseInt(redScore)) {
        newMatch.winning_alliance = 'blue';
      } else {
        newMatch.winning_alliance = 'tie';
      }
    }
    
    // Add match to matches array
    const updatedMatches = [...matches, newMatch];
    
    // Sort matches by match number
    updatedMatches.sort((a, b) => a.match_number - b.match_number);
    
    // Save to local storage
    apiService.saveToLocalStorage('match_data', updatedMatches);
    
    // Update state
    setMatches(updatedMatches);
    
    // Show success message
    showSnackbar('Match added successfully', 'success');
    
    // Reset form
    resetForm();
  };
  
  const resetForm = () => {
    setMatchNumber('');
    setRedTeam1('');
    setRedTeam2('');
    setRedTeam3('');
    setBlueTeam1('');
    setBlueTeam2('');
    setBlueTeam3('');
    setRedScore('');
    setBlueScore('');
    setMatchStatus('scheduled');
  };
  
  const deleteMatch = (matchNumber) => {
    // Filter out the match to delete
    const updatedMatches = matches.filter(match => match.match_number !== matchNumber);
    
    // Save to local storage
    apiService.saveToLocalStorage('match_data', updatedMatches);
    
    // Update state
    setMatches(updatedMatches);
    
    // Show success message
    showSnackbar('Match deleted successfully', 'success');
  };
  
  const showSnackbar = (message, severity) => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };
  
  const handleSnackbarClose = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Add Match
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        {/* Add Match Form */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Match Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <form onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Match Number"
                      type="number"
                      value={matchNumber}
                      onChange={(e) => setMatchNumber(e.target.value)}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Competition Level</InputLabel>
                      <Select
                        value={compLevel}
                        label="Competition Level"
                        onChange={(e) => setCompLevel(e.target.value)}
                        required
                      >
                        <MenuItem value="pr">Practice</MenuItem>
                        <MenuItem value="qm">Qualification</MenuItem>
                        <MenuItem value="po">Playoff</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Match Status</InputLabel>
                      <Select
                        value={matchStatus}
                        label="Match Status"
                        onChange={(e) => setMatchStatus(e.target.value)}
                      >
                        <MenuItem value="scheduled">Scheduled</MenuItem>
                        <MenuItem value="completed">Completed</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                      Red Alliance
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Red Team 1</InputLabel>
                      <Select
                        value={redTeam1}
                        label="Red Team 1"
                        onChange={(e) => setRedTeam1(e.target.value)}
                        required
                      >
                        <MenuItem value="">
                          <em>Select a team</em>
                        </MenuItem>
                        {teams.map((team) => (
                          <MenuItem key={`red1-${team.team_number}`} value={team.team_number}>
                            {team.team_number} - {team.nickname}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Red Team 2</InputLabel>
                      <Select
                        value={redTeam2}
                        label="Red Team 2"
                        onChange={(e) => setRedTeam2(e.target.value)}
                        required
                      >
                        <MenuItem value="">
                          <em>Select a team</em>
                        </MenuItem>
                        {teams.map((team) => (
                          <MenuItem key={`red2-${team.team_number}`} value={team.team_number}>
                            {team.team_number} - {team.nickname}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Red Team 3</InputLabel>
                      <Select
                        value={redTeam3}
                        label="Red Team 3"
                        onChange={(e) => setRedTeam3(e.target.value)}
                        required
                      >
                        <MenuItem value="">
                          <em>Select a team</em>
                        </MenuItem>
                        {teams.map((team) => (
                          <MenuItem key={`red3-${team.team_number}`} value={team.team_number}>
                            {team.team_number} - {team.nickname}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                      Blue Alliance
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Blue Team 1</InputLabel>
                      <Select
                        value={blueTeam1}
                        label="Blue Team 1"
                        onChange={(e) => setBlueTeam1(e.target.value)}
                        required
                      >
                        <MenuItem value="">
                          <em>Select a team</em>
                        </MenuItem>
                        {teams.map((team) => (
                          <MenuItem key={`blue1-${team.team_number}`} value={team.team_number}>
                            {team.team_number} - {team.nickname}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Blue Team 2</InputLabel>
                      <Select
                        value={blueTeam2}
                        label="Blue Team 2"
                        onChange={(e) => setBlueTeam2(e.target.value)}
                        required
                      >
                        <MenuItem value="">
                          <em>Select a team</em>
                        </MenuItem>
                        {teams.map((team) => (
                          <MenuItem key={`blue2-${team.team_number}`} value={team.team_number}>
                            {team.team_number} - {team.nickname}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Blue Team 3</InputLabel>
                      <Select
                        value={blueTeam3}
                        label="Blue Team 3"
                        onChange={(e) => setBlueTeam3(e.target.value)}
                        required
                      >
                        <MenuItem value="">
                          <em>Select a team</em>
                        </MenuItem>
                        {teams.map((team) => (
                          <MenuItem key={`blue3-${team.team_number}`} value={team.team_number}>
                            {team.team_number} - {team.nickname}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  {matchStatus === 'completed' && (
                    <>
                      <Grid item xs={12}>
                        <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                          Match Results
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Red Alliance Score"
                          type="number"
                          value={redScore}
                          onChange={(e) => setRedScore(e.target.value)}
                          required={matchStatus === 'completed'}
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Blue Alliance Score"
                          type="number"
                          value={blueScore}
                          onChange={(e) => setBlueScore(e.target.value)}
                          required={matchStatus === 'completed'}
                        />
                      </Grid>
                    </>
                  )}
                  
                  <Grid item xs={12} sx={{ mt: 2 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      startIcon={<SaveIcon />}
                      fullWidth
                    >
                      Add Match
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Matches List */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Existing Matches
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {matches.length > 0 ? (
                <List sx={{ maxHeight: 600, overflow: 'auto' }}>
                  {matches.map((match) => (
                    <ListItem
                      key={match.match_number}
                      component={Paper}
                      elevation={1}
                      sx={{ mb: 1, borderRadius: 1 }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="subtitle1">
                              Match {match.match_number}
                            </Typography>
                            <Typography variant="subtitle1">
                              {match.status === 'completed' ? (
                                match.winning_alliance === 'red' ? (
                                  <Chip 
                                    label={`Red Wins ${match.score_breakdown.red.total_points}-${match.score_breakdown.blue.total_points}`} 
                                    color="error" 
                                    size="small" 
                                  />
                                ) : match.winning_alliance === 'blue' ? (
                                  <Chip 
                                    label={`Blue Wins ${match.score_breakdown.blue.total_points}-${match.score_breakdown.red.total_points}`} 
                                    color="primary" 
                                    size="small" 
                                  />
                                ) : (
                                  <Chip 
                                    label={`Tie ${match.score_breakdown.red.total_points}-${match.score_breakdown.blue.total_points}`} 
                                    color="default" 
                                    size="small" 
                                  />
                                )
                              ) : (
                                <Chip label="Scheduled" color="default" size="small" />
                              )}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" color="error.main">
                              Red: {match.red_alliance.join(', ')}
                            </Typography>
                            <Typography variant="body2" color="primary.main">
                              Blue: {match.blue_alliance.join(', ')}
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton 
                          edge="end" 
                          aria-label="delete"
                          onClick={() => deleteMatch(match.match_number)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Alert severity="info">
                  No matches found. Add your first match using the form.
                </Alert>
              )}
            </CardContent>
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

export default AddMatch; 