import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Button,
  Divider,
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
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import apiService from '../services/api';

// Tab panel component for the tabbed interface
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

const TeamDetails = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [scoutingData, setScoutingData] = useState([]);
  const [matchData, setMatchData] = useState([]);
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Fetch teams data function wrapped in useCallback
  const fetchTeamsData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get teams from local storage
      const cachedTeams = apiService.getFromLocalStorage('teams');
      
      if (cachedTeams && cachedTeams.length > 0) {
        setTeams(cachedTeams);
      } else {
        // If no teams in local storage, show error
        setError('No teams found. Please import teams data first.');
      }
      
      // Get scouting data from local storage
      const cachedScoutingData = apiService.getFromLocalStorage('scouting_data') || [];
      setScoutingData(cachedScoutingData);
      
      // Get match data from local storage
      const cachedMatchData = apiService.getFromLocalStorage('match_data') || [];
      setMatchData(cachedMatchData);
      
    } catch (err) {
      setError('Failed to load teams data. Please try again later.');
      console.error('Team details fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchTeamsData();
  }, [fetchTeamsData]);
  
  // Handle team selection
  const handleTeamSelect = (team) => {
    setSelectedTeam(team);
    
    // Filter scouting data for this team
    const teamScoutingData = scoutingData.filter(
      data => data.team_number === team.team_number
    );
    setScoutingData(teamScoutingData);
    
    // Filter match data for this team
    const teamMatchData = matchData.filter(match => 
      match.red_alliance.includes(team.team_number) || 
      match.blue_alliance.includes(team.team_number)
    );
    setMatchData(teamMatchData);
  };
  
  // Calculate performance metrics
  const calculatePerformanceMetrics = () => {
    if (!scoutingData || scoutingData.length === 0) {
      return {
        autoAvg: 0,
        teleopAvg: 0,
        endgameAvg: 0,
        totalAvg: 0,
        matchesPlayed: 0,
        winRate: 0,
        pieData: [
          { name: 'Auto', value: 0 },
          { name: 'Teleop', value: 0 },
          { name: 'Endgame', value: 0 }
        ],
        matchPerformance: []
      };
    }
    
    // Calculate metrics from scouting data
    const autoPoints = scoutingData.reduce((sum, match) => {
      return sum + (match.auto?.autoSpeaker * 4 || 0) + (match.auto?.autoAmp * 2 || 0) + (match.auto?.mobility ? 2 : 0);
    }, 0);
    
    const teleopPoints = scoutingData.reduce((sum, match) => {
      return sum + (match.teleop?.teleopSpeaker * 2 || 0) + (match.teleop?.teleopAmp * 1 || 0) + (match.teleop?.teleopTrap * 5 || 0);
    }, 0);
    
    const endgamePoints = scoutingData.reduce((sum, match) => {
      return sum + 
        (match.endgame?.climb ? 3 : 0) + 
        (match.endgame?.harmony ? 2 : 0) + 
        (match.endgame?.spotlight ? 1 : 0) + 
        (match.endgame?.park ? 1 : 0);
    }, 0);
    
    // Calculate win rate
    let wins = 0;
    if (matchData.length > 0 && selectedTeam) {
      matchData.forEach(match => {
        const teamIdNum = selectedTeam.team_number;
        if (match.winning_alliance === 'red' && match.red_alliance.includes(teamIdNum)) {
          wins++;
        } else if (match.winning_alliance === 'blue' && match.blue_alliance.includes(teamIdNum)) {
          wins++;
        }
      });
    }
    
    // Create match performance data for line chart
    const matchPerformance = scoutingData.map((match, index) => {
      const autoScore = (match.auto?.autoSpeaker * 4 || 0) + (match.auto?.autoAmp * 2 || 0) + (match.auto?.mobility ? 2 : 0);
      const teleopScore = (match.teleop?.teleopSpeaker * 2 || 0) + (match.teleop?.teleopAmp * 1 || 0) + (match.teleop?.teleopTrap * 5 || 0);
      const endgameScore = 
        (match.endgame?.climb ? 3 : 0) + 
        (match.endgame?.harmony ? 2 : 0) + 
        (match.endgame?.spotlight ? 1 : 0) + 
        (match.endgame?.park ? 1 : 0);
      
      return {
        name: `Match ${match.match_number || index + 1}`,
        auto: autoScore,
        teleop: teleopScore,
        endgame: endgameScore,
        total: autoScore + teleopScore + endgameScore
      };
    });
    
    return {
      autoAvg: Math.round(autoPoints / scoutingData.length) || 0,
      teleopAvg: Math.round(teleopPoints / scoutingData.length) || 0,
      endgameAvg: Math.round(endgamePoints / scoutingData.length) || 0,
      totalAvg: Math.round((autoPoints + teleopPoints + endgamePoints) / scoutingData.length) || 0,
      matchesPlayed: matchData.length,
      winRate: matchData.length > 0 ? Math.round((wins / matchData.length) * 100) : 0,
      pieData: [
        { name: 'Auto', value: Math.round(autoPoints / scoutingData.length) || 0 },
        { name: 'Teleop', value: Math.round(teleopPoints / scoutingData.length) || 0 },
        { name: 'Endgame', value: Math.round(endgamePoints / scoutingData.length) || 0 }
      ],
      matchPerformance
    };
  };
  
  const metrics = calculatePerformanceMetrics();
  
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
          Team Details
        </Typography>
      </Box>
      
      {!selectedTeam ? (
        // Team selection view
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Select a Team
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2}>
                  {teams.map((team) => (
                    <Grid item xs={12} sm={6} md={4} key={team.team_number}>
                      <Card 
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': {
                            boxShadow: 6,
                          }
                        }}
                        onClick={() => handleTeamSelect(team)}
                      >
                        <CardContent>
                          <Typography variant="h6">
                            {team.team_number}
                          </Typography>
                          <Typography variant="subtitle1">
                            {team.nickname}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {team.city}, {team.state_prov}, {team.country}
                          </Typography>
                          {team.rookie_year && (
                            <Typography variant="body2" color="text.secondary">
                              Rookie Year: {team.rookie_year}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
                
                {teams.length === 0 && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    No teams found. Please import teams data first.
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : (
        // Team details view
        <Grid container spacing={3}>
          {/* Team Info Card */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Team {selectedTeam.team_number} - {selectedTeam.nickname}
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Location
                  </Typography>
                  <Typography variant="body1">
                    {selectedTeam.city}, {selectedTeam.state_prov}, {selectedTeam.country}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Rookie Year
                  </Typography>
                  <Typography variant="body1">
                    {selectedTeam.rookie_year || 'Unknown'}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    School
                  </Typography>
                  <Typography variant="body1">
                    {selectedTeam.school_name || 'Not available'}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Website
                  </Typography>
                  <Typography variant="body1">
                    {selectedTeam.website_url ? (
                      <a href={selectedTeam.website_url} target="_blank" rel="noopener noreferrer">
                        {selectedTeam.website_url}
                      </a>
                    ) : 'Not available'}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Full Name
                  </Typography>
                  <Typography variant="body1">
                    {selectedTeam.full_name || selectedTeam.nickname}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Robot Name
                  </Typography>
                  <Typography variant="body1">
                    {selectedTeam.robot_name || 'Not available'}
                  </Typography>
                </Box>
                
                <Button 
                  variant="outlined" 
                  color="primary" 
                  fullWidth 
                  sx={{ mt: 3 }}
                  onClick={() => navigate(`/team/${selectedTeam.team_number}`)}
                >
                  View Team Notes
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Main Content Area */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ mb: 3 }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange} 
                indicatorColor="primary"
                textColor="primary"
                variant="fullWidth"
              >
                <Tab label="Performance" />
                <Tab label="Match History" />
              </Tabs>
            </Paper>
            
            {/* Performance Tab */}
            {tabValue === 0 && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Performance Statistics
                  </Typography>
                  
                  {scoutingData.length > 0 ? (
                    <>
                      <Box sx={{ height: 300, mt: 3 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={metrics.matchPerformance}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="auto" fill="#8884d8" name="Auto" />
                            <Bar dataKey="teleop" fill="#82ca9d" name="Teleop" />
                            <Bar dataKey="endgame" fill="#ffc658" name="Endgame" />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                      
                      <Typography variant="subtitle1" sx={{ mt: 4, mb: 2 }}>
                        Key Metrics
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6} sm={3}>
                          <Paper sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="h6">{metrics.autoAvg}</Typography>
                            <Typography variant="body2" color="text.secondary">Avg. Auto</Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Paper sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="h6">{metrics.teleopAvg}</Typography>
                            <Typography variant="body2" color="text.secondary">Avg. Teleop</Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Paper sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="h6">{metrics.endgameAvg}</Typography>
                            <Typography variant="body2" color="text.secondary">Avg. Endgame</Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Paper sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="h6">{metrics.totalAvg}</Typography>
                            <Typography variant="body2" color="text.secondary">Avg. Total</Typography>
                          </Paper>
                        </Grid>
                      </Grid>
                    </>
                  ) : (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      No scouting data available for this team. Use Match Tracking to add performance data.
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}
            
            {/* Match History Tab */}
            {tabValue === 1 && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Match History
                  </Typography>
                  
                  {matchData.length > 0 ? (
                    <List>
                      {matchData.map((match, index) => (
                        <ListItem 
                          key={index}
                          sx={{ bgcolor: 'background.paper', mb: 1, borderRadius: 1 }}
                        >
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="subtitle1">Match {match.match_number}</Typography>
                                <Typography variant="subtitle1" fontWeight="bold">
                                  {match.winning_alliance === 'red' ? 'Red' : match.winning_alliance === 'blue' ? 'Blue' : 'Tie'}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                                <Chip 
                                  size="small" 
                                  label={`Alliance: ${match.red_alliance.includes(selectedTeam.team_number) ? 'Red' : 'Blue'}`} 
                                  color={match.red_alliance.includes(selectedTeam.team_number) ? 'error' : 'primary'} 
                                  variant="outlined" 
                                />
                                {match.score_breakdown && (
                                  <Chip 
                                    size="small" 
                                    label={`Score: ${match.red_alliance.includes(selectedTeam.team_number) 
                                      ? match.score_breakdown.red.total_points 
                                      : match.score_breakdown.blue.total_points}`} 
                                    color="secondary" 
                                    variant="outlined" 
                                  />
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      No match history available for this team.
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default TeamDetails; 