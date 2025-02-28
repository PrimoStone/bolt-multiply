import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { doc, getDoc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * User interface representing a user in the system
 */
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  photoURL?: string;
  coins: number;
}

/**
 * Transaction types for coin operations
 */
export type TransactionType = 'REWARD' | 'DAILY_BONUS' | 'PURCHASE';

/**
 * UserContext interface defining available context properties and methods
 */
interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  coins: number;
  updateCoins: (amount: number, type: TransactionType, description: string) => Promise<void>;
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

/**
 * UserProvider component that manages user state and provides context
 */
export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    // Try to load user from localStorage on initial render
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        // Ensure coins property exists (for backward compatibility with existing users)
        if (parsedUser && typeof parsedUser.coins === 'undefined') {
          parsedUser.coins = 0;
        }
        return parsedUser;
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
        localStorage.removeItem('user');
        return null;
      }
    }
    return null;
  });

  // Derive coins from user for context value - ensure it's always a number
  const coins = user?.coins || 0;

  // Save user to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  /**
   * Update user's coin balance and log the transaction
   * @param amount - Number of coins to add (positive) or subtract (negative)
   * @param type - Type of transaction (REWARD, DAILY_BONUS, PURCHASE)
   * @param description - Description of the transaction
   */
  const updateCoins = async (
    amount: number,
    type: TransactionType = 'REWARD',
    description: string = 'Game reward'
  ) => {
    if (!user) return;
    
    try {
      // Calculate new coin balance (never go below 0)
      const newCoins = Math.max(0, user.coins + amount);
      
      // Update user's coin balance in Firestore
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        coins: newCoins
      });

      // Log the transaction
      await addDoc(collection(db, 'coinTransactions'), {
        userId: user.id,
        amount,
        type,
        description,
        timestamp: new Date()
      });

      // Update local user state with new coin balance
      setUser(prevUser => {
        if (!prevUser) return null;
        const updatedUser = { ...prevUser, coins: newCoins };
        
        // Save updated user to localStorage for persistence
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        return updatedUser;
      });
      
      console.log(`Coins updated: ${amount} (${type}). New balance: ${newCoins}`);
    } catch (error) {
      console.error('Error updating coins:', error);
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