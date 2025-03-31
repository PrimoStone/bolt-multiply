import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Trophy, TrophyRarity } from '../../types/rewardTypes';
import ImageUploader from './ImageUploader';

/**
 * TrophyManager component
 * Provides an interface for administrators to create, edit, view and delete trophies
 * Allows uploading trophy images and configuring trophy requirements and rarity
 */
const TrophyManager: React.FC = () => {
  // State for trophies list and form data
  const [trophies, setTrophies] = useState<Trophy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTrophy, setEditingTrophy] = useState<Trophy | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<Partial<Trophy>>({
    name: '',
    description: '',
    imageUrl: '',
    rarity: 'common',
    requirements: {
      gamesCompleted: 0,
      minAccuracy: undefined,
      specificBadges: [],
      minCoins: undefined,
    },
  });

  // Trophy rarity options
  const rarityOptions: TrophyRarity[] = ['common', 'uncommon', 'rare', 'very-rare', 'legendary'];

  // Fetch trophies on component mount
  useEffect(() => {
    const fetchTrophies = async () => {
      try {
        setLoading(true);
        const trophiesCollection = collection(db, 'trophies');
        const trophiesSnapshot = await getDocs(trophiesCollection);
        const trophiesList = trophiesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Trophy[];
        
        setTrophies(trophiesList);
      } catch (err) {
        console.error('Error fetching trophies:', err);
        setError('Failed to load trophies');
      } finally {
        setLoading(false);
      }
    };

    fetchTrophies();
  }, []);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Handle number fields
    if (type === 'number') {
      const numValue = value === '' ? undefined : parseInt(value, 10);
      
      if (name.startsWith('requirements.')) {
        const requirementField = name.replace('requirements.', '');
        setFormData(prev => ({
          ...prev,
          requirements: {
            ...prev.requirements,
            [requirementField]: numValue
          }
        }));
      } else {
        setFormData(prev => ({ ...prev, [name]: numValue }));
      }
      return;
    }
    
    // Handle requirements fields vs. regular fields
    if (name.startsWith('requirements.')) {
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

  // Handle specific badges input (comma-separated)
  const handleBadgesInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const badgesString = e.target.value;
    const badgesArray = badgesString.split(',').map(b => b.trim()).filter(b => b);
    
    setFormData(prev => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        specificBadges: badgesArray
      }
    }));
  };

  // Handle image upload
  const handleImageUploaded = (imageUrl: string) => {
    setFormData(prev => ({ ...prev, imageUrl }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      imageUrl: '',
      rarity: 'common',
      requirements: {
        gamesCompleted: 0,
        minAccuracy: undefined,
        specificBadges: [],
        minCoins: undefined,
      },
    });
    setEditingTrophy(null);
  };

  // Open form for editing a trophy
  const handleEdit = (trophy: Trophy) => {
    setEditingTrophy(trophy);
    setFormData({
      name: trophy.name,
      description: trophy.description,
      imageUrl: trophy.imageUrl,
      rarity: trophy.rarity,
      requirements: { ...trophy.requirements },
    });
    setShowForm(true);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Validate required fields
      if (!formData.name || !formData.description || !formData.imageUrl) {
        setError('Name, description, and image are required');
        setLoading(false);
        return;
      }
      
      // Prepare trophy data
      const trophyData = {
        ...formData,
        createdAt: editingTrophy?.createdAt || new Date(),
      } as Trophy;
      
      if (editingTrophy) {
        // Update existing trophy
        const trophyRef = doc(db, 'trophies', editingTrophy.id);
        await updateDoc(trophyRef, trophyData);
        
        // Update trophies list
        setTrophies(prev => prev.map(t => 
          t.id === editingTrophy.id ? { ...trophyData, id: editingTrophy.id } : t
        ));
      } else {
        // Add new trophy
        const docRef = await addDoc(collection(db, 'trophies'), trophyData);
        
        // Update trophies list
        setTrophies(prev => [...prev, { ...trophyData, id: docRef.id }]);
      }
      
      // Reset form and close
      resetForm();
      setShowForm(false);
      setError(null);
    } catch (err) {
      console.error('Error saving trophy:', err);
      setError('Failed to save trophy');
    } finally {
      setLoading(false);
    }
  };

  // Handle trophy deletion
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this trophy?')) {
      return;
    }
    
    try {
      setLoading(true);
      await deleteDoc(doc(db, 'trophies', id));
      setTrophies(prev => prev.filter(trophy => trophy.id !== id));
    } catch (err) {
      console.error('Error deleting trophy:', err);
      setError('Failed to delete trophy');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get color class based on rarity
  const getRarityColorClass = (rarity: TrophyRarity): string => {
    switch (rarity) {
      case 'common': return 'bg-gray-200 text-gray-800';
      case 'uncommon': return 'bg-green-200 text-green-800';
      case 'rare': return 'bg-blue-200 text-blue-800';
      case 'very-rare': return 'bg-purple-200 text-purple-800';
      case 'legendary': return 'bg-yellow-200 text-yellow-800';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Trophy Management</h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          {showForm ? 'Cancel' : 'Add New Trophy'}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      {/* Trophy Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
          <h3 className="text-lg font-medium">{editingTrophy ? 'Edit Trophy' : 'Create New Trophy'}</h3>
          
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Rarity</label>
                <select
                  name="rarity"
                  value={formData.rarity || 'common'}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {rarityOptions.map(rarity => (
                    <option key={rarity} value={rarity}>
                      {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Requirements */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700">Requirements</h4>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm text-gray-700">Games Completed</label>
                    <input
                      type="number"
                      name="requirements.gamesCompleted"
                      value={formData.requirements?.gamesCompleted || ''}
                      onChange={handleInputChange}
                      min="0"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-700">Min Accuracy (%)</label>
                    <input
                      type="number"
                      name="requirements.minAccuracy"
                      value={formData.requirements?.minAccuracy || ''}
                      onChange={handleInputChange}
                      min="0"
                      max="100"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-700">Min Coins</label>
                    <input
                      type="number"
                      name="requirements.minCoins"
                      value={formData.requirements?.minCoins || ''}
                      onChange={handleInputChange}
                      min="0"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-700">Required Badges (comma-separated IDs)</label>
                  <input
                    type="text"
                    value={formData.requirements?.specificBadges?.join(', ') || ''}
                    onChange={handleBadgesInput}
                    placeholder="badge1, badge2, badge3"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-center justify-start">
              <ImageUploader
                folder="trophies"
                onImageUploaded={handleImageUploaded}
                defaultImageUrl={formData.imageUrl}
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
              {loading ? 'Saving...' : 'Save Trophy'}
            </button>
          </div>
        </form>
      )}

      {/* Trophies List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium">Available Trophies</h3>
        </div>
        
        {loading && !trophies.length ? (
          <div className="p-8 text-center text-gray-500">Loading trophies...</div>
        ) : trophies.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No trophies found. Create your first trophy!</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trophy
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rarity
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
                {trophies.map((trophy) => (
                  <tr key={trophy.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={trophy.imageUrl}
                            alt={trophy.name}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{trophy.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">{trophy.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRarityColorClass(trophy.rarity)}`}>
                        {trophy.rarity.charAt(0).toUpperCase() + trophy.rarity.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        <ul className="list-disc list-inside space-y-1">
                          <li>Games: {trophy.requirements.gamesCompleted}</li>
                          {trophy.requirements.minAccuracy !== undefined && (
                            <li>Min Accuracy: {trophy.requirements.minAccuracy}%</li>
                          )}
                          {trophy.requirements.minCoins !== undefined && (
                            <li>Min Coins: {trophy.requirements.minCoins}</li>
                          )}
                          {trophy.requirements.specificBadges && trophy.requirements.specificBadges.length > 0 && (
                            <li>Badges: {trophy.requirements.specificBadges.join(', ')}</li>
                          )}
                        </ul>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(trophy)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(trophy.id)}
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

export default TrophyManager;
