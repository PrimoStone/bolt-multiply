# Number Ninjas Math Learning App

## Project Overview
Number Ninjas is an interactive educational web application designed to help first-grade students practice basic arithmetic operations. The app features multiple game modes, user authentication, and progress tracking.

## Tech Stack
- **Frontend Framework**: React with TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Deployment**: Netlify

## Project Structure
```
src/
├── components/          # React components
│   ├── Addition.tsx    # Addition game mode
│   ├── Subtraction.tsx # Subtraction game mode
│   ├── Game.tsx        # Multiplication game mode
│   ├── DivisionGame.tsx# Division game mode
│   └── Proof.tsx       # Game results display
├── contexts/           # React contexts
│   └── UserContext.tsx # User authentication state
├── firebase/           # Firebase configuration
│   ├── config.ts      # Firebase initialization
│   └── utils.ts       # Firebase utility functions
├── hooks/             # Custom React hooks
│   └── useUserStats.ts# User statistics hook
└── main.tsx           # Application entry point
```

## Core Features
1. **Game Modes**
   - Addition (numbers 0-12)
   - Subtraction (minuend max 24, subtrahend max 12)
   - Multiplication (numbers 2-12)
   - Division (numbers with whole quotients)

2. **User System**
   - Firebase authentication
   - User profiles with avatars
   - Photo upload functionality
   - Statistics tracking

3. **Game Logic**
   - 20 questions per session
   - Progress tracking
   - Answer history
   - Time tracking
   - Score calculation

4. **User Interface**
   - Responsive design
   - Progress bar
   - Real-time feedback
   - Statistics dashboard
   - Leaderboard

## Key Components

### Game Components
Each game component (Addition, Subtraction, Game, DivisionGame) follows a similar structure:
- Question generation based on grade-appropriate ranges
- Answer validation
- History tracking
- Progress monitoring
- Time tracking
- Score calculation

### User Management
- Firebase Authentication for user accounts
- Firestore for storing user data and game statistics
- Photo upload with base64 conversion
- Real-time statistics updates

### State Management
- UserContext for global user state
- Local state for game progress
- Custom hooks for statistics

## Security Considerations
- Protected routes requiring authentication
- Secure file upload handling
- Firebase security rules
- Input validation

## Development Guidelines
1. **Code Style**
   - Use TypeScript for type safety
   - Follow React functional component patterns
   - Implement proper error handling
   - Maintain consistent code formatting

2. **Testing**
   - Test number generation ranges
   - Validate game logic
   - Check user input handling
   - Verify authentication flows

3. **Performance**
   - Optimize image uploads
   - Minimize re-renders
   - Efficient state updates
   - Lazy loading where appropriate

## Deployment
- Hosted on Netlify
- SPA routing configuration
- Environment variables management
- Build optimization

## Future Improvements
1. **Features**
   - Adaptive difficulty levels
   - More detailed analytics
   - Achievement system
   - Parent dashboard

2. **Technical**
   - Unit test coverage
   - Performance monitoring
   - Accessibility improvements
   - Mobile app version

## Getting Started
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up Firebase credentials
4. Run development server: `npm run dev`

## Contact
For questions or support, contact the project maintainer.
