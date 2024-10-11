import React, { useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import { jsPDF } from 'jspdf';
import { ArrowLeft, Download } from 'lucide-react';

const Proof: React.FC = () => {
  const { user } = useContext(UserContext);
  const location = useLocation();
  const navigate = useNavigate();
  const { score, totalQuestions, startTime, endTime, gameHistory } = location.state;

  const generateProofOfPractice = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Multiplication Game - Proof of Practice', 10, 20);
    doc.setFontSize(12);
    doc.text(`Student: ${user?.firstName} ${user?.lastName}`, 10, 30);
    doc.text(`School: ${user?.school}`, 10, 40);
    doc.text(`Date: ${startTime.toLocaleDateString()}`, 10, 50);
    doc.text(`Time: ${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}`, 10, 60);
    doc.text(`Duration: ${Math.round((endTime - startTime) / 1000)} seconds`, 10, 70);
    doc.text(`Score: ${score}/${totalQuestions}`, 10, 80);
    doc.text('Practice History:', 10, 90);
    gameHistory.forEach((item, index) => {
      doc.text(item, 20, 100 + index * 10);
    });
    if (user?.profilePicture) {
      doc.addImage(user.profilePicture, 'JPEG', 150, 20, 40, 40);
    }
    doc.save('multiplication_game_proof.pdf');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-center">Game Results</h1>
      <div className="space-y-2">
        <p><strong>Player:</strong> {user?.firstName} {user?.lastName}</p>
        <p><strong>School:</strong> {user?.school}</p>
        <p><strong>Date:</strong> {startTime.toLocaleDateString()}</p>
        <p><strong>Time:</strong> {startTime.toLocaleTimeString()} - {endTime.toLocaleTimeString()}</p>
        <p><strong>Duration:</strong> {Math.round((endTime - startTime) / 1000)} seconds</p>
        <p><strong>Score:</strong> {score}/{totalQuestions}</p>
      </div>
      {user?.profilePicture && (
        <img src={user.profilePicture} alt="Profile" className="w-32 h-32 mx-auto rounded-full" />
      )}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Practice History:</h2>
        {gameHistory.map((item, index) => (
          <p key={index}>{item}</p>
        ))}
      </div>
      <div className="flex justify-between">
        <button
          onClick={() => navigate('/game')}
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition duration-300 flex items-center"
        >
          <ArrowLeft className="mr-2" size={20} />
          New Game
        </button>
        <button
          onClick={generateProofOfPractice}
          className="bg-green-500 text-white p-2 rounded hover:bg-green-600 transition duration-300 flex items-center"
        >
          <Download className="mr-2" size={20} />
          Download Proof
        </button>
      </div>
    </div>
  );
};

export default Proof;