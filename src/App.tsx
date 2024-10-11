import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/Login';
import Game from './components/Game';
import Progress from './components/Progress';
import Proof from './components/Proof';
import Leaderboard from './components/Leaderboard';
import { UserProvider } from './contexts/UserContext';

function App() {
  return (
    <UserProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/game" element={<Game />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/proof" element={<Proof />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
            </Routes>
          </div>
        </div>
      </Router>
    </UserProvider>
  );
}

export default App;