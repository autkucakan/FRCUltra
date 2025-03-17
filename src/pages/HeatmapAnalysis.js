import { useState, useEffect, useRef, useCallback } from 'react';
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
  ToggleButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import apiService from '../services/api';

const HeatmapAnalysis = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [heatmapMode, setHeatmapMode] = useState('auto');
  const [opacity, setOpacity] = useState(70);
  const [fieldImage, setFieldImage] = useState(null);
  
  // Canvas state
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState([]);
  const [savedHeatmaps, setSavedHeatmaps] = useState({});
  
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        
        // Try to get data from local storage first
        const cachedTeams = apiService.getFromLocalStorage('teams');
        
        if (cachedTeams) {
          setTeams(cachedTeams);
        } else {
          // Fetch from API if not in local storage
          const teamsData = await apiService.getAllTeams();
          setTeams(teamsData);
          
          // Cache the data
          apiService.saveToLocalStorage('teams', teamsData);
        }
        
        // Load saved heatmaps from localStorage
        const savedHeatmapData = apiService.getFromLocalStorage('heatmaps') || {};
        setSavedHeatmaps(savedHeatmapData);
        
        // Load field image
        const img = new Image();
        img.src = process.env.PUBLIC_URL + '/field2024.jpg'; // Use field2024.jpg from public folder
        img.onload = () => {
          setFieldImage(img);
        };
        img.onerror = (error) => {
          console.error('Error loading field image:', error);
          setError('Failed to load field image. Please check if the image exists in the public folder.');
        };
        
      } catch (err) {
        setError('Failed to load teams data. Please try again later.');
        console.error('Heatmap teams fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTeams();
  }, []);
  
  useEffect(() => {
    if (selectedTeam && savedHeatmaps[selectedTeam] && savedHeatmaps[selectedTeam][heatmapMode]) {
      setPoints(savedHeatmaps[selectedTeam][heatmapMode]);
    } else {
      setPoints([]);
    }
  }, [selectedTeam, heatmapMode, savedHeatmaps]);
  
  // Using useCallback to memoize the drawHeatmap function
  const drawHeatmap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw field image
    if (fieldImage) {
      ctx.drawImage(fieldImage, 0, 0, canvas.width, canvas.height);
    }
    
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
  
  useEffect(() => {
    if (canvasRef.current && fieldImage) {
      drawHeatmap();
    }
  }, [points, opacity, fieldImage, drawHeatmap]);
  
  const handleTeamChange = (event) => {
    setSelectedTeam(event.target.value);
  };
  
  const handleHeatmapModeChange = (event, newMode) => {
    if (newMode !== null) {
      setHeatmapMode(newMode);
    }
  };
  
  const handleOpacityChange = (event, newValue) => {
    setOpacity(newValue);
  };
  
  const handleCanvasMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Doğru pozisyonu hesapla - canvas'ın ölçeklendirmesini dikkate al
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    setIsDrawing(true);
    setPoints([...points, { x, y, intensity: 1 }]);
  };
  
  const handleCanvasMouseMove = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Doğru pozisyonu hesapla - canvas'ın ölçeklendirmesini dikkate al
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    setPoints([...points, { x, y, intensity: 1 }]);
  };
  
  const handleCanvasMouseUp = () => {
    setIsDrawing(false);
  };
  
  const saveHeatmap = () => {
    if (!selectedTeam) {
      alert('Please select a team first');
      return;
    }
    
    const updatedHeatmaps = { ...savedHeatmaps };
    
    if (!updatedHeatmaps[selectedTeam]) {
      updatedHeatmaps[selectedTeam] = {};
    }
    
    updatedHeatmaps[selectedTeam][heatmapMode] = points;
    
    setSavedHeatmaps(updatedHeatmaps);
    apiService.saveToLocalStorage('heatmaps', updatedHeatmaps);
    
    alert('Heatmap saved successfully!');
  };
  
  const clearHeatmap = () => {
    setPoints([]);
    
    if (selectedTeam && savedHeatmaps[selectedTeam]) {
      const updatedHeatmaps = { ...savedHeatmaps };
      
      if (updatedHeatmaps[selectedTeam][heatmapMode]) {
        delete updatedHeatmaps[selectedTeam][heatmapMode];
        
        setSavedHeatmaps(updatedHeatmaps);
        apiService.saveToLocalStorage('heatmaps', updatedHeatmaps);
      }
    }
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
          Heatmap Analysis
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        {/* Controls */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Heatmap Controls
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ mb: 3 }}>
                <FormControl fullWidth>
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
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Heatmap Mode
                </Typography>
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
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Heatmap Opacity: {opacity}%
                </Typography>
                <Slider
                  value={opacity}
                  onChange={handleOpacityChange}
                  aria-labelledby="opacity-slider"
                  valueLabelDisplay="auto"
                  min={10}
                  max={100}
                />
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button 
                  variant="contained" 
                  color="success" 
                  startIcon={<SaveIcon />}
                  onClick={saveHeatmap}
                  disabled={!selectedTeam || points.length === 0}
                  fullWidth
                >
                  Save
                </Button>
                <Button 
                  variant="outlined" 
                  color="error" 
                  startIcon={<DeleteIcon />}
                  onClick={clearHeatmap}
                  disabled={points.length === 0}
                  fullWidth
                >
                  Clear
                </Button>
              </Box>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Instructions
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Typography variant="body2" paragraph>
                1. Select a team from the dropdown menu.
              </Typography>
              <Typography variant="body2" paragraph>
                2. Choose the match phase (Auto, Teleop, Endgame).
              </Typography>
              <Typography variant="body2" paragraph>
                3. Click and drag on the field to create heatmap points.
              </Typography>
              <Typography variant="body2" paragraph>
                4. Adjust opacity as needed for better visualization.
              </Typography>
              <Typography variant="body2" paragraph>
                5. Save your heatmap to review later.
              </Typography>
              <Typography variant="body2">
                The heatmap helps visualize where robots spend most of their time during matches.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Heatmap Canvas */}
        <Grid item xs={12} md={8}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 2, 
              bgcolor: 'background.paper',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                {selectedTeam ? `Team ${selectedTeam} - ${heatmapMode.toUpperCase()} Phase` : 'Select a team to begin'}
              </Typography>
            </Box>
            
            <Box 
              sx={{ 
                width: '100%', 
                height: 500, 
                position: 'relative',
                border: '1px solid #ccc',
                borderRadius: 1,
                overflow: 'hidden'
              }}
            >
              <canvas
                ref={canvasRef}
                width={800}
                height={500}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  cursor: isDrawing ? 'crosshair' : 'pointer',
                  backgroundColor: '#f0f0f0'
                }}
              />
            </Box>
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Points: {points.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Click and drag to add heatmap points
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default HeatmapAnalysis; 