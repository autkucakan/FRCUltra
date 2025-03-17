import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Button,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Rating,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import WarningIcon from '@mui/icons-material/Warning';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import apiService from '../services/api';

// Custom tooltip for radar chart
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <Paper sx={{ p: 1, bgcolor: 'background.paper' }}>
        <Typography variant="body2">
          {payload[0].name}: {payload[0].value}
        </Typography>
      </Paper>
    );
  }
  return null;
};

const StrategyPlanning = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [comparisonTeam, setComparisonTeam] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teamData, setTeamData] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [strategyNotes, setStrategyNotes] = useState('');
  const [savedStrategies, setSavedStrategies] = useState({});
  
  // User-defined metrics
  const [capabilities, setCapabilities] = useState({
    shooting: 0,
    climbing: 0,
    defense: 0,
    speed: 0,
    control: 0,
    intake: 0
  });
  
  const [strengths, setStrengths] = useState([]);
  const [weaknesses, setWeaknesses] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [dialogValue, setDialogValue] = useState('');
  const [editIndex, setEditIndex] = useState(-1);
  
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        
        // Try to get data from local storage first
        const cachedTeams = apiService.getFromLocalStorage('teams');
        
        if (cachedTeams && cachedTeams.length > 0) {
          setTeams(cachedTeams);
        } else {
          // If no teams in local storage, show error
          setError('No teams found. Please import teams data first.');
        }
        
        // Load saved strategies from localStorage
        const savedStrategyData = apiService.getFromLocalStorage('team_strategies') || {};
        setSavedStrategies(savedStrategyData);
        
      } catch (err) {
        setError('Failed to load teams data. Please try again later.');
        console.error('Strategy planning fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTeams();
  }, []);
  
  // Load team strategy when selected
  useEffect(() => {
    if (selectedTeam && savedStrategies[selectedTeam]) {
      const teamStrategy = savedStrategies[selectedTeam];
      setStrategyNotes(teamStrategy.notes || '');
      setCapabilities(teamStrategy.capabilities || {
        shooting: 0,
        climbing: 0,
        defense: 0,
        speed: 0,
        control: 0,
        intake: 0
      });
      setStrengths(teamStrategy.strengths || []);
      setWeaknesses(teamStrategy.weaknesses || []);
      setRecommendations(teamStrategy.recommendations || []);
    } else {
      // Reset form if no saved strategy
      setStrategyNotes('');
      setCapabilities({
        shooting: 0,
        climbing: 0,
        defense: 0,
        speed: 0,
        control: 0,
        intake: 0
      });
      setStrengths([]);
      setWeaknesses([]);
      setRecommendations([]);
    }
  }, [selectedTeam, savedStrategies]);
  
  const handleTeamChange = (event) => {
    setSelectedTeam(event.target.value);
  };
  
  const handleComparisonTeamChange = (event) => {
    setComparisonTeam(event.target.value);
  };
  
  const handleStrategyNotesChange = (event) => {
    setStrategyNotes(event.target.value);
  };
  
  const handleCapabilityChange = (capability, value) => {
    setCapabilities({
      ...capabilities,
      [capability]: value
    });
  };
  
  // Dialog handlers
  const openDialog = (type, index = -1, value = '') => {
    setDialogType(type);
    setDialogOpen(true);
    setEditIndex(index);
    setDialogValue(value);
  };
  
  const closeDialog = () => {
    setDialogOpen(false);
    setDialogValue('');
    setEditIndex(-1);
  };
  
  const handleDialogValueChange = (event) => {
    setDialogValue(event.target.value);
  };
  
  const handleDialogSave = () => {
    if (!dialogValue.trim()) {
      closeDialog();
      return;
    }
    
    switch (dialogType) {
      case 'strength':
        if (editIndex >= 0) {
          const updatedStrengths = [...strengths];
          updatedStrengths[editIndex] = dialogValue;
          setStrengths(updatedStrengths);
        } else {
          setStrengths([...strengths, dialogValue]);
        }
        break;
      case 'weakness':
        if (editIndex >= 0) {
          const updatedWeaknesses = [...weaknesses];
          updatedWeaknesses[editIndex] = dialogValue;
          setWeaknesses(updatedWeaknesses);
        } else {
          setWeaknesses([...weaknesses, dialogValue]);
        }
        break;
      case 'recommendation':
        if (editIndex >= 0) {
          const updatedRecommendations = [...recommendations];
          updatedRecommendations[editIndex] = dialogValue;
          setRecommendations(updatedRecommendations);
        } else {
          setRecommendations([...recommendations, dialogValue]);
        }
        break;
      default:
        break;
    }
    
    closeDialog();
  };
  
  const handleDelete = (type, index) => {
    switch (type) {
      case 'strength':
        setStrengths(strengths.filter((_, i) => i !== index));
        break;
      case 'weakness':
        setWeaknesses(weaknesses.filter((_, i) => i !== index));
        break;
      case 'recommendation':
        setRecommendations(recommendations.filter((_, i) => i !== index));
        break;
      default:
        break;
    }
  };
  
  const saveStrategy = () => {
    if (!selectedTeam) {
      alert('Please select a team first');
      return;
    }
    
    const updatedStrategies = { ...savedStrategies };
    
    updatedStrategies[selectedTeam] = {
      notes: strategyNotes,
      capabilities: capabilities,
      strengths: strengths,
      weaknesses: weaknesses,
      recommendations: recommendations,
      lastUpdated: new Date().toISOString()
    };
    
    setSavedStrategies(updatedStrategies);
    apiService.saveToLocalStorage('team_strategies', updatedStrategies);
    
    alert('Strategy saved successfully!');
  };
  
  // Convert capabilities object to array for radar chart
  const getRadarData = (capabilitiesObj) => {
    return Object.keys(capabilitiesObj).map(key => ({
      subject: key.charAt(0).toUpperCase() + key.slice(1),
      A: capabilitiesObj[key],
      fullMark: 10
    }));
  };
  
  // Get comparison radar data
  const getComparisonRadarData = () => {
    const teamData = getRadarData(capabilities);
    
    if (comparisonTeam && savedStrategies[comparisonTeam]) {
      const comparisonCapabilities = savedStrategies[comparisonTeam].capabilities;
      
      return teamData.map((item, index) => ({
        ...item,
        B: comparisonCapabilities[Object.keys(capabilities)[index]] || 0
      }));
    }
    
    return teamData;
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error && !teams.length) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate(-1)} 
          sx={{ mt: 2 }}
        >
          Back to Dashboard
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
          Strategy Planning
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        {/* Team Selection */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Team Selection
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="team-select-label">Select Team</InputLabel>
                <Select
                  labelId="team-select-label"
                  id="team-select"
                  value={selectedTeam}
                  label="Select Team"
                  onChange={handleTeamChange}
                >
                  <MenuItem value="">
                    <em>Select a team</em>
                  </MenuItem>
                  {teams.map((team) => (
                    <MenuItem key={team.team_number} value={team.team_number.toString()}>
                      Team {team.team_number} - {team.nickname}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth>
                <InputLabel id="comparison-team-select-label">Compare With</InputLabel>
                <Select
                  labelId="comparison-team-select-label"
                  id="comparison-team-select"
                  value={comparisonTeam}
                  label="Compare With"
                  onChange={handleComparisonTeamChange}
                  disabled={!selectedTeam}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {teams
                    .filter(team => team.team_number.toString() !== selectedTeam)
                    .map((team) => (
                      <MenuItem key={team.team_number} value={team.team_number.toString()}>
                        Team {team.team_number} - {team.nickname}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </CardContent>
          </Card>
          
          {selectedTeam && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Strategy Notes
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  label="Notes"
                  variant="outlined"
                  value={strategyNotes}
                  onChange={handleStrategyNotesChange}
                  sx={{ mb: 2 }}
                />
                
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={<SaveIcon />}
                  onClick={saveStrategy}
                  fullWidth
                >
                  Save Strategy
                </Button>
              </CardContent>
            </Card>
          )}
        </Grid>
        
        {/* Main Content Area */}
        <Grid item xs={12} md={8}>
          {!selectedTeam ? (
            <Alert severity="info">
              Please select a team to view and edit strategy information.
            </Alert>
          ) : (
            <>
              {/* Capability Radar */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Capability Radar
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart outerRadius={90} data={getComparisonRadarData()}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" />
                        <PolarRadiusAxis angle={30} domain={[0, 10]} />
                        <Radar
                          name={`Team ${selectedTeam}`}
                          dataKey="A"
                          stroke="#8884d8"
                          fill="#8884d8"
                          fillOpacity={0.6}
                        />
                        {comparisonTeam && (
                          <Radar
                            name={`Team ${comparisonTeam}`}
                            dataKey="B"
                            stroke="#82ca9d"
                            fill="#82ca9d"
                            fillOpacity={0.6}
                          />
                        )}
                        <Tooltip content={<CustomTooltip />} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </Box>
                  
                  <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                    Adjust Capabilities
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {Object.keys(capabilities).map((capability) => (
                      <Grid item xs={12} sm={6} key={capability}>
                        <Typography id={`${capability}-slider`} gutterBottom>
                          {capability.charAt(0).toUpperCase() + capability.slice(1)}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Slider
                            value={capabilities[capability]}
                            onChange={(e, value) => handleCapabilityChange(capability, value)}
                            aria-labelledby={`${capability}-slider`}
                            valueLabelDisplay="auto"
                            step={1}
                            marks
                            min={0}
                            max={10}
                            sx={{ flexGrow: 1, mr: 2 }}
                          />
                          <Typography variant="body2" sx={{ minWidth: 30 }}>
                            {capabilities[capability]}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
              
              {/* Strengths & Weaknesses */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6">
                          Strengths
                        </Typography>
                        <IconButton 
                          color="primary" 
                          size="small"
                          onClick={() => openDialog('strength')}
                        >
                          <AddIcon />
                        </IconButton>
                      </Box>
                      <Divider sx={{ mb: 2 }} />
                      
                      {strengths.length > 0 ? (
                        <List>
                          {strengths.map((strength, index) => (
                            <ListItem 
                              key={index}
                              secondaryAction={
                                <Box>
                                  <IconButton 
                                    edge="end" 
                                    aria-label="edit"
                                    onClick={() => openDialog('strength', index, strength)}
                                    size="small"
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton 
                                    edge="end" 
                                    aria-label="delete"
                                    onClick={() => handleDelete('strength', index)}
                                    size="small"
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              }
                            >
                              <ListItemText primary={strength} />
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                          No strengths added yet. Click the + button to add.
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6">
                          Weaknesses
                        </Typography>
                        <IconButton 
                          color="primary" 
                          size="small"
                          onClick={() => openDialog('weakness')}
                        >
                          <AddIcon />
                        </IconButton>
                      </Box>
                      <Divider sx={{ mb: 2 }} />
                      
                      {weaknesses.length > 0 ? (
                        <List>
                          {weaknesses.map((weakness, index) => (
                            <ListItem 
                              key={index}
                              secondaryAction={
                                <Box>
                                  <IconButton 
                                    edge="end" 
                                    aria-label="edit"
                                    onClick={() => openDialog('weakness', index, weakness)}
                                    size="small"
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton 
                                    edge="end" 
                                    aria-label="delete"
                                    onClick={() => handleDelete('weakness', index)}
                                    size="small"
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              }
                            >
                              <ListItemText primary={weakness} />
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                          No weaknesses added yet. Click the + button to add.
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              {/* Recommended Strategies */}
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6">
                      Recommended Strategies
                    </Typography>
                    <IconButton 
                      color="primary" 
                      size="small"
                      onClick={() => openDialog('recommendation')}
                    >
                      <AddIcon />
                    </IconButton>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  
                  {recommendations.length > 0 ? (
                    <List>
                      {recommendations.map((recommendation, index) => (
                        <ListItem 
                          key={index}
                          secondaryAction={
                            <Box>
                              <IconButton 
                                edge="end" 
                                aria-label="edit"
                                onClick={() => openDialog('recommendation', index, recommendation)}
                                size="small"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton 
                                edge="end" 
                                aria-label="delete"
                                onClick={() => handleDelete('recommendation', index)}
                                size="small"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          }
                        >
                          <ListItemText primary={recommendation} />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                      No recommendations added yet. Click the + button to add.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </Grid>
      </Grid>
      
      {/* Dialog for adding/editing items */}
      <Dialog open={dialogOpen} onClose={closeDialog}>
        <DialogTitle>
          {editIndex >= 0 ? 'Edit' : 'Add'} {dialogType.charAt(0).toUpperCase() + dialogType.slice(1)}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="item-text"
            label={dialogType.charAt(0).toUpperCase() + dialogType.slice(1)}
            type="text"
            fullWidth
            variant="outlined"
            value={dialogValue}
            onChange={handleDialogValueChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button onClick={handleDialogSave} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StrategyPlanning; 