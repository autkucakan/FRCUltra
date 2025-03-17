import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Box,
  Button,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Chip,
  Paper,
  Divider,
  Tabs,
  Tab,
  CardActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import apiService from '../services/api';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AnalyticsIcon from '@mui/icons-material/Analytics';

const Dashboard = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [scoutingStats, setScoutingStats] = useState({
    teamsScoutedCount: 0,
    matchesScoutedCount: 0,
    completedMatchesCount: 0,
    topPerformingTeam: null
  });
  
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
      
      // Try to get data from local storage first
      const cachedTeams = apiService.getFromLocalStorage('teams');
      
      if (cachedTeams) {
        setTeams(cachedTeams);
        setFilteredTeams(cachedTeams);
      } else {
        // Fetch from API if not in local storage
        const teamsData = await apiService.getAllTeams();
        setTeams(teamsData);
        setFilteredTeams(teamsData);
        
        // Cache the data
        apiService.saveToLocalStorage('teams', teamsData);
      }
      
      // Get scouting data from local storage
      const scoutingData = apiService.getFromLocalStorage('scouting_data') || [];
      
      // Get match data from local storage
      const matchData = apiService.getFromLocalStorage('match_data') || [];
      
      // Calculate scouting statistics
      const scoutedTeamIds = [...new Set(scoutingData.map(data => data.team_number))];
      const scoutedMatchIds = [...new Set(scoutingData.map(data => data.match_number))];
      const completedMatches = matchData.filter(match => match.status === 'completed').length;
      
      // Find top performing team
      let topTeam = null;
      let maxScore = 0;
      
      scoutedTeamIds.forEach(teamId => {
        const teamScoutingData = scoutingData.filter(data => data.team_number === teamId);
        const totalScore = teamScoutingData.reduce((sum, match) => {
          const autoScore = (match.auto.autoSpeaker * 4) + (match.auto.autoAmp * 2) + (match.auto.mobility ? 2 : 0);
          const teleopScore = (match.teleop.teleopSpeaker * 2) + (match.teleop.teleopAmp * 1) + (match.teleop.teleopTrap * 5);
          const endgameScore = 
            (match.endgame.climb ? 3 : 0) + 
            (match.endgame.harmony ? 2 : 0) + 
            (match.endgame.spotlight ? 1 : 0) + 
            (match.endgame.park ? 1 : 0);
          
          return sum + autoScore + teleopScore + endgameScore;
        }, 0);
        
        const avgScore = totalScore / teamScoutingData.length;
        
        if (avgScore > maxScore) {
          maxScore = avgScore;
          topTeam = teams.find(team => team.team_number === teamId);
        }
      });
      
      setScoutingStats({
        teamsScoutedCount: scoutedTeamIds.length,
        matchesScoutedCount: scoutedMatchIds.length,
        completedMatchesCount: completedMatches,
        topPerformingTeam: topTeam
      });
      
      // Get upcoming matches (for a real app, this would come from the API)
      // Here we're just using the first few matches from the match data
      setUpcomingMatches(matchData.slice(0, 5));
      
    } catch (err) {
      setError('Failed to load teams data. Please try again later.');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [teams]);
  
  useEffect(() => {
    fetchTeamsData();
  }, [fetchTeamsData]);
  
  // Filter teams based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredTeams(teams);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = teams.filter(team => 
        team.team_number.toString().includes(query) || 
        team.nickname.toLowerCase().includes(query)
      );
      setFilteredTeams(filtered);
    }
  }, [searchQuery, teams]);
  
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };
  
  const handleTeamClick = (teamId) => {
    navigate(`/team/${teamId}`);
  };
  
  // Generate chart data for team distribution
  const generateTeamDistributionData = () => {
    // In a real app, this would be based on actual team data
    // Here we're just creating mock data
    return [
      { name: 'Rookie Teams', value: Math.floor(teams.length * 0.2) },
      { name: 'Veteran Teams', value: Math.floor(teams.length * 0.5) },
      { name: 'Championship Teams', value: Math.floor(teams.length * 0.3) }
    ];
  };
  
  // Generate chart data for scouting progress
  const generateScoutingProgressData = () => {
    const totalTeams = teams.length;
    const scoutedTeams = scoutingStats.teamsScoutedCount;
    
    return [
      { name: 'Scouted', value: scoutedTeams },
      { name: 'Not Scouted', value: totalTeams - scoutedTeams }
    ];
  };
  
  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading dashboard...
        </Typography>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        FRCUltra Dashboard
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Statistics Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Teams
              </Typography>
              <Typography variant="h4">
                {teams.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Teams Scouted
              </Typography>
              <Typography variant="h4">
                {scoutingStats.teamsScoutedCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Matches Completed
              </Typography>
              <Typography variant="h4">
                {scoutingStats.completedMatchesCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Top Team
              </Typography>
              <Typography variant="h4">
                {scoutingStats.topPerformingTeam ? scoutingStats.topPerformingTeam.team_number : 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Grid container spacing={3}>
        {/* Search and Filter */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <TextField
              fullWidth
              placeholder="Search teams by number or name..."
              value={searchQuery}
              onChange={handleSearchChange}
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Paper>
        </Grid>
        
        {/* Charts Section */}
        <Grid item xs={12}>
          <Card>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange} 
                indicatorColor="primary"
                textColor="primary"
                centered
              >
                <Tab label="Team Distribution" />
                <Tab label="Scouting Progress" />
              </Tabs>
            </Box>
            
            <CardContent>
              {tabValue === 0 && (
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={generateTeamDistributionData()}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {generateTeamDistributionData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              )}
              
              {tabValue === 1 && (
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={generateScoutingProgressData()}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Teams Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Teams
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {teams.length > 0 ? (
                <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {teams.map((team) => (
                    <ListItem 
                      key={team.team_number} 
                      divider
                      component={RouterLink}
                      to={`/team/${team.team_number}`}
                      sx={{ 
                        textDecoration: 'none', 
                        color: 'inherit',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        }
                      }}
                    >
                      <ListItemText
                        primary={`${team.team_number} - ${team.nickname || 'Unknown Team'}`}
                        secondary={team.city ? `${team.city}, ${team.state_prov}, ${team.country}` : 'Location unknown'}
                      />
                      <ListItemSecondaryAction>
                        <IconButton 
                          edge="end" 
                          aria-label="view"
                          component={RouterLink}
                          to={`/team/${team.team_number}`}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Alert severity="info">
                  No teams available. Import data from Settings.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Matches Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Matches
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {upcomingMatches.length > 0 ? (
                <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {upcomingMatches.map((match) => (
                    <ListItem 
                      key={match.match_number} 
                      divider
                      sx={{ pr: 8 }}
                    >
                      <ListItemText
                        primary={`Match ${match.match_number}`}
                        secondary={
                          <>
                            <Typography variant="body2" component="span">
                              Red: {match.red_alliance?.join(', ') || 'N/A'}
                            </Typography>
                            <br />
                            <Typography variant="body2" component="span">
                              Blue: {match.blue_alliance?.join(', ') || 'N/A'}
                            </Typography>
                          </>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton 
                          edge="end" 
                          aria-label="scout"
                          component={RouterLink}
                          to={`/match-tracking/${match.match_number}`}
                          sx={{ mr: 1 }}
                        >
                          <AssignmentIcon />
                        </IconButton>
                        <IconButton 
                          edge="end" 
                          aria-label="analyze"
                          component={RouterLink}
                          to={`/match-analysis/${match.match_number}`}
                        >
                          <AnalyticsIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Alert severity="info">
                  No matches available. Import data from Settings.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard; 