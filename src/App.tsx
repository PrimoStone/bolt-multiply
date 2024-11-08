import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/Login';
import Game from './components/Game';
import Progress from './components/Progress';
import Proof from './components/Proof';
import Leaderboard from './components/Leaderboard';
import { UserProvider } from './contexts/UserContext';
import { db, auth } from './firebase/config';
import TitlePage from './components/TitlePage';

function App() {
  return (
    <UserProvider>
      <Router>
        <div className="min-h-screen">
          <Routes>
            <Route path="/" element={<TitlePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/game" element={<Game />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/proof" element={<Proof />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
          </Routes>
        </div>
      </Router>
    </UserProvider>
  );
}

export default App;