import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Grid, Card, CardContent, TextField, Button, 
  Divider, Box, Paper, IconButton, Alert, CircularProgress, Chip, 
  FormControl, InputLabel, Select, MenuItem, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Accordion, 
  AccordionSummary, AccordionDetails
} from '@mui/material';
import { 
  Save as SaveIcon, 
  ArrowBack as ArrowBackIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import apiService from '../services/api';

const QuickMatchAnalysis = () => {
  const { matchNumber } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [match, setMatch] = useState(null);
  const [redTeams, setRedTeams] = useState([]);
  const [blueTeams, setBlueTeams] = useState([]);
  const [matchNotes, setMatchNotes] = useState('');
  const [teamPerformance, setTeamPerformance] = useState({});
  
  // Load match data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get matches from local storage
        const matches = apiService.getFromLocalStorage('match_data') || [];
        const matchData = matches.find(m => m.match_number === parseInt(matchNumber));
        
        if (!matchData) {
          throw new Error(`Match ${matchNumber} not found`);
        }
        
        setMatch(matchData);
        
        // Get teams from local storage
        const teams = apiService.getFromLocalStorage('teams') || [];
        
        // Set red and blue teams with full team data
        if (matchData.red_alliance && matchData.red_alliance.length > 0) {
          const redTeamData = matchData.red_alliance.map(teamNumber => {
            return teams.find(t => t.team_number === teamNumber) || { team_number: teamNumber };
          });
          setRedTeams(redTeamData);
        }
        
        if (matchData.blue_alliance && matchData.blue_alliance.length > 0) {
          const blueTeamData = matchData.blue_alliance.map(teamNumber => {
            return teams.find(t => t.team_number === teamNumber) || { team_number: teamNumber };
          });
          setBlueTeams(blueTeamData);
        }
        
        // Initialize team performance data
        const initialPerformance = {};
        
        // Add red teams
        if (matchData.red_alliance) {
          matchData.red_alliance.forEach(teamNumber => {
            initialPerformance[teamNumber] = {
              auto_points: 0,
              teleop_points: 0,
              endgame_points: 0,
              defense_rating: 3, // 1-5 scale, 3 is average
              notes: ''
            };
          });
        }
        
        // Add blue teams
        if (matchData.blue_alliance) {
          matchData.blue_alliance.forEach(teamNumber => {
            initialPerformance[teamNumber] = {
              auto_points: 0,
              teleop_points: 0,
              endgame_points: 0,
              defense_rating: 3, // 1-5 scale, 3 is average
              notes: ''
            };
          });
        }
        
        // Load existing match analysis if available
        const existingAnalysis = apiService.getMatchAnalysis(matchNumber);
        if (existingAnalysis) {
          setMatchNotes(existingAnalysis.notes || '');
          setTeamPerformance({...initialPerformance, ...existingAnalysis.team_performance});
        } else {
          setTeamPerformance(initialPerformance);
        }
        
      } catch (error) {
        console.error('Error loading match data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [matchNumber]);
  
  // Update team performance data
  const updateTeamPerformance = (teamNumber, field, value) => {
    setTeamPerformance(prev => ({
      ...prev,
      [teamNumber]: {
        ...prev[teamNumber],
        [field]: value
      }
    }));
  };
  
  // Save match analysis
  const saveMatchAnalysis = () => {
    const analysisData = {
      match_number: parseInt(matchNumber),
      notes: matchNotes,
      team_performance: teamPerformance,
      timestamp: new Date().toISOString()
    };
    
    apiService.saveMatchAnalysis(matchNumber, analysisData);
    
    // Show success message or navigate back
    navigate('/dashboard');
  };
  
  // Calculate total points for a team
  const calculateTotalPoints = (teamNumber) => {
    const performance = teamPerformance[teamNumber];
    if (!performance) return 0;
    
    return (
      parseInt(performance.auto_points || 0) + 
      parseInt(performance.teleop_points || 0) + 
      parseInt(performance.endgame_points || 0)
    );
  };
  
  // Format match result
  const formatMatchResult = () => {
    if (!match || !match.score_breakdown) return 'No results available';
    
    const redScore = match.score_breakdown.red?.total_points || 0;
    const blueScore = match.score_breakdown.blue?.total_points || 0;
    
    if (redScore > blueScore) {
      return `Red wins (${redScore}-${blueScore})`;
    } else if (blueScore > redScore) {
      return `Blue wins (${blueScore}-${redScore})`;
    } else {
      return `Tie (${redScore}-${blueScore})`;
    }
  };
  
  // Render loading state
  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading match data...
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
          Quick Analysis: Match {match.match_number}
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        {/* Match Overview */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Match Overview
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Typography variant="body1">
                    <strong>Match Number:</strong> {match.match_number}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Match Type:</strong> {match.comp_level === 'qm' ? 'Qualification' : 
                                               match.comp_level === 'sf' ? 'Semifinal' : 
                                               match.comp_level === 'f' ? 'Final' : 'Other'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Typography variant="body1">
                    <strong>Red Alliance:</strong> {match.red_alliance?.join(', ') || 'N/A'}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Blue Alliance:</strong> {match.blue_alliance?.join(', ') || 'N/A'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Typography variant="body1">
                    <strong>Result:</strong> {formatMatchResult()}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Status:</strong> {
                      match.status === 'completed' ? (
                        <Chip 
                          size="small" 
                          label="Completed" 
                          color="success" 
                          icon={<CheckCircleIcon />} 
                        />
                      ) : (
                        <Chip 
                          size="small" 
                          label="Scheduled" 
                          color="primary" 
                        />
                      )
                    }
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Match Notes */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Match Notes
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <TextField
                fullWidth
                label="Match Analysis Notes"
                multiline
                rows={4}
                value={matchNotes}
                onChange={(e) => setMatchNotes(e.target.value)}
                variant="outlined"
                placeholder="Enter overall match analysis, strategy observations, etc."
              />
            </CardContent>
          </Card>
        </Grid>
        
        {/* Red Alliance Teams */}
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: '#ffebee' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Red Alliance
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {redTeams.map((team) => (
                <Accordion key={team.team_number} sx={{ mb: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>
                      Team {team.team_number} - {team.nickname || 'Unknown Team'}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Auto Points"
                          type="number"
                          value={teamPerformance[team.team_number]?.auto_points || 0}
                          onChange={(e) => updateTeamPerformance(team.team_number, 'auto_points', parseInt(e.target.value) || 0)}
                          variant="outlined"
                          size="small"
                          margin="normal"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Teleop Points"
                          type="number"
                          value={teamPerformance[team.team_number]?.teleop_points || 0}
                          onChange={(e) => updateTeamPerformance(team.team_number, 'teleop_points', parseInt(e.target.value) || 0)}
                          variant="outlined"
                          size="small"
                          margin="normal"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Endgame Points"
                          type="number"
                          value={teamPerformance[team.team_number]?.endgame_points || 0}
                          onChange={(e) => updateTeamPerformance(team.team_number, 'endgame_points', parseInt(e.target.value) || 0)}
                          variant="outlined"
                          size="small"
                          margin="normal"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth margin="normal" size="small">
                          <InputLabel id={`defense-rating-${team.team_number}`}>Defense Rating</InputLabel>
                          <Select
                            labelId={`defense-rating-${team.team_number}`}
                            value={teamPerformance[team.team_number]?.defense_rating || 3}
                            label="Defense Rating"
                            onChange={(e) => updateTeamPerformance(team.team_number, 'defense_rating', e.target.value)}
                          >
                            <MenuItem value={1}>1 - Poor</MenuItem>
                            <MenuItem value={2}>2 - Below Average</MenuItem>
                            <MenuItem value={3}>3 - Average</MenuItem>
                            <MenuItem value={4}>4 - Good</MenuItem>
                            <MenuItem value={5}>5 - Excellent</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Team Notes"
                          multiline
                          rows={2}
                          value={teamPerformance[team.team_number]?.notes || ''}
                          onChange={(e) => updateTeamPerformance(team.team_number, 'notes', e.target.value)}
                          variant="outlined"
                          size="small"
                          margin="normal"
                          placeholder="Notes about this team's performance"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2">
                          <strong>Total Points:</strong> {calculateTotalPoints(team.team_number)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              ))}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Blue Alliance Teams */}
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: '#e3f2fd' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Blue Alliance
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {blueTeams.map((team) => (
                <Accordion key={team.team_number} sx={{ mb: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>
                      Team {team.team_number} - {team.nickname || 'Unknown Team'}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Auto Points"
                          type="number"
                          value={teamPerformance[team.team_number]?.auto_points || 0}
                          onChange={(e) => updateTeamPerformance(team.team_number, 'auto_points', parseInt(e.target.value) || 0)}
                          variant="outlined"
                          size="small"
                          margin="normal"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Teleop Points"
                          type="number"
                          value={teamPerformance[team.team_number]?.teleop_points || 0}
                          onChange={(e) => updateTeamPerformance(team.team_number, 'teleop_points', parseInt(e.target.value) || 0)}
                          variant="outlined"
                          size="small"
                          margin="normal"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Endgame Points"
                          type="number"
                          value={teamPerformance[team.team_number]?.endgame_points || 0}
                          onChange={(e) => updateTeamPerformance(team.team_number, 'endgame_points', parseInt(e.target.value) || 0)}
                          variant="outlined"
                          size="small"
                          margin="normal"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth margin="normal" size="small">
                          <InputLabel id={`defense-rating-${team.team_number}`}>Defense Rating</InputLabel>
                          <Select
                            labelId={`defense-rating-${team.team_number}`}
                            value={teamPerformance[team.team_number]?.defense_rating || 3}
                            label="Defense Rating"
                            onChange={(e) => updateTeamPerformance(team.team_number, 'defense_rating', e.target.value)}
                          >
                            <MenuItem value={1}>1 - Poor</MenuItem>
                            <MenuItem value={2}>2 - Below Average</MenuItem>
                            <MenuItem value={3}>3 - Average</MenuItem>
                            <MenuItem value={4}>4 - Good</MenuItem>
                            <MenuItem value={5}>5 - Excellent</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Team Notes"
                          multiline
                          rows={2}
                          value={teamPerformance[team.team_number]?.notes || ''}
                          onChange={(e) => updateTeamPerformance(team.team_number, 'notes', e.target.value)}
                          variant="outlined"
                          size="small"
                          margin="normal"
                          placeholder="Notes about this team's performance"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2">
                          <strong>Total Points:</strong> {calculateTotalPoints(team.team_number)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              ))}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Save Button */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<SaveIcon />}
              onClick={saveMatchAnalysis}
            >
              Save Match Analysis
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default QuickMatchAnalysis; 