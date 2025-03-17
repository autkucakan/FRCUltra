import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Slider,
  ToggleButtonGroup,
  ToggleButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import apiService from '../services/api';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1 }}>
        <Typography variant="body2">
          {payload[0].name}: {payload[0].value}
        </Typography>
      </Box>
    );
  }
  return null;
};

const TeamStrategy = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  
  // Team selection state
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [comparisonTeam, setComparisonTeam] = useState('');
  
  // Heatmap state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [heatmapMode, setHeatmapMode] = useState('auto');
  const [opacity, setOpacity] = useState(70);
  const [fieldImage, setFieldImage] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState([]);
  const [savedHeatmaps, setSavedHeatmaps] = useState({});
  
  // Strategy state
  const [strategyData, setStrategyData] = useState({
    strengths: [],
    weaknesses: [],
    strategies: [],
    capabilities: {
      scoring: 3,
      defense: 3,
      speed: 3,
      maneuverability: 3,
      consistency: 3
    }
  });
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [dialogValue, setDialogValue] = useState('');
  const [dialogIndex, setDialogIndex] = useState(-1);
  
  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get teams from local storage
        const cachedTeams = apiService.getFromLocalStorage('teams') || [];
        setTeams(cachedTeams);
        
        // Load saved heatmaps from localStorage
        const savedHeatmapData = apiService.getFromLocalStorage('team_heatmaps') || {};
        setSavedHeatmaps(savedHeatmapData);
        
        // Load field image
        const img = new Image();
        img.src = process.env.PUBLIC_URL + '/field2024.jpg';
        img.onload = () => {
          setFieldImage(img);
        };
        img.onerror = (error) => {
          console.error('Error loading field image:', error);
          setError('Failed to load field image. Please check if the image exists in the public folder.');
        };
        
        if (selectedTeam) {
          const savedStrategy = apiService.getFromLocalStorage(`strategy_${selectedTeam}`);
          if (savedStrategy) {
            setStrategyData(savedStrategy);
          } else {
            // Reset to default if no saved data
            setStrategyData({
              strengths: [],
              weaknesses: [],
              strategies: [],
              capabilities: {
                scoring: 3,
                defense: 3,
                speed: 3,
                maneuverability: 3,
                consistency: 3
              }
            });
          }
        }
      } catch (err) {
        setError('Failed to load data. Please try again later.');
        console.error('Data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [selectedTeam]);
  
  // Load heatmap data when team or mode changes
  useEffect(() => {
    if (selectedTeam && savedHeatmaps[selectedTeam]) {
      const teamHeatmaps = savedHeatmaps[selectedTeam];
      if (teamHeatmaps[heatmapMode]) {
        setPoints(teamHeatmaps[heatmapMode]);
      } else {
        setPoints([]);
      }
    } else {
      setPoints([]);
    }
  }, [selectedTeam, heatmapMode, savedHeatmaps]);
  
  // Draw heatmap
  const drawHeatmap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !fieldImage) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw field image
    ctx.drawImage(fieldImage, 0, 0, width, height);
    
    // Draw heatmap points
    const alpha = opacity / 100;
    points.forEach(point => {
      const gradient = ctx.createRadialGradient(
        point.x, point.y, 0,
        point.x, point.y, 30
      );
      
      gradient.addColorStop(0, `rgba(255, 0, 0, ${alpha})`);
      gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 30, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [points, opacity, fieldImage]);
  
  // Update canvas when points, opacity or field image changes
  useEffect(() => {
    drawHeatmap();
  }, [drawHeatmap]);
  
  // Event handlers
  const handleTeamChange = (event) => {
    const teamNumber = event.target.value;
    setSelectedTeam(teamNumber);
  };
  
  const handleComparisonTeamChange = (event) => {
    setComparisonTeam(event.target.value);
  };
  
  const handleHeatmapModeChange = (event, newMode) => {
    if (newMode !== null) {
      // Save current points before changing mode
      if (selectedTeam && points.length > 0) {
        saveHeatmap(heatmapMode, points);
      }
      
      // Set new mode
      setHeatmapMode(newMode);
      
      // Load points for new mode
      if (selectedTeam && savedHeatmaps[selectedTeam] && savedHeatmaps[selectedTeam][newMode]) {
        setPoints(savedHeatmaps[selectedTeam][newMode]);
      } else {
        setPoints([]);
      }
    }
  };
  
  const handleOpacityChange = (event, newValue) => {
    setOpacity(newValue);
  };
  
  const handleCanvasMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    setIsDrawing(true);
    setPoints(prev => [...prev, { x, y }]);
  };
  
  const handleCanvasMouseMove = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    setPoints(prev => [...prev, { x, y }]);
  };
  
  const handleCanvasMouseUp = () => {
    if (isDrawing) {
      saveHeatmap(heatmapMode, points);
      setIsDrawing(false);
    }
  };
  
  const handleStrategyNotesChange = (event) => {
    setStrategyData(prev => ({
      ...prev,
      notes: event.target.value
    }));
  };
  
  const handleCapabilityChange = (capability, value) => {
    setStrategyData(prev => ({
      ...prev,
      capabilities: {
        ...prev.capabilities,
        [capability]: value
      }
    }));
  };
  
  // Dialog handlers
  const openDialog = (type, index = -1, value = '') => {
    setDialogType(type);
    setDialogIndex(index);
    setDialogValue(value);
    setDialogOpen(true);
  };
  
  const closeDialog = () => {
    setDialogOpen(false);
    setDialogValue('');
    setDialogIndex(-1);
  };
  
  const handleDialogValueChange = (event) => {
    setDialogValue(event.target.value);
  };
  
  const handleDialogSave = () => {
    if (!dialogValue.trim()) return;

    setStrategyData(prev => {
      const newData = { ...prev };
      switch (dialogType) {
        case 'strengths':
          newData.strengths = [...prev.strengths, dialogValue];
          break;
        case 'weaknesses':
          newData.weaknesses = [...prev.weaknesses, dialogValue];
          break;
        case 'strategy':
          newData.strategies = [...prev.strategies, dialogValue];
          break;
        default:
          break;
      }
      return newData;
    });

    setDialogValue('');
    setDialogOpen(false);
  };
  
  const handleDelete = (type, index) => {
    setStrategyData(prev => {
      const newData = { ...prev };
      switch (type) {
        case 'strength':
          newData.strengths = prev.strengths.filter((_, i) => i !== index);
          break;
        case 'weakness':
          newData.weaknesses = prev.weaknesses.filter((_, i) => i !== index);
          break;
        case 'strategy':
          newData.strategies = prev.strategies.filter((_, i) => i !== index);
          break;
        default:
          break;
      }
      return newData;
    });
  };
  
  // Save functions
  const saveHeatmap = (mode, pointsData) => {
    if (!selectedTeam) {
      alert('Please select a team first');
      return;
    }
    
    const updatedHeatmaps = { ...savedHeatmaps };
    
    if (!updatedHeatmaps[selectedTeam]) {
      updatedHeatmaps[selectedTeam] = {};
    }
    
    updatedHeatmaps[selectedTeam][mode] = pointsData;
    
    setSavedHeatmaps(updatedHeatmaps);
    apiService.saveToLocalStorage('team_heatmaps', updatedHeatmaps);
    
    alert('Heatmap saved successfully!');
  };
  
  const clearHeatmap = () => {
    if (!selectedTeam) return;
    
    setPoints([]);
    
    const updatedHeatmaps = { ...savedHeatmaps };
    if (updatedHeatmaps[selectedTeam]) {
      if (updatedHeatmaps[selectedTeam][heatmapMode]) {
        delete updatedHeatmaps[selectedTeam][heatmapMode];
      }
      if (Object.keys(updatedHeatmaps[selectedTeam]).length === 0) {
        delete updatedHeatmaps[selectedTeam];
      }
    }
    
    setSavedHeatmaps(updatedHeatmaps);
    apiService.saveToLocalStorage('team_heatmaps', updatedHeatmaps);
  };
  
  const saveStrategy = () => {
    if (!selectedTeam) {
      alert('Please select a team first');
      return;
    }
    
    apiService.saveToLocalStorage(`strategy_${selectedTeam}`, strategyData);
    alert('Strategy saved successfully!');
  };
  
  // Chart data
  const getRadarData = (capabilitiesObj) => {
    return Object.entries(capabilitiesObj).map(([key, value]) => ({
      subject: key.charAt(0).toUpperCase() + key.slice(1),
      A: value,
      fullMark: 5
    }));
  };
  
  const getComparisonRadarData = () => {
    if (!comparisonTeam) return null;
    
    const comparisonData = apiService.getFromLocalStorage(`strategy_${comparisonTeam}`);
    return comparisonData ? getRadarData(comparisonData.capabilities) : null;
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
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
          Team Strategy & Analysis
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        {/* Team Selection */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel id="team-select-label">Select Team</InputLabel>
                    <Select
                      labelId="team-select-label"
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
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel id="comparison-team-label">Compare With</InputLabel>
                    <Select
                      labelId="comparison-team-label"
                      value={comparisonTeam}
                      label="Compare With"
                      onChange={handleComparisonTeamChange}
                    >
                      <MenuItem value="">
                        <em>Select a team</em>
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
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Heatmap Section */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Movement Heatmap
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <ToggleButtonGroup
                  color="primary"
                  value={heatmapMode}
                  exclusive
                  onChange={handleHeatmapModeChange}
                  fullWidth
                >
                  <ToggleButton value="auto">Auto</ToggleButton>
                  <ToggleButton value="teleop">Teleop</ToggleButton>
                  <ToggleButton value="endgame">Endgame</ToggleButton>
                </ToggleButtonGroup>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Heatmap Opacity: {opacity}%
                </Typography>
                <Slider
                  value={opacity}
                  onChange={handleOpacityChange}
                  valueLabelDisplay="auto"
                  min={10}
                  max={100}
                />
              </Box>
              
              <Box 
                sx={{ 
                  width: '100%', 
                  height: 400, 
                  position: 'relative',
                  border: '1px solid #ccc',
                  borderRadius: 1,
                  overflow: 'hidden'
                }}
              >
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={400}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    cursor: isDrawing ? 'crosshair' : 'pointer'
                  }}
                />
              </Box>
              
              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={<SaveIcon />}
                  onClick={() => saveHeatmap(heatmapMode, points)}
                  disabled={!selectedTeam || points.length === 0}
                >
                  Save Heatmap
                </Button>
                <Button 
                  variant="outlined" 
                  color="error" 
                  startIcon={<DeleteIcon />}
                  onClick={clearHeatmap}
                  disabled={points.length === 0}
                >
                  Clear Heatmap
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Capabilities Section */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Team Capabilities
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={getRadarData(strategyData.capabilities)}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis domain={[0, 5]} />
                    <Radar
                      name={selectedTeam ? `Team ${selectedTeam}` : 'Selected Team'}
                      dataKey="A"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                    />
                    {comparisonTeam && getComparisonRadarData() && (
                      <Radar
                        name={`Team ${comparisonTeam}`}
                        dataKey="A"
                        stroke="#82ca9d"
                        fill="#82ca9d"
                        fillOpacity={0.6}
                      />
                    )}
                    <Tooltip content={<CustomTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </Box>
              
              <Box sx={{ mt: 2 }}>
                {Object.entries(strategyData.capabilities).map(([key, value]) => (
                  <Box key={key} sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </Typography>
                    <Slider
                      value={value}
                      min={1}
                      max={5}
                      step={1}
                      marks
                      onChange={(_, newValue) => handleCapabilityChange(key, newValue)}
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Strategy Notes Section */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Strategy Notes
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={3}>
                {/* Strengths */}
                <Grid item xs={12} md={4}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1">Strengths</Typography>
                      <Button
                        size="small"
                        onClick={() => {
                          setDialogType('strengths');
                          setDialogOpen(true);
                        }}
                        variant="outlined"
                      >
                        Add Strength
                      </Button>
                    </Box>
                    <List>
                      {strategyData.strengths.map((strength, index) => (
                        <ListItem key={index}>
                          <ListItemText primary={strength} />
                          <IconButton
                            edge="end"
                            onClick={() => handleDelete('strength', index)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </Grid>

                {/* Weaknesses */}
                <Grid item xs={12} md={4}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1">Weaknesses</Typography>
                      <Button
                        size="small"
                        onClick={() => {
                          setDialogType('weaknesses');
                          setDialogOpen(true);
                        }}
                        variant="outlined"
                      >
                        Add Weakness
                      </Button>
                    </Box>
                    <List>
                      {strategyData.weaknesses.map((weakness, index) => (
                        <ListItem key={index}>
                          <ListItemText primary={weakness} />
                          <IconButton
                            edge="end"
                            onClick={() => handleDelete('weakness', index)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </Grid>

                {/* Recommended Strategies */}
                <Grid item xs={12} md={4}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1">Recommended Strategies</Typography>
                      <Button
                        size="small"
                        onClick={() => {
                          setDialogType('strategy');
                          setDialogOpen(true);
                        }}
                        variant="outlined"
                      >
                        Add Strategy
                      </Button>
                    </Box>
                    <List>
                      {strategyData.strategies.map((strategy, index) => (
                        <ListItem key={index}>
                          <ListItemText primary={strategy} />
                          <IconButton
                            edge="end"
                            onClick={() => handleDelete('strategy', index)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={saveStrategy}
                  disabled={!selectedTeam}
                >
                  Save Strategy
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Dialog for adding items */}
        <Dialog open={dialogOpen} onClose={closeDialog}>
          <DialogTitle>
            Add {dialogType === 'strengths' ? 'Strength' : 
                 dialogType === 'weaknesses' ? 'Weakness' : 'Strategy'}
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label={dialogType === 'strengths' ? 'Strength' : 
                     dialogType === 'weaknesses' ? 'Weakness' : 'Strategy'}
              fullWidth
              value={dialogValue}
              onChange={handleDialogValueChange}
              variant="outlined"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleDialogSave} variant="contained" color="primary">
              Add
            </Button>
          </DialogActions>
        </Dialog>
      </Grid>
    </Container>
  );
};

export default TeamStrategy;