# FRC Ultra Scouting Application

A comprehensive web-based scouting application for FIRST Robotics Competition (FRC) teams. This application helps teams collect, analyze, and visualize match data to develop effective strategies.

## Features

- **Dashboard**: Overview of teams, matches, and scouting statistics
- **Match Tracking**: Real-time match scouting with quick scoring panel
- **Team Strategy**: Analyze team capabilities, strengths, and weaknesses
- **Heatmap Analysis**: Visualize robot movements and patterns on the field
- **Match Analysis**: Detailed post-match analysis and scoring breakdown
- **Team Management**: Import and manage team data
- **Offline Support**: Full functionality without internet connection

## Technology Stack

- **Frontend**: React.js with Material-UI
- **State Management**: React Hooks and Context
- **Data Storage**: Local Storage for offline functionality
- **API Integration**: FIRST API v3.0
- **Data Visualization**: Recharts for statistics and heatmaps

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- FIRST API authentication token

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/frcultra.git
   cd frcultra
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) to view the application

## FIRST API Integration

The application integrates with the FIRST API v3.0 to fetch official event data:

1. Get your authentication token from [FIRST API Documentation](https://frc-api-docs.firstinspires.org/)
2. Configure your credentials in the Settings page
3. Use the data import features to load teams and matches

### API Features

- Fetch event details and team lists
- Get match schedules and results
- Real-time match data updates
- Automatic data synchronization

## Usage Guide

### Match Tracking

- Quick scoring panel for both alliances
- Auto, Teleop, and Endgame phase tracking
- Real-time score calculation
- Match status tracking

### Team Strategy

- Movement heatmaps for different match phases
- Capability ratings and comparisons
- Strength/weakness analysis
- Strategy recommendations

### Data Management

- Import team data from FIRST API
- Export scouting data for backup
- Offline data persistence
- Match result synchronization

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- FIRST Robotics Competition
- FIRST API Documentation Team
- #9029 Team NF
- All contributing FRC teams

## Support

For support, please open an issue in the GitHub repository or contact the development team.
