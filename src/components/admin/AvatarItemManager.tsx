import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { AvatarItem, AvatarItemType, TrophyRarity } from '../../types/rewardTypes';
import ImageUploader from './ImageUploader';

/**
 * AvatarItemManager component
 * Provides an interface for administrators to create, edit, view and delete avatar items
 * Allows uploading item images and configuring item properties such as type, cost, and requirements
 */
const AvatarItemManager: React.FC = () => {
  // State for avatar items list and form data
  const [avatarItems, setAvatarItems] = useState<AvatarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<AvatarItem | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<Partial<AvatarItem>>({
    name: '',
    description: '',
    type: 'outfit',
    imageUrl: '',
    cost: 100,
    rarity: 'common',
    unlockRequirement: {
      badgeId: '',
      trophyId: '',
      gameTypeRequired: undefined,
      perfectGames: undefined,
    },
  });

  // Avatar item types and rarity options
  const itemTypes: AvatarItemType[] = ['headband', 'outfit', 'accessory', 'background'];
  const rarityOptions: TrophyRarity[] = ['common', 'uncommon', 'rare', 'very-rare', 'legendary'];

  // Fetch avatar items on component mount
  useEffect(() => {
    const fetchAvatarItems = async () => {
      try {
        setLoading(true);
        const itemsCollection = collection(db, 'avatarItems');
        const itemsSnapshot = await getDocs(itemsCollection);
        const itemsList = itemsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as AvatarItem[];
        
        setAvatarItems(itemsList);
      } catch (err) {
        console.error('Error fetching avatar items:', err);
        setError('Failed to load avatar items');
      } finally {
        setLoading(false);
      }
    };

    fetchAvatarItems();
  }, []);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Handle number fields
    if (type === 'number') {
      const numValue = value === '' ? undefined : parseInt(value, 10);
      
      if (name.startsWith('unlockRequirement.')) {
        const requirementField = name.replace('unlockRequirement.', '');
        setFormData(prev => ({
          ...prev,
          unlockRequirement: {
            ...prev.unlockRequirement,
            [requirementField]: numValue
          }
        }));
      } else {
        setFormData(prev => ({ ...prev, [name]: numValue }));
      }
      return;
    }
    
    // Handle unlock requirement fields vs. regular fields
    if (name.startsWith('unlockRequirement.')) {
      const requirementField = name.replace('unlockRequirement.', '');
      setFormData(prev => ({
        ...prev,
        unlockRequirement: {
          ...prev.unlockRequirement,
          [requirementField]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
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
      type: 'outfit',
      imageUrl: '',
      cost: 100,
      rarity: 'common',
      unlockRequirement: {
        badgeId: '',
        trophyId: '',
        gameTypeRequired: undefined,
        perfectGames: undefined,
      },
    });
    setEditingItem(null);
  };

  // Open form for editing an avatar item
  const handleEdit = (item: AvatarItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      type: item.type,
      imageUrl: item.imageUrl,
      cost: item.cost,
      rarity: item.rarity,
      unlockRequirement: { ...item.unlockRequirement },
    });
    setShowForm(true);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Validate required fields
      if (!formData.name || !formData.description || !formData.imageUrl || formData.cost === undefined) {
        setError('Name, description, image, and cost are required');
        setLoading(false);
        return;
      }
      
      // Prepare avatar item data
      const itemData = {
        ...formData,
        createdAt: editingItem?.createdAt || new Date(),
      } as AvatarItem;
      
      if (editingItem) {
        // Update existing avatar item
        const itemRef = doc(db, 'avatarItems', editingItem.id);
        await updateDoc(itemRef, itemData);
        
        // Update avatar items list
        setAvatarItems(prev => prev.map(item => 
          item.id === editingItem.id ? { ...itemData, id: editingItem.id } : item
        ));
      } else {
        // Add new avatar item
        const docRef = await addDoc(collection(db, 'avatarItems'), itemData);
        
        // Update avatar items list
        setAvatarItems(prev => [...prev, { ...itemData, id: docRef.id }]);
      }
      
      // Reset form and close
      resetForm();
      setShowForm(false);
      setError(null);
    } catch (err) {
      console.error('Error saving avatar item:', err);
      setError('Failed to save avatar item');
    } finally {
      setLoading(false);
    }
  };

  // Handle avatar item deletion
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this avatar item?')) {
      return;
    }
    
    try {
      setLoading(true);
      await deleteDoc(doc(db, 'avatarItems', id));
      setAvatarItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Error deleting avatar item:', err);
      setError('Failed to delete avatar item');
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

  // Helper function to format item type for display
  const formatItemType = (type: AvatarItemType): string => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Avatar Item Management</h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          {showForm ? 'Cancel' : 'Add New Item'}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      {/* Avatar Item Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
          <h3 className="text-lg font-medium">{editingItem ? 'Edit Avatar Item' : 'Create New Avatar Item'}</h3>
          
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
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select
                    name="type"
                    value={formData.type || 'outfit'}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    {itemTypes.map(type => (
                      <option key={type} value={type}>
                        {formatItemType(type)}
                      </option>
                    ))}
                  </select>
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
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Cost (Coins)</label>
                <input
                  type="number"
                  name="cost"
                  value={formData.cost || ''}
                  onChange={handleInputChange}
                  min="0"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              {/* Special Unlock Requirements */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700">Special Unlock Requirements (Optional)</h4>
                <p className="text-xs text-gray-500">In addition to the coin cost, you can set additional requirements to unlock this item</p>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm text-gray-700">Required Badge ID</label>
                    <input
                      type="text"
                      name="unlockRequirement.badgeId"
                      value={formData.unlockRequirement?.badgeId || ''}
                      onChange={handleInputChange}
                      placeholder="Badge ID"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-700">Required Trophy ID</label>
                    <input
                      type="text"
                      name="unlockRequirement.trophyId"
                      value={formData.unlockRequirement?.trophyId || ''}
                      onChange={handleInputChange}
                      placeholder="Trophy ID"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm text-gray-700">Game Type Required</label>
                    <select
                      name="unlockRequirement.gameTypeRequired"
                      value={formData.unlockRequirement?.gameTypeRequired || ''}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">None</option>
                      <option value="addition">Addition</option>
                      <option value="subtraction">Subtraction</option>
                      <option value="multiplication">Multiplication</option>
                      <option value="division">Division</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-700">Perfect Games Required</label>
                    <input
                      type="number"
                      name="unlockRequirement.perfectGames"
                      value={formData.unlockRequirement?.perfectGames || ''}
                      onChange={handleInputChange}
                      min="0"
                      placeholder="Number of perfect games"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-center justify-start">
              <ImageUploader
                folder="avatarItems"
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
              {loading ? 'Saving...' : 'Save Item'}
            </button>
          </div>
        </form>
      )}

      {/* Avatar Items List - grouped by type */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium">Available Avatar Items</h3>
        </div>
        
        {loading && !avatarItems.length ? (
          <div className="p-8 text-center text-gray-500">Loading avatar items...</div>
        ) : avatarItems.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No avatar items found. Create your first item!</div>
        ) : (
          <div>
            {/* Group items by type for better organization */}
            {itemTypes.map(type => {
              const typeItems = avatarItems.filter(item => item.type === type);
              if (typeItems.length === 0) return null;
              
              return (
                <div key={type} className="mb-6">
                  <h4 className="px-6 py-2 bg-gray-100 font-medium text-gray-700">{formatItemType(type)} Items</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Item
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cost & Rarity
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Special Requirements
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {typeItems.map((item) => (
                          <tr key={item.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <img
                                    className="h-10 w-10 rounded object-cover"
                                    src={item.imageUrl}
                                    alt={item.name}
                                  />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-500">{item.description}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{item.cost} coins</div>
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRarityColorClass(item.rarity)}`}>
                                {item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {item.unlockRequirement && (
                                <div className="text-sm text-gray-500">
                                  <ul className="list-disc list-inside space-y-1">
                                    {item.unlockRequirement.badgeId && (
                                      <li>Badge: {item.unlockRequirement.badgeId}</li>
                                    )}
                                    {item.unlockRequirement.trophyId && (
                                      <li>Trophy: {item.unlockRequirement.trophyId}</li>
                                    )}
                                    {item.unlockRequirement.gameTypeRequired && (
                                      <li>Game: {item.unlockRequirement.gameTypeRequired}</li>
                                    )}
                                    {item.unlockRequirement.perfectGames !== undefined && (
                                      <li>Perfect Games: {item.unlockRequirement.perfectGames}</li>
                                    )}
                                  </ul>
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => handleEdit(item)}
                                className="text-blue-600 hover:text-blue-900 mr-4"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
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
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AvatarItemManager;
