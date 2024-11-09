import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const TitlePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-orange-200 to-orange-300">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <img 
          src="/number-ninjas-logo.png"
          alt="Number Ninjas"
          className="w-[600px] mb-12 mx-auto"
        />
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/login')}
          className="bg-blue-600 text-white px-16 py-4 rounded-full text-2xl font-bold 
                   shadow-lg hover:bg-blue-700 transition duration-300"
        >
          Start
        </motion.button>
      </motion.div>
    </div>
  );
};

export default TitlePage;
