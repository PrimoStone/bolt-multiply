import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useUser } from '../contexts/UserContext';
import { CoinTransaction } from '../types/coinTypes';
import { Coins, TrendingUp, Gift, ShoppingCart } from 'lucide-react';

const TRANSACTION_ICONS = {
  REWARD: TrendingUp,
  DAILY_BONUS: Gift,
  STREAK_BONUS: TrendingUp,
  PURCHASE: ShoppingCart,
};

const CoinHistory: React.FC = () => {
  const { user } = useUser();
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user) return;

      try {
        const transactionsRef = collection(db, 'coinTransactions');
        const q = query(
          transactionsRef,
          where('userId', '==', user.id),
          orderBy('timestamp', 'desc'),
          limit(10)
        );

        const querySnapshot = await getDocs(q);
        const fetchedTransactions = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp.toDate(),
        })) as CoinTransaction[];

        setTransactions(fetchedTransactions);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <Coins className="w-5 h-5 mr-2 text-yellow-500" />
        Recent Transactions
      </h2>

      {transactions.length === 0 ? (
        <p className="text-gray-500 text-center py-4">
          No transactions yet
        </p>
      ) : (
        <div className="space-y-3">
          {transactions.map((transaction) => {
            const Icon = TRANSACTION_ICONS[transaction.type];
            return (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${
                    transaction.amount >= 0 ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <Icon className={`w-4 h-4 ${
                      transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-gray-500">
                      {transaction.timestamp.toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className={`font-semibold ${
                  transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.amount >= 0 ? '+' : ''}{transaction.amount}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CoinHistory;
