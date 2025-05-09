import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Game from './components/Game';
import Progress from './components/Progress';
import Proof from './components/Proof';
import Leaderboard from './components/Leaderboard';
import { UserProvider } from './contexts/UserContext';
import GameSelect from './components/GameSelect';
import DivisionGame from './components/DivisionGame';
import Addition from './components/Addition';
import Subtraction from './components/Subtraction';
import Profile from './components/Profile';
import Navigation from './components/Navigation';
import AdminTools from './components/AdminTools';
import RewardsPage from './pages/RewardsPage';
import AdminPanel from './pages/AdminPanel';
import UserProfile from './pages/UserProfile';
import { HelmetProvider } from 'react-helmet-async';

function App() {
  return (
    <Router>
      <HelmetProvider>
        <UserProvider>
          <div className="min-h-screen bg-gray-50 pt-16"> {/* Added padding-top for fixed navbar */}
            <Navigation />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<GameSelect />} />
              <Route path="/game" element={<Game />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/division" element={<DivisionGame />} />
              <Route path="/addition" element={<Addition />} />
              <Route path="/subtraction" element={<Subtraction />} />
              <Route path="/proof" element={<Proof />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/user/profile" element={<UserProfile />} />
              <Route path="/admin" element={<AdminTools />} />
              <Route path="/rewards" element={<RewardsPage />} />
              {/* Admin panel route for managing visual reward items */}
              <Route path="/admin/rewards" element={<AdminPanel />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </UserProvider>
      </HelmetProvider>
    </Router>
  );
}

export default App;