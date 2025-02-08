import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  photoURL?: string;
  coins: number;
}

interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  coins: number;
  updateCoins: (amount: number) => Promise<void>;
}

// Create the context
export const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  coins: 0,
  updateCoins: async () => {},
});

// Custom hook for using the context
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [coins, setCoins] = useState(0);

  useEffect(() => {
    if (user?.id) {
      const fetchUserData = async () => {
        const userDoc = await getDoc(doc(db, 'users', user.id));
        if (userDoc.exists()) {
          setCoins(userDoc.data()?.coins || 0);
        }
      };
      fetchUserData();
    } else {
      setCoins(0);
    }
  }, [user?.id]);

  const updateCoins = async (amount: number) => {
    if (!user) return;
    
    const newCoins = Math.max(0, coins + amount);
    setCoins(newCoins);
    
    try {
      await updateDoc(doc(db, 'users', user.id), {
        coins: newCoins
      });
    } catch (error) {
      console.error('Error updating coins:', error);
      // Rollback on error
      setCoins(coins);
      throw error;
    }
  };

  const value = {
    user,
    setUser,
    coins,
    updateCoins
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;