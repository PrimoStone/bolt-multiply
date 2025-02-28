import React, { useState } from 'react';
import { migrateUsersToIncludeCoins } from '../firebase/migrations';

/**
 * AdminTools component for running database migrations and other admin tasks
 * Only accessible to admin users
 */
const AdminTools: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleMigrateUsers = async () => {
    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const updatedCount = await migrateUsersToIncludeCoins();
      setResult(`Successfully updated ${updatedCount} users to include coins field`);
    } catch (err) {
      setError(`Error migrating users: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Admin Tools</h2>
      
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-3">Database Migrations</h3>
        
        <div className="p-4 border rounded-md bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Migrate Users to Include Coins</h4>
              <p className="text-sm text-gray-600 mt-1">
                Updates all existing users to include the coins field with a default value of 0.
              </p>
            </div>
            <button
              onClick={handleMigrateUsers}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
            >
              {isLoading ? 'Running...' : 'Run Migration'}
            </button>
          </div>
          
          {result && (
            <div className="mt-3 p-3 bg-green-100 text-green-800 rounded-md">
              {result}
            </div>
          )}
          
          {error && (
            <div className="mt-3 p-3 bg-red-100 text-red-800 rounded-md">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTools;
