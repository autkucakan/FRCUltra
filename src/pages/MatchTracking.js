import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Button,
  Divider,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import SaveIcon from '@mui/icons-material/Save';
import apiService from '../services/api';

const MatchTracking = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { matchNumber: urlMatchNumber } = useParams();
  const queryParams = new URLSearchParams(location.search);
  const searchMatchNumber = queryParams.get('match');
  
  const matchNumberToUse = urlMatchNumber || searchMatchNumber;
  
  const [currentMatch, setCurrentMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedAlliance, setSelectedAlliance] = useState('red');
  const [tabValue, setTabValue] = useState(0);
  const [availableMatches, setAvailableMatches] = useState([]);
  
  // State for Quick Scoring
  const [redScore, setRedScore] = useState({
    auto: {
      leave: false,
      coralL1: 0,
      coralL2: 0,
      coralL3: 0,
      coralL4: 0,
      processor: 0,
      net: 0
    },
    teleop: {
      coralL1: 0,
      coralL2: 0,
      coralL3: 0,
      coralL4: 0,
      processor: 0,
      net: 0
    },
    endgame: {
      bargePark: false,
      shallowCage: false,
      deepCage: false
    },
    total: 0
  });
  
  const [blueScore, setBlueScore] = useState({
    auto: {
      leave: false,
      coralL1: 0,
      coralL2: 0,
      coralL3: 0,
      coralL4: 0,
      processor: 0,
      net: 0
    },
    teleop: {
      coralL1: 0,
      coralL2: 0,
      coralL3: 0,
      coralL4: 0,
      processor: 0,
      net: 0
    },
    endgame: {
      bargePark: false,
      shallowCage: false,
      deepCage: false
    },
    total: 0
  });

  // Calculate total score for an alliance
  const calculateTotal = (alliance) => {
    const score = alliance === 'red' ? redScore : blueScore;
    let total = 0;

    // Auto scoring
    if (score.auto.leave) total += 3;
    total += score.auto.coralL1 * 3;
    total += score.auto.coralL2 * 4;
    total += score.auto.coralL3 * 6;
    total += score.auto.coralL4 * 7;
    total += score.auto.processor * 6;
    total += score.auto.net * 4;

    // Teleop scoring
    total += score.teleop.coralL1 * 2;
    total += score.teleop.coralL2 * 3;
    total += score.teleop.coralL3 * 4;
    total += score.teleop.coralL4 * 5;
    total += score.teleop.processor * 6;
    total += score.teleop.net * 4;

    // Endgame scoring
    if (score.endgame.bargePark) total += 2;
    if (score.endgame.shallowCage) total += 6;
    if (score.endgame.deepCage) total += 12;

    return total;
  };

  // Update score and recalculate total
  const updateScore = (alliance, phase, field, value) => {
    if (alliance === 'red') {
      setRedScore(prev => {
        const newScore = {
          ...prev,
          [phase]: {
            ...prev[phase],
            [field]: value
          }
        };
        newScore.total = calculateTotal('red');
        return newScore;
      });
    } else {
      setBlueScore(prev => {
        const newScore = {
          ...prev,
          [phase]: {
            ...prev[phase],
            [field]: value
          }
        };
        newScore.total = calculateTotal('blue');
        return newScore;
      });
    }
  };

  // Reset scores for an alliance
  const resetScore = (alliance) => {
    const initialState = {
      auto: {
        leave: false,
        coralL1: 0,
        coralL2: 0,
        coralL3: 0,
        coralL4: 0,
        processor: 0,
        net: 0
      },
      teleop: {
        coralL1: 0,
        coralL2: 0,
        coralL3: 0,
        coralL4: 0,
        processor: 0,
        net: 0
      },
      endgame: {
        bargePark: false,
        shallowCage: false,
        deepCage: false
      },
      total: 0
    };

    if (alliance === 'red') {
      setRedScore(initialState);
    } else {
      setBlueScore(initialState);
    }
  };

  // Save match scores
  const saveMatchScores = () => {
    if (!currentMatch) {
      alert('Please select a match first');
      return;
    }

    // Get existing match data from local storage
    const matches = apiService.getFromLocalStorage('match_data') || [];
    const matchIndex = matches.findIndex(m => m.match_number === currentMatch.match_number);

    if (matchIndex === -1) {
      alert('Match not found');
      return;
    }

    // Update match data
    matches[matchIndex] = {
      ...matches[matchIndex],
      status: 'completed',
      score_breakdown: {
        red: { total_points: redScore.total },
        blue: { total_points: blueScore.total }
      },
      winning_alliance: redScore.total > blueScore.total ? 'red' : 
                       blueScore.total > redScore.total ? 'blue' : 'tie'
    };

    // Save updated matches back to local storage
    apiService.saveToLocalStorage('match_data', matches);

    // Save quick scores to local storage
    const quickScores = apiService.getFromLocalStorage('quick_scores') || {};
    quickScores[currentMatch.match_number] = {
      red: redScore,
      blue: blueScore
    };
    apiService.saveToLocalStorage('quick_scores', quickScores);

    alert('Match scores saved successfully!');
  };

  useEffect(() => {
    const fetchMatchData = async () => {
      try {
        setLoading(true);
        
        // Get match data from local storage
        const cachedMatchData = apiService.getFromLocalStorage('match_data') || [];
        setAvailableMatches(cachedMatchData);
        
        // If match number is provided, find that match
        if (matchNumberToUse) {
          const match = cachedMatchData.find(m => m.match_number.toString() === matchNumberToUse.toString());
          if (match) {
            setCurrentMatch(match);
            
            // Load saved quick scores for this match
            const quickScores = apiService.getFromLocalStorage('quick_scores') || {};
            if (quickScores[match.match_number]) {
              setRedScore(quickScores[match.match_number].red);
              setBlueScore(quickScores[match.match_number].blue);
            } else {
              // Reset scores if no saved data exists
              resetScore('red');
              resetScore('blue');
            }
          } else {
            setError(`Match ${matchNumberToUse} not found`);
          }
        } else if (cachedMatchData.length > 0) {
          // Otherwise, use the first match
          setCurrentMatch(cachedMatchData[0]);
          
          // Load saved quick scores for the first match
          const quickScores = apiService.getFromLocalStorage('quick_scores') || {};
          if (quickScores[cachedMatchData[0].match_number]) {
            setRedScore(quickScores[cachedMatchData[0].match_number].red);
            setBlueScore(quickScores[cachedMatchData[0].match_number].blue);
          }
        }
        
      } catch (err) {
        setError('Failed to load match data. Please try again later.');
        console.error('Match tracking fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMatchData();
  }, [matchNumberToUse]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleAllianceChange = (event, newAlliance) => {
    if (newAlliance !== null) {
      setSelectedAlliance(newAlliance);
      // Reset selected team when alliance changes
      setSelectedTeam('');
    }
  };

  const handleTeamChange = (event) => {
    setSelectedTeam(event.target.value);
  };

  const handleNotesChange = (event) => {
    // Implementation for handling notes change
  };

  const handleScoutingDataChange = (phase, field, value) => {
    // Implementation for handling scouting data change
  };

  const incrementCounter = (phase, field) => {
    // Implementation for incrementing a counter
  };

  const decrementCounter = (phase, field) => {
    // Implementation for decrementing a counter
  };

  const toggleBoolean = (phase, field) => {
    // Implementation for toggling a boolean
  };

  const saveScoutingData = async () => {
    // Implementation for saving scouting data
  };

  const handleMatchChange = (event) => {
    const newMatchNumber = event.target.value;
    
    // Load saved quick scores for the new match before navigating
    const quickScores = apiService.getFromLocalStorage('quick_scores') || {};
    if (quickScores[newMatchNumber]) {
      setRedScore(quickScores[newMatchNumber].red);
      setBlueScore(quickScores[newMatchNumber].blue);
    } else {
      resetScore('red');
      resetScore('blue');
    }
    
    navigate(`/match-tracking/${newMatchNumber}`);
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading match data...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/match-tracking')} 
          sx={{ mt: 2 }}
        >
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  if (!currentMatch && availableMatches.length === 0) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="info">
          No matches available. Please add matches using the Add Match page.
        </Alert>
        <Button 
          variant="contained"
          onClick={() => navigate('/add-match')} 
          sx={{ mt: 2 }}
        >
          Add Match
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Match {currentMatch?.match_number} Tracking
        </Typography>
      </Box>
      
      {/* Match Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <FormControl fullWidth>
            <InputLabel id="match-select-label">Select Match</InputLabel>
            <Select
              labelId="match-select-label"
              value={currentMatch?.match_number || ''}
              label="Select Match"
              onChange={handleMatchChange}
            >
              {availableMatches.map((match) => (
                <MenuItem key={match.match_number} value={match.match_number}>
                  Match {match.match_number}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </CardContent>
      </Card>
      
      {/* Match Info Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <IconButton 
              color="primary" 
              onClick={() => navigate('/dashboard')}
              sx={{ mr: 2 }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5" component="h1">
              Match {currentMatch?.match_number}
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Competition Level
            </Typography>
            <Typography variant="body1">
              {currentMatch?.comp_level === 'pr' ? 'Practice' : 
               currentMatch?.comp_level === 'qm' ? 'Qualification' : 
               currentMatch?.comp_level === 'po' ? 'Playoff' : currentMatch?.comp_level}
            </Typography>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Red Alliance
            </Typography>
            {currentMatch?.red_alliance.map((teamNumber) => (
              <Chip 
                key={teamNumber} 
                label={`Team ${teamNumber}`} 
                color="error" 
                variant="outlined"
                sx={{ mr: 1, mb: 1 }}
              />
            ))}
          </Box>
          
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Blue Alliance
            </Typography>
            {currentMatch?.blue_alliance.map((teamNumber) => (
              <Chip 
                key={teamNumber} 
                label={`Team ${teamNumber}`} 
                color="primary" 
                variant="outlined"
                sx={{ mr: 1, mb: 1 }}
              />
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Quick Scoring Card */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Quick Scoring
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={saveMatchScores}
            >
              Save Scores
            </Button>
          </Box>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={3}>
            {/* Red Alliance Scoring */}
            <Grid item xs={12} md={6}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  border: '1px solid', 
                  borderColor: 'error.light',
                  borderRadius: 2,
                  bgcolor: 'rgba(255, 0, 0, 0.05)'
                }}
              >
                <Typography variant="subtitle1" color="error" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Red Alliance
                </Typography>
                
                {/* Autonomous Scoring */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                    AUTONOMOUS
                  </Typography>
                  
                  <Grid container spacing={1}>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Checkbox 
                            checked={redScore.auto.leave}
                            onChange={(e) => updateScore('red', 'auto', 'leave', e.target.checked)}
                          />
                        }
                        label="Leave (+3)"
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Typography variant="body2" gutterBottom>
                        Coral Scoring:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                        {[
                          { field: 'coralL1', label: 'L1', points: 3 },
                          { field: 'coralL2', label: 'L2', points: 4 },
                          { field: 'coralL3', label: 'L3', points: 6 },
                          { field: 'coralL4', label: 'L4', points: 7 }
                        ].map((level) => (
                          <Box key={level.field} sx={{ display: 'flex', alignItems: 'center' }}>
                            <IconButton 
                              size="small"
                              onClick={() => {
                                if (redScore.auto[level.field] > 0) {
                                  updateScore('red', 'auto', level.field, redScore.auto[level.field] - 1);
                                }
                              }}
                            >
                              <RemoveIcon />
                            </IconButton>
                            <Chip 
                              label={`${level.label} (${redScore.auto[level.field]}) +${level.points}`}
                              variant="outlined"
                              size="small"
                            />
                            <IconButton 
                              size="small"
                              onClick={() => updateScore('red', 'auto', level.field, redScore.auto[level.field] + 1)}
                            >
                              <AddIcon />
                            </IconButton>
                          </Box>
                        ))}
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Typography variant="body2" gutterBottom>
                        Algae Scoring:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {[
                          { field: 'processor', label: 'Processor', points: 6 },
                          { field: 'net', label: 'Net', points: 4 }
                        ].map((type) => (
                          <Box key={type.field} sx={{ display: 'flex', alignItems: 'center' }}>
                            <IconButton 
                              size="small"
                              onClick={() => {
                                if (redScore.auto[type.field] > 0) {
                                  updateScore('red', 'auto', type.field, redScore.auto[type.field] - 1);
                                }
                              }}
                            >
                              <RemoveIcon />
                            </IconButton>
                            <Chip 
                              label={`${type.label} (${redScore.auto[type.field]}) +${type.points}`}
                              variant="outlined"
                              size="small"
                            />
                            <IconButton 
                              size="small"
                              onClick={() => updateScore('red', 'auto', type.field, redScore.auto[type.field] + 1)}
                            >
                              <AddIcon />
                            </IconButton>
                          </Box>
                        ))}
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
                
                {/* Teleop Scoring */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                    TELE-OP
                  </Typography>
                  
                  <Grid container spacing={1}>
                    <Grid item xs={12}>
                      <Typography variant="body2" gutterBottom>
                        Coral Scoring:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                        {[
                          { field: 'coralL1', label: 'L1', points: 2 },
                          { field: 'coralL2', label: 'L2', points: 3 },
                          { field: 'coralL3', label: 'L3', points: 4 },
                          { field: 'coralL4', label: 'L4', points: 5 }
                        ].map((level) => (
                          <Box key={level.field} sx={{ display: 'flex', alignItems: 'center' }}>
                            <IconButton 
                              size="small"
                              onClick={() => {
                                if (redScore.teleop[level.field] > 0) {
                                  updateScore('red', 'teleop', level.field, redScore.teleop[level.field] - 1);
                                }
                              }}
                            >
                              <RemoveIcon />
                            </IconButton>
                            <Chip 
                              label={`${level.label} (${redScore.teleop[level.field]}) +${level.points}`}
                              variant="outlined"
                              size="small"
                            />
                            <IconButton 
                              size="small"
                              onClick={() => updateScore('red', 'teleop', level.field, redScore.teleop[level.field] + 1)}
                            >
                              <AddIcon />
                            </IconButton>
                          </Box>
                        ))}
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Typography variant="body2" gutterBottom>
                        Algae Scoring:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {[
                          { field: 'processor', label: 'Processor', points: 6 },
                          { field: 'net', label: 'Net', points: 4 }
                        ].map((type) => (
                          <Box key={type.field} sx={{ display: 'flex', alignItems: 'center' }}>
                            <IconButton 
                              size="small"
                              onClick={() => {
                                if (redScore.teleop[type.field] > 0) {
                                  updateScore('red', 'teleop', type.field, redScore.teleop[type.field] - 1);
                                }
                              }}
                            >
                              <RemoveIcon />
                            </IconButton>
                            <Chip 
                              label={`${type.label} (${redScore.teleop[type.field]}) +${type.points}`}
                              variant="outlined"
                              size="small"
                            />
                            <IconButton 
                              size="small"
                              onClick={() => updateScore('red', 'teleop', type.field, redScore.teleop[type.field] + 1)}
                            >
                              <AddIcon />
                            </IconButton>
                          </Box>
                        ))}
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
                
                {/* Endgame Scoring */}
                <Box>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                    ENDGAME
                  </Typography>
                  
                  <Grid container spacing={1}>
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {[
                          { field: 'bargePark', label: 'Barge Park', points: 2 },
                          { field: 'shallowCage', label: 'Shallow Cage', points: 6 },
                          { field: 'deepCage', label: 'Deep Cage', points: 12 }
                        ].map((action) => (
                          <FormControlLabel
                            key={action.field}
                            control={
                              <Checkbox 
                                checked={redScore.endgame[action.field]}
                                onChange={(e) => updateScore('red', 'endgame', action.field, e.target.checked)}
                              />
                            }
                            label={`${action.label} (+${action.points})`}
                          />
                        ))}
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
                
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">
                    Total: {redScore.total}
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="error" 
                    size="small"
                    onClick={() => resetScore('red')}
                  >
                    Reset
                  </Button>
                </Box>
              </Paper>
            </Grid>
            
            {/* Blue Alliance Scoring */}
            <Grid item xs={12} md={6}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  border: '1px solid', 
                  borderColor: 'primary.light',
                  borderRadius: 2,
                  bgcolor: 'rgba(0, 0, 255, 0.05)'
                }}
              >
                <Typography variant="subtitle1" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Blue Alliance
                </Typography>
                
                {/* Autonomous Scoring */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                    AUTONOMOUS
                  </Typography>
                  
                  <Grid container spacing={1}>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Checkbox 
                            checked={blueScore.auto.leave}
                            onChange={(e) => updateScore('blue', 'auto', 'leave', e.target.checked)}
                          />
                        }
                        label="Leave (+3)"
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Typography variant="body2" gutterBottom>
                        Coral Scoring:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                        {[
                          { field: 'coralL1', label: 'L1', points: 3 },
                          { field: 'coralL2', label: 'L2', points: 4 },
                          { field: 'coralL3', label: 'L3', points: 6 },
                          { field: 'coralL4', label: 'L4', points: 7 }
                        ].map((level) => (
                          <Box key={level.field} sx={{ display: 'flex', alignItems: 'center' }}>
                            <IconButton 
                              size="small"
                              onClick={() => {
                                if (blueScore.auto[level.field] > 0) {
                                  updateScore('blue', 'auto', level.field, blueScore.auto[level.field] - 1);
                                }
                              }}
                            >
                              <RemoveIcon />
                            </IconButton>
                            <Chip 
                              label={`${level.label} (${blueScore.auto[level.field]}) +${level.points}`}
                              variant="outlined"
                              size="small"
                            />
                            <IconButton 
                              size="small"
                              onClick={() => updateScore('blue', 'auto', level.field, blueScore.auto[level.field] + 1)}
                            >
                              <AddIcon />
                            </IconButton>
                          </Box>
                        ))}
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Typography variant="body2" gutterBottom>
                        Algae Scoring:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {[
                          { field: 'processor', label: 'Processor', points: 6 },
                          { field: 'net', label: 'Net', points: 4 }
                        ].map((type) => (
                          <Box key={type.field} sx={{ display: 'flex', alignItems: 'center' }}>
                            <IconButton 
                              size="small"
                              onClick={() => {
                                if (blueScore.auto[type.field] > 0) {
                                  updateScore('blue', 'auto', type.field, blueScore.auto[type.field] - 1);
                                }
                              }}
                            >
                              <RemoveIcon />
                            </IconButton>
                            <Chip 
                              label={`${type.label} (${blueScore.auto[type.field]}) +${type.points}`}
                              variant="outlined"
                              size="small"
                            />
                            <IconButton 
                              size="small"
                              onClick={() => updateScore('blue', 'auto', type.field, blueScore.auto[type.field] + 1)}
                            >
                              <AddIcon />
                            </IconButton>
                          </Box>
                        ))}
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
                
                {/* Teleop Scoring */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                    TELE-OP
                  </Typography>
                  
                  <Grid container spacing={1}>
                    <Grid item xs={12}>
                      <Typography variant="body2" gutterBottom>
                        Coral Scoring:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                        {[
                          { field: 'coralL1', label: 'L1', points: 2 },
                          { field: 'coralL2', label: 'L2', points: 3 },
                          { field: 'coralL3', label: 'L3', points: 4 },
                          { field: 'coralL4', label: 'L4', points: 5 }
                        ].map((level) => (
                          <Box key={level.field} sx={{ display: 'flex', alignItems: 'center' }}>
                            <IconButton 
                              size="small"
                              onClick={() => {
                                if (blueScore.teleop[level.field] > 0) {
                                  updateScore('blue', 'teleop', level.field, blueScore.teleop[level.field] - 1);
                                }
                              }}
                            >
                              <RemoveIcon />
                            </IconButton>
                            <Chip 
                              label={`${level.label} (${blueScore.teleop[level.field]}) +${level.points}`}
                              variant="outlined"
                              size="small"
                            />
                            <IconButton 
                              size="small"
                              onClick={() => updateScore('blue', 'teleop', level.field, blueScore.teleop[level.field] + 1)}
                            >
                              <AddIcon />
                            </IconButton>
                          </Box>
                        ))}
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Typography variant="body2" gutterBottom>
                        Algae Scoring:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {[
                          { field: 'processor', label: 'Processor', points: 6 },
                          { field: 'net', label: 'Net', points: 4 }
                        ].map((type) => (
                          <Box key={type.field} sx={{ display: 'flex', alignItems: 'center' }}>
                            <IconButton 
                              size="small"
                              onClick={() => {
                                if (blueScore.teleop[type.field] > 0) {
                                  updateScore('blue', 'teleop', type.field, blueScore.teleop[type.field] - 1);
                                }
                              }}
                            >
                              <RemoveIcon />
                            </IconButton>
                            <Chip 
                              label={`${type.label} (${blueScore.teleop[type.field]}) +${type.points}`}
                              variant="outlined"
                              size="small"
                            />
                            <IconButton 
                              size="small"
                              onClick={() => updateScore('blue', 'teleop', type.field, blueScore.teleop[type.field] + 1)}
                            >
                              <AddIcon />
                            </IconButton>
                          </Box>
                        ))}
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
                
                {/* Endgame Scoring */}
                <Box>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                    ENDGAME
                  </Typography>
                  
                  <Grid container spacing={1}>
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {[
                          { field: 'bargePark', label: 'Barge Park', points: 2 },
                          { field: 'shallowCage', label: 'Shallow Cage', points: 6 },
                          { field: 'deepCage', label: 'Deep Cage', points: 12 }
                        ].map((action) => (
                          <FormControlLabel
                            key={action.field}
                            control={
                              <Checkbox 
                                checked={blueScore.endgame[action.field]}
                                onChange={(e) => updateScore('blue', 'endgame', action.field, e.target.checked)}
                              />
                            }
                            label={`${action.label} (+${action.points})`}
                          />
                        ))}
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
                
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">
                    Total: {blueScore.total}
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    size="small"
                    onClick={() => resetScore('blue')}
                  >
                    Reset
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Container>
  );
};

export default MatchTracking; 