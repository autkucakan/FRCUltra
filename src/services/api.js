import axios from 'axios';

// FIRST API configuration
const FIRST_API_BASE_URL = 'https://frc-api.firstinspires.org/v3.0';
const CURRENT_SEASON = new Date().getFullYear();

// Create axios instance with base URL
const firstApiClient = axios.create({
  baseURL: FIRST_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for error handling
firstApiClient.interceptors.response.use(
  response => response,
  error => {
    console.error('FIRST API Error:', error);
    if (error.response) {
      switch (error.response.status) {
        case 401:
          throw new Error('Unauthorized: Invalid authentication token');
        case 404:
          throw new Error('Not found: The requested resource does not exist');
        case 500:
          throw new Error('Server error: Please try again later');
        default:
          throw new Error(`Error: ${error.response.data?.message || 'Unknown error'}`);
      }
    } else if (error.request) {
      throw new Error('Network error: Unable to connect to the server');
    } else {
      throw new Error('Error: ' + error.message);
    }
  }
);

// API Service
const apiService = {
  // Set FIRST API authentication
  setFirstApiAuth(username, authToken) {
    console.log('Setting FIRST API credentials');
    firstApiClient.defaults.headers.common['Authorization'] = `Basic ${btoa(`${username}:${authToken}`)}`;
  },
  
  // Local Storage Operations
  saveToLocalStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  },
  
  getFromLocalStorage(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error getting from localStorage:', error);
      return null;
    }
  },
  
  removeFromLocalStorage(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  },
  
  // FIRST API Operations
  async getEventDetails(year = CURRENT_SEASON, eventCode) {
    try {
      console.log(`Fetching event details for: ${year}/${eventCode}`);
      const response = await firstApiClient.get(`/${year}/events/${eventCode}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching event details:', error);
      throw error;
    }
  },
  
  async getEventTeams(year = CURRENT_SEASON, eventCode) {
    try {
      console.log(`Fetching event teams for: ${year}/${eventCode}`);
      const response = await firstApiClient.get(`/${year}/events/${eventCode}/teams`);
      return response.data.teams || [];
    } catch (error) {
      console.error('Error fetching event teams:', error);
      throw error;
    }
  },
  
  async getEventMatches(year = CURRENT_SEASON, eventCode, tournamentLevel = 'qual') {
    try {
      console.log(`Fetching event matches for: ${year}/${eventCode}`);
      const response = await firstApiClient.get(`/${year}/schedule/${eventCode}/${tournamentLevel}`);
      return response.data.Schedule || [];
    } catch (error) {
      console.error('Error fetching event matches:', error);
      throw error;
    }
  },
  
  async getMatchResults(year = CURRENT_SEASON, eventCode, tournamentLevel = 'qual') {
    try {
      console.log(`Fetching match results for: ${year}/${eventCode}`);
      const response = await firstApiClient.get(`/${year}/scores/${eventCode}/${tournamentLevel}`);
      return response.data.MatchScores || [];
    } catch (error) {
      console.error('Error fetching match results:', error);
      throw error;
    }
  },
  
  // Team and Match Data Management
  async getAllTeams() {
    const teams = this.getFromLocalStorage('teams');
    if (teams && teams.length > 0) {
      console.log(`Retrieved ${teams.length} teams from local storage`);
      return teams;
    }
    console.warn('No teams found in local storage');
    return [];
  },
  
  async getTeamById(teamId) {
    const teams = this.getFromLocalStorage('teams');
    if (teams) {
      const team = teams.find(t => t.team_number === parseInt(teamId));
      if (team) {
        console.log(`Found team ${teamId} in local storage`);
        return team;
      }
    }
    console.warn(`Team ${teamId} not found in local storage`);
    return null;
  },
  
  // Match Status Management
  async getCurrentMatchStatus() {
    const matches = this.getFromLocalStorage('match_data');
    if (!matches || matches.length === 0) {
      console.warn('No matches found in local storage');
      return {
        current_match: null,
        next_match: null,
        status: 'unknown'
      };
    }
    
    const scheduledMatches = matches
      .filter(m => m.status === 'scheduled')
      .sort((a, b) => a.match_number - b.match_number);
    
    if (scheduledMatches.length === 0) {
      return {
        current_match: null,
        next_match: null,
        status: 'completed'
      };
    }
    
    return {
      current_match: scheduledMatches[0].match_number,
      next_match: scheduledMatches.length > 1 ? scheduledMatches[1].match_number : null,
      status: 'scheduled'
    };
  },
  
  // Data Import/Export
  importTeamsFromJson: (teams) => {
    try {
      // Map teams to the required format
      const formattedTeams = teams.map(team => ({
        team_number: team.teamNumber,
        nickname: team.nameShort,
        name: team.nameFull,
        city: team.city,
        state_prov: team.stateProv,
        country: team.country,
        rookie_year: team.rookieYear,
        robot_name: team.robotName || '',
        school_name: team.schoolName,
        website: team.website || ''
      }));

      // Save teams to local storage
      localStorage.setItem('teams', JSON.stringify(formattedTeams));

      return {
        success: true,
        message: `Successfully imported ${teams.length} teams`,
        teams: formattedTeams
      };
    } catch (error) {
      console.error('Error in importTeamsFromJson:', error);
      return {
        success: false,
        message: `Error importing teams: ${error.message}`,
        teams: []
      };
    }
  }
};

export default apiService; 