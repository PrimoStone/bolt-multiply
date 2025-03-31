import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Badge, GameType } from '../../types/rewardTypes';
import ImageUploader from './ImageUploader';

/**
 * BadgeManager component
 * Provides an interface for administrators to create, edit, view and delete badges
 * Allows uploading badge images and configuring badge requirements
 */
const BadgeManager: React.FC = () => {
  // State for badges list and form data
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingBadge, setEditingBadge] = useState<Badge | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<Partial<Badge>>({
    name: '',
    description: '',
    iconUrl: '',
    requirements: {
      gameType: undefined,
      minScore: undefined,
      minStreak: undefined,
      maxTime: undefined,
      gamesCompleted: undefined,
      perfectScore: false,
      consecutiveDays: undefined
    },
  });

  // Fetch badges on component mount
  useEffect(() => {
    const fetchBadges = async () => {
      try {
        setLoading(true);
        const badgesCollection = collection(db, 'badges');
        const badgesSnapshot = await getDocs(badgesCollection);
        const badgesList = badgesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Badge[];
        
        setBadges(badgesList);
      } catch (err) {
        console.error('Error fetching badges:', err);
        setError('Failed to load badges');
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
  }, []);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Handle checkbox fields
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        requirements: {
          ...prev.requirements,
          [name]: checked
        }
      }));
      return;
    }
    
    // Handle number fields
    if (type === 'number') {
      const numValue = value === '' ? undefined : parseInt(value, 10);
      setFormData(prev => ({
        ...prev,
        requirements: {
          ...prev.requirements,
          [name]: numValue
        }
      }));
      return;
    }
    
    // Handle requirements fields vs. regular fields
    if (name.includes('.')) {
      const [field, subfield] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [field]: {
          ...prev[field as keyof typeof prev],
          [subfield]: value
        }
      }));
    } else if (name.startsWith('requirements.')) {
      const requirementField = name.replace('requirements.', '');
      setFormData(prev => ({
        ...prev,
        requirements: {
          ...prev.requirements,
          [requirementField]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle image upload
  const handleImageUploaded = (imageUrl: string) => {
    setFormData(prev => ({ ...prev, iconUrl: imageUrl }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      iconUrl: '',
      requirements: {
        gameType: undefined,
        minScore: undefined,
        minStreak: undefined,
        maxTime: undefined,
        gamesCompleted: undefined,
        perfectScore: false,
        consecutiveDays: undefined
      },
    });
    setEditingBadge(null);
  };

  // Open form for editing a badge
  const handleEdit = (badge: Badge) => {
    setEditingBadge(badge);
    setFormData({
      name: badge.name,
      description: badge.description,
      iconUrl: badge.iconUrl,
      requirements: { ...badge.requirements },
    });
    setShowForm(true);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Validate required fields
      if (!formData.name || !formData.description || !formData.iconUrl) {
        setError('Name, description, and image are required');
        setLoading(false);
        return;
      }
      
      // Prepare badge data
      const badgeData = {
        ...formData,
        createdAt: editingBadge?.createdAt || new Date(),
      } as Badge;
      
      if (editingBadge) {
        // Update existing badge
        const badgeRef = doc(db, 'badges', editingBadge.id);
        await updateDoc(badgeRef, badgeData);
        
        // Update badges list
        setBadges(prev => prev.map(b => 
          b.id === editingBadge.id ? { ...badgeData, id: editingBadge.id } : b
        ));
      } else {
        // Add new badge
        const docRef = await addDoc(collection(db, 'badges'), badgeData);
        
        // Update badges list
        setBadges(prev => [...prev, { ...badgeData, id: docRef.id }]);
      }
      
      // Reset form and close
      resetForm();
      setShowForm(false);
      setError(null);
    } catch (err) {
      console.error('Error saving badge:', err);
      setError('Failed to save badge');
    } finally {
      setLoading(false);
    }
  };

  // Handle badge deletion
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this badge?')) {
      return;
    }
    
    try {
      setLoading(true);
      await deleteDoc(doc(db, 'badges', id));
      setBadges(prev => prev.filter(badge => badge.id !== id));
    } catch (err) {
      console.error('Error deleting badge:', err);
      setError('Failed to delete badge');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Badge Management</h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          {showForm ? 'Cancel' : 'Add New Badge'}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      {/* Badge Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
          <h3 className="text-lg font-medium">{editingBadge ? 'Edit Badge' : 'Create New Badge'}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              {/* Basic Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  name="description"
                  value={formData.description || ''}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              {/* Requirements */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700">Requirements</h4>
                
                <div>
                  <label className="block text-sm text-gray-700">Game Type</label>
                  <select
                    name="gameType"
                    value={formData.requirements?.gameType || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Any</option>
                    <option value="addition">Addition</option>
                    <option value="subtraction">Subtraction</option>
                    <option value="multiplication">Multiplication</option>
                    <option value="division">Division</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm text-gray-700">Min Score</label>
                    <input
                      type="number"
                      name="minScore"
                      value={formData.requirements?.minScore || ''}
                      onChange={handleInputChange}
                      min="0"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-700">Min Streak</label>
                    <input
                      type="number"
                      name="minStreak"
                      value={formData.requirements?.minStreak || ''}
                      onChange={handleInputChange}
                      min="0"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-700">Max Time (sec)</label>
                    <input
                      type="number"
                      name="maxTime"
                      value={formData.requirements?.maxTime || ''}
                      onChange={handleInputChange}
                      min="0"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-700">Games Completed</label>
                    <input
                      type="number"
                      name="gamesCompleted"
                      value={formData.requirements?.gamesCompleted || ''}
                      onChange={handleInputChange}
                      min="0"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="perfectScore"
                      name="perfectScore"
                      checked={formData.requirements?.perfectScore || false}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="perfectScore" className="ml-2 block text-sm text-gray-700">
                      Require Perfect Score
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-700">Consecutive Days</label>
                    <input
                      type="number"
                      name="consecutiveDays"
                      value={formData.requirements?.consecutiveDays || ''}
                      onChange={handleInputChange}
                      min="0"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-center justify-start">
              <ImageUploader
                folder="badges"
                onImageUploaded={handleImageUploaded}
                defaultImageUrl={formData.iconUrl}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Badge'}
            </button>
          </div>
        </form>
      )}

      {/* Badges List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium">Available Badges</h3>
        </div>
        
        {loading && !badges.length ? (
          <div className="p-8 text-center text-gray-500">Loading badges...</div>
        ) : badges.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No badges found. Create your first badge!</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Badge
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requirements
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {badges.map((badge) => (
                  <tr key={badge.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={badge.iconUrl}
                            alt={badge.name}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{badge.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">{badge.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        <ul className="list-disc list-inside space-y-1">
                          {badge.requirements.gameType && (
                            <li>Game: {badge.requirements.gameType}</li>
                          )}
                          {badge.requirements.minScore !== undefined && (
                            <li>Min Score: {badge.requirements.minScore}</li>
                          )}
                          {badge.requirements.perfectScore && (
                            <li>Perfect Score Required</li>
                          )}
                          {badge.requirements.gamesCompleted !== undefined && (
                            <li>Games: {badge.requirements.gamesCompleted}</li>
                          )}
                          {badge.requirements.consecutiveDays !== undefined && (
                            <li>Days: {badge.requirements.consecutiveDays}</li>
                          )}
                        </ul>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(badge)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(badge.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BadgeManager;
