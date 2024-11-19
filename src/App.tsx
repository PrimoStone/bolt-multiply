import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Game from './components/Game';
import Progress from './components/Progress';
import Proof from './components/Proof';
import Leaderboard from './components/Leaderboard';
import { UserProvider } from './contexts/UserContext';
import { db, auth } from './firebase/config';
import TitlePage from './components/TitlePage';
import GameSelect from './components/GameSelect';
import DivisionGame from './components/DivisionGame';
import Addition from './components/Addition';
import Subtraction from './components/Subtraction';
import Profile from './components/Profile';

function App() {
  return (
    <Router>
      <UserProvider>
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </UserProvider>
    </Router>
  );
}

export default App;