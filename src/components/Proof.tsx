import React, { useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import { jsPDF } from 'jspdf';
import { ArrowLeft, Download } from 'lucide-react';

const Proof: React.FC = () => {
  const location = useLocation();
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const { score, totalQuestions, startTime, endTime, gameHistory } = location.state;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {user?.photoURL && (
            <img
              src={user.photoURL}
              alt={`${user.firstName} ${user.lastName}`}
              className="w-12 h-12 rounded-full object-cover"
            />
          )}
          <div>
            <h2 className="text-xl font-bold">{user?.firstName} {user?.lastName}</h2>
            <p className="text-gray-600">
              {new Date(startTime).toLocaleDateString()} {new Date(startTime).toLocaleTimeString()}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{score}/{totalQuestions}</p>
          <p className="text-gray-600">
            Czas: {Math.floor((endTime - startTime) / 1000)} sekund
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 shadow">
        <h3 className="text-lg font-semibold mb-2">Historia odpowiedzi:</h3>
        <div className="space-y-1">
          {gameHistory.map((result, index) => (
            <div 
              key={index}
              className={`p-1 text-sm rounded ${
                result.includes('Correct') ? 'bg-green-100' : 'bg-red-100'
              }`}
            >
              {result}
            </div>
          ))}
        </div>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={() => navigate('/game')}
          className="flex-1 bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition duration-300 print:hidden"
        >
          Zagraj ponownie
        </button>
        <button
          onClick={() => navigate('/leaderboard')}
          className="flex-1 bg-green-500 text-white p-2 rounded hover:bg-green-600 transition duration-300 print:hidden"
        >
          Zobacz ranking
        </button>
        <button
          onClick={handlePrint}
          className="flex-1 bg-purple-500 text-white p-2 rounded hover:bg-purple-600 transition duration-300 print:hidden"
        >
          Wydrukuj
        </button>
      </div>
    </div>
  );
};

export default Proof;