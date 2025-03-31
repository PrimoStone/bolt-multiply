import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useUser } from '../contexts/UserContext';
import { Navigate } from 'react-router-dom';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { addAllRewards } from '../scripts/add-rewards';
import { addStandardAvatars } from '../scripts/add-standard-avatars';
import FirebaseImageProxy from '../components/avatar/FirebaseImageProxy';

// Admin panel tabs definition
type AdminTabType = 'badges' | 'trophies' | 'avatarItems' | 'avatars';

// Item types
type ItemType = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  displayImageUrl?: string;
  createdAt: Date;
  [key: string]: any; // Allow additional properties
};

/**
 * AdminPanel component provides an interface for administrators to manage
 * the visual assets of the reward system including badges, trophies, and avatar items.
 */
const AdminPanel: React.FC = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<AdminTabType>('badges');
  const [items, setItems] = useState<ItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    displayImageUrl: '',
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [addingStandardRewards, setAddingStandardRewards] = useState(false);
  const [standardRewardsMessage, setStandardRewardsMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [addingStandardAvatars, setAddingStandardAvatars] = useState(false);
  const [standardAvatarsMessage, setStandardAvatarsMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Check if user has admin privileges (simplified check - should be more robust in production)
  const isAdmin = user?.id === 'admin123' || process.env.NODE_ENV === 'development';

  // Get collection name based on active tab
  const getCollectionName = (): string => {
    switch (activeTab) {
      case 'badges': return 'badges';
      case 'trophies': return 'trophies';
      case 'avatarItems': return 'avatarItems';
      case 'avatars': return 'avatars';
      default: return 'badges';
    }
  };

  // Fetch items when tab changes
  useEffect(() => {
    fetchItems();
  }, [activeTab]);

  // Fetch items from Firestore
  const fetchItems = async () => {
    try {
      setLoading(true);
      const collectionName = getCollectionName();
      const itemsCollection = collection(db, collectionName);
      const itemsSnapshot = await getDocs(itemsCollection);
      const itemsList = itemsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as ItemType[];
      
      setItems(itemsList);
    } catch (err) {
      console.error(`Error fetching ${activeTab}:`, err);
      setError(`Failed to load ${activeTab}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Generate a unique ID based on timestamp and random number
  const generateUniqueId = () => {
    return `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file type
    if (!file.type.match('image.*')) {
      setError('Please select an image file (PNG, JPG, JPEG, GIF)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      setError(null);
      setUploadProgress(0);

      // Generate a unique filename
      const fileName = `${generateUniqueId()}-${file.name}`;
      const storage = getStorage();
      
      // Set storage reference with custom metadata to help with CORS
      const storageRef = ref(storage, `${activeTab}/${fileName}`);
      const metadata = {
        contentType: file.type,
        customMetadata: {
          'Access-Control-Allow-Origin': '*'
        }
      };

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + 10;
          if (newProgress >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return newProgress;
        });
      }, 200);

      // Upload the file with metadata
      await uploadBytes(storageRef, file, metadata);
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Get download URL
      const url = await getDownloadURL(storageRef);
      
      // Use placeholder if CORS issue detected
      if (url.includes('firebasestorage.googleapis.com')) {
        // Create a fallback URL with the file name for display purposes
        const fallbackUrl = `https://via.placeholder.com/150?text=${encodeURIComponent(file.name.split('.')[0])}`;
        setFormData(prev => ({ 
          ...prev, 
          imageUrl: url,
          // Store both URLs - the real one for database and fallback for display
          displayImageUrl: fallbackUrl
        }));
      } else {
        setFormData(prev => ({ ...prev, imageUrl: url }));
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      imageUrl: '',
      displayImageUrl: '',
    });
    setEditingItem(null);
  };

  // Open form for editing an item
  const handleEdit = (item: ItemType) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      imageUrl: item.imageUrl,
      displayImageUrl: item.displayImageUrl || item.imageUrl,
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
      
      const collectionName = getCollectionName();
      
      // Prepare item data
      const itemData = {
        ...formData,
        createdAt: editingItem?.createdAt || new Date(),
      };
      
      if (editingItem) {
        // Update existing item
        const itemRef = doc(db, collectionName, editingItem.id);
        await updateDoc(itemRef, itemData);
        
        // Update items list
        setItems(prev => prev.map(item => 
          item.id === editingItem.id ? { ...itemData, id: editingItem.id } as ItemType : item
        ));
      } else {
        // Add new item
        const docRef = await addDoc(collection(db, collectionName), itemData);
        
        // Update items list
        setItems(prev => [...prev, { ...itemData, id: docRef.id } as ItemType]);
      }
      
      // Reset form and close
      resetForm();
      setShowForm(false);
      setError(null);
    } catch (err) {
      console.error(`Error saving ${activeTab.slice(0, -1)}:`, err);
      setError(`Failed to save ${activeTab.slice(0, -1)}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle item deletion
  const handleDelete = async (id: string) => {
    if (!window.confirm(`Are you sure you want to delete this ${activeTab.slice(0, -1)}?`)) {
      return;
    }
    
    try {
      setLoading(true);
      const collectionName = getCollectionName();
      await deleteDoc(doc(db, collectionName, id));
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error(`Error deleting ${activeTab.slice(0, -1)}:`, err);
      setError(`Failed to delete ${activeTab.slice(0, -1)}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle adding standard rewards
  const handleAddStandardRewards = async () => {
    try {
      setAddingStandardRewards(true);
      setStandardRewardsMessage(null);
      
      // Call the function to add all standard rewards
      const result = await addAllRewards();
      
      if (result.success) {
        setStandardRewardsMessage({
          type: 'success',
          text: 'Standard rewards added successfully! Refresh the page to see them.'
        });
        // Refresh the current tab's items
        fetchItems();
      } else {
        setStandardRewardsMessage({
          type: 'error',
          text: `Error adding standard rewards: ${result.message}`
        });
      }
    } catch (error) {
      console.error('Error adding standard rewards:', error);
      setStandardRewardsMessage({
        type: 'error',
        text: 'An unexpected error occurred while adding standard rewards.'
      });
    } finally {
      setAddingStandardRewards(false);
    }
  };

  // Handle adding standard avatars
  const handleAddStandardAvatars = async () => {
    try {
      setAddingStandardAvatars(true);
      setStandardAvatarsMessage(null);
      
      // Call the function to add standard avatars
      const result = await addStandardAvatars();
      
      if (result.success) {
        setStandardAvatarsMessage({
          type: 'success',
          text: 'Standard avatars added successfully! Refresh the page to see them.'
        });
        // Refresh the current tab's items if we're on the avatars tab
        if (activeTab === 'avatars') {
          fetchItems();
        }
      } else {
        setStandardAvatarsMessage({
          type: 'error',
          text: `Error adding standard avatars: ${result.message}`
        });
      }
    } catch (error) {
      console.error('Error adding standard avatars:', error);
      setStandardAvatarsMessage({
        type: 'error',
        text: 'An unexpected error occurred while adding standard avatars.'
      });
    } finally {
      setAddingStandardAvatars(false);
    }
  };

  // Redirect non-admin users
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <Helmet>
        <title>Admin Panel - NumberNinjas</title>
      </Helmet>

      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-blue-600 text-white p-4">
          <h1 className="text-2xl font-bold">NumberNinjas Admin Panel</h1>
          <p className="text-sm opacity-80">Manage rewards, achievements, and avatar items</p>
        </div>

        {/* Standard Rewards Button */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-gray-800">Standard Rewards</h2>
              <p className="text-sm text-gray-600">Add all standard rewards as defined in the REWARD_SYSTEM_PLAN.md</p>
            </div>
            <button
              onClick={handleAddStandardRewards}
              disabled={addingStandardRewards}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:opacity-50"
            >
              {addingStandardRewards ? 'Adding...' : 'Add Standard Rewards'}
            </button>
          </div>
          
          {/* Standard rewards message */}
          {standardRewardsMessage && (
            <div className={`mt-3 p-3 rounded ${
              standardRewardsMessage.type === 'success' 
                ? 'bg-green-100 text-green-700 border border-green-400' 
                : 'bg-red-100 text-red-700 border border-red-400'
            }`}>
              {standardRewardsMessage.text}
            </div>
          )}
        </div>

        {/* Standard Avatars Button */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-gray-800">Standard Avatars</h2>
              <p className="text-sm text-gray-600">Add all standard avatars as defined in the REWARD_SYSTEM_PLAN.md</p>
            </div>
            <button
              onClick={handleAddStandardAvatars}
              disabled={addingStandardAvatars}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:opacity-50"
            >
              {addingStandardAvatars ? 'Adding...' : 'Add Standard Avatars'}
            </button>
          </div>
          
          {/* Standard avatars message */}
          {standardAvatarsMessage && (
            <div className={`mt-3 p-3 rounded ${
              standardAvatarsMessage.type === 'success' 
                ? 'bg-green-100 text-green-700 border border-green-400' 
                : 'bg-red-100 text-red-700 border border-red-400'
            }`}>
              {standardAvatarsMessage.text}
            </div>
          )}
        </div>

        {/* Custom tabs implementation */}
        <div className="p-4">
          {/* Tab headers */}
          <div className="flex border-b border-gray-200 mb-4">
            <button 
              onClick={() => setActiveTab('badges')}
              className={`px-4 py-2 focus:outline-none ${
                activeTab === 'badges' 
                  ? 'border-b-2 border-blue-500 text-blue-600 font-medium' 
                  : 'text-gray-600 hover:text-blue-500'
              }`}
            >
              Badges
            </button>
            <button 
              onClick={() => setActiveTab('trophies')}
              className={`px-4 py-2 focus:outline-none ${
                activeTab === 'trophies' 
                  ? 'border-b-2 border-blue-500 text-blue-600 font-medium' 
                  : 'text-gray-600 hover:text-blue-500'
              }`}
            >
              Trophies
            </button>
            <button 
              onClick={() => setActiveTab('avatarItems')}
              className={`px-4 py-2 focus:outline-none ${
                activeTab === 'avatarItems' 
                  ? 'border-b-2 border-blue-500 text-blue-600 font-medium' 
                  : 'text-gray-600 hover:text-blue-500'
              }`}
            >
              Avatar Items
            </button>
            <button 
              onClick={() => setActiveTab('avatars')}
              className={`px-4 py-2 focus:outline-none ${
                activeTab === 'avatars' 
                  ? 'border-b-2 border-blue-500 text-blue-600 font-medium' 
                  : 'text-gray-600 hover:text-blue-500'
              }`}
            >
              Avatars
            </button>
          </div>

          {/* Tab content */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">
                {activeTab === 'badges' ? 'Badge' : 
                 activeTab === 'trophies' ? 'Trophy' : 
                 activeTab === 'avatarItems' ? 'Avatar Item' : 'Avatar'} Management
              </h2>
              <button
                onClick={() => {
                  resetForm();
                  setShowForm(!showForm);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                {showForm ? 'Cancel' : `Add New ${activeTab === 'badges' ? 'Badge' : 
                                        activeTab === 'trophies' ? 'Trophy' : 
                                        activeTab === 'avatarItems' ? 'Avatar Item' : 'Avatar'}`}
              </button>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                {error}
              </div>
            )}

            {/* Item Form */}
            {showForm && (
              <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
                <h3 className="text-lg font-medium">
                  {editingItem ? `Edit ${activeTab === 'badges' ? 'Badge' : 
                                 activeTab === 'trophies' ? 'Trophy' : 
                                 activeTab === 'avatarItems' ? 'Avatar Item' : 'Avatar'}` : 
                                `Create New ${activeTab === 'badges' ? 'Badge' : 
                                            activeTab === 'trophies' ? 'Trophy' : 
                                            activeTab === 'avatarItems' ? 'Avatar Item' : 'Avatar'}`}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    {/* Basic Info */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={3}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center justify-start">
                    {/* Image Upload */}
                    <div className="flex flex-col items-center space-y-4">
                      {/* Image preview */}
                      <div className="w-40 h-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
                        {formData.imageUrl ? (
                          <FirebaseImageProxy
                            src={formData.imageUrl}
                            alt={formData.name}
                            className="w-full h-full object-contain"
                            fallbackSrc={`https://via.placeholder.com/150?text=${encodeURIComponent(formData.name.charAt(0))}`}
                          />
                        ) : (
                          <div className="text-center text-gray-500">
                            <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="mt-2 text-sm">No image selected</p>
                          </div>
                        )}
                      </div>

                      {/* File input */}
                      <input
                        type="file"
                        id="image-upload"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="image-upload"
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none cursor-pointer disabled:opacity-50"
                      >
                        {uploadingImage ? 'Uploading...' : (formData.imageUrl ? 'Change Image' : 'Upload Image')}
                      </label>

                      {/* Progress bar */}
                      {uploadingImage && (
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-600 transition-all duration-300 ease-out"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      )}
                    </div>
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
                    disabled={loading || uploadingImage}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            )}

            {/* Items List */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-medium">Available {activeTab}</h3>
              </div>
              
              {loading && !items.length ? (
                <div className="p-8 text-center text-gray-500">Loading {activeTab}...</div>
              ) : items.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No {activeTab} found. Create your first one!</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Image
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex-shrink-0 h-10 w-10">
                              <FirebaseImageProxy
                                src={item.imageUrl}
                                alt={item.name}
                                className="h-10 w-10 rounded-full object-cover"
                                fallbackSrc={`https://via.placeholder.com/150?text=${encodeURIComponent(item.name.charAt(0))}`}
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-500">{item.description}</div>
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
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
