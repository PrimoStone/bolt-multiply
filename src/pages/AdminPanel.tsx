import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useUser } from '../contexts/UserContext';
import { Navigate } from 'react-router-dom';
import { collection, getDocs, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { addAllRewards } from '../scripts/add-rewards';
import { addStandardAvatars } from '../scripts/add-standard-avatars';
import FirebaseImageProxy from '../components/avatar/FirebaseImageProxy';
import { convertToBase64 } from '../firebase/utils';

// Admin panel tabs definition
type AdminTabType = 'badges' | 'trophies' | 'avatarItems' | 'avatars';

// Interface for items in the admin panel
interface ItemType {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  displayImageUrl?: string;
  category?: string;
  isDefault?: boolean;
  createdAt: Date;
  [key: string]: any; // Allow for additional properties
}

// Global variable to store avatars for sharing between components
let globalAvatarsList: ItemType[] = [];

// Function to get the global avatars list
export const getGlobalAvatars = () => {
  return globalAvatarsList;
};

/**
 * AdminPanel component
 * Provides an interface for managing game content
 */
const AdminPanel: React.FC = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<AdminTabType>('avatars');
  const [items, setItems] = useState<ItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemType | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [addingStandardRewards, setAddingStandardRewards] = useState(false);
  const [isDefault, setIsDefault] = useState(false);
  const [existingCategories, setExistingCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [standardRewardsMessage, setStandardRewardsMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [standardAvatarsMessage, setStandardAvatarsMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [addingStandardAvatars, setAddingStandardAvatars] = useState(false);
  
  // Initialize form data with empty values
  const [formData, setFormData] = useState({ 
    name: '', 
    description: '', 
    imageUrl: '', 
    displayImageUrl: '', 
    category: '',
    isDefault: false,
    createdAt: new Date()
  });

  // Check if user has admin privileges
  // In production, we need to check for specific admin user IDs or names
  // You can add more admin identifiers to this array as needed
  const adminUsers = ['admin@example.com', 'test@example.com', 'admin', 'Primo'];
  
  // Always allow access in development mode or if user matches admin identifiers
  const isAdmin = true; // Always allow access during development
  /* Uncomment for production:
  const isAdmin = user && (
    adminUsers.includes(user.email || '') || 
    adminUsers.includes(user.displayName || '') ||
    adminUsers.includes(user.id || '')
  );
  */

  // Redirect non-admin users
  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  // Get the collection name based on the active tab
  const getCollectionName = () => {
    return activeTab;
  };

  // Reset form to initial state
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      imageUrl: '',
      displayImageUrl: '',
      category: '',
      isDefault: false,
      createdAt: new Date()
    });
    setEditingItem(null);
    setUploadProgress(0);
  };

  // Function to get the initial form data based on the active tab
  const getInitialFormData = () => {
    switch (activeTab) {
      case 'avatars':
        return { 
          name: '', 
          description: '', 
          imageUrl: '', 
          displayImageUrl: '', 
          category: '',
          isDefault: false,
          createdAt: new Date()
        };
      default:
        return { name: '', description: '', imageUrl: '', displayImageUrl: '', category: '' };
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
      setError(null);
      
      const collectionName = getCollectionName();
      const itemsCollection = collection(db, collectionName);
      const snapshot = await getDocs(itemsCollection);
      
      const itemsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ItemType[];
      
      // If fetching avatars, update the global list
      if (activeTab === 'avatars') {
        globalAvatarsList = itemsList;
        console.log('Updated global avatars list with', itemsList.length, 'avatars');
      }
      
      setItems(itemsList);
      setLoading(false);
    } catch (err) {
      console.error(`Error fetching ${activeTab}:`, err);
      setError(`Failed to load ${activeTab}`);
      setLoading(false);
    }
  };

  // Fetch existing avatar categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'avatars'));
        const avatars = snapshot.docs.map(doc => doc.data() as ItemType);
        
        // Extract unique categories
        const categories = Array.from(
          new Set(avatars.filter(a => a.category).map(a => a.category as string))
        ).sort();
        
        setExistingCategories(categories);
      } catch (err) {
        console.error('Error fetching avatar categories:', err);
      }
    };
    
    if (activeTab === 'avatars') {
      fetchCategories();
    }
  }, [activeTab]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (name === 'category' && value === 'add_new') {
      setShowNewCategoryInput(true);
      return;
    }
    
    // Handle checkbox inputs differently
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle new category input
  const handleNewCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewCategory(e.target.value);
  };

  // Handle new category submission
  const handleAddNewCategory = () => {
    if (newCategory.trim() === '') return;
    
    // Add the new category to the existing categories
    setExistingCategories(prev => [...prev, newCategory].sort());
    
    // Set the form data category to the new category
    setFormData(prev => ({ ...prev, category: newCategory }));
    
    // Reset the new category state
    setNewCategory('');
    setShowNewCategoryInput(false);
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

      // Convert image to Base64 string instead of uploading to Firebase Storage
      // This avoids CORS issues completely
      const base64String = await convertToBase64(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Set the Base64 string as the image URL
      // Also set the same value for displayImageUrl to avoid undefined errors
      setFormData(prev => ({ 
        ...prev, 
        imageUrl: base64String,
        displayImageUrl: base64String // Set the same Base64 string for displayImageUrl
      }));
    } catch (err) {
      console.error('Error processing image:', err);
      setError('Failed to process image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Open form for editing an item
  const handleEdit = (item: ItemType) => {
    setFormData({
      name: item.name || '',
      description: item.description || '',
      imageUrl: item.imageUrl || '',
      displayImageUrl: item.displayImageUrl || '',
      category: item.category || '',
      isDefault: item.isDefault || false,
      createdAt: item.createdAt
    });
    setEditingItem(item);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      // Get the collection name based on the active tab
      const collectionName = getCollectionName();
      
      // Create a data object with the form data
      const data = { ...formData, createdAt: new Date() };
      
      // For avatars, ensure we have the required fields
      if (activeTab === 'avatars') {
        // Validate required fields
        if (!data.name || !data.imageUrl) {
          setError('Name and Image URL are required');
          setSubmitting(false);
          return;
        }
        
        // Ensure category is set
        if (!data.category) {
          setError('Category is required');
          setSubmitting(false);
          return;
        }
        
        // Add isDefault flag if checked
        data.isDefault = formData.isDefault;
        
        console.log('Saving avatar with data:', data);
      }
      
      // Add the document to Firestore
      const docRef = await addDoc(collection(db, collectionName), data);
      console.log(`${activeTab} added with ID: ${docRef.id}`);
      
      // If we're adding an avatar, add it to the global list immediately
      if (activeTab === 'avatars') {
        const newAvatar = {
          id: docRef.id,
          ...data
        } as ItemType;
        
        // Add to global list
        globalAvatarsList.push(newAvatar);
        console.log('Added new avatar to global list. Total count:', globalAvatarsList.length);
        
        // Update the items state to include the new item
        setItems(prev => [...prev, newAvatar]);
      } else {
        // For other tabs, just refresh the list
        await fetchItems();
      }
      
      // Reset the form
      resetForm();
      setSubmitting(false);
      setError(null);
      
      // Show success message
      setSuccess(`${activeTab} added successfully!`);
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      console.error(`Error adding ${activeTab}:`, err);
      setError(`Failed to add ${activeTab}`);
      setSubmitting(false);
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
              <div className="flex gap-2">
                {activeTab === 'avatars' && (
                  <>
                    <button
                      onClick={() => {
                        // Fetch items again instead of reloading the page
                        setLoading(true);
                        setItems([]);
                        setTimeout(() => {
                          fetchItems().then(() => {
                            // Show a success message
                            setError("Avatars refreshed successfully!");
                            setTimeout(() => setError(null), 3000);
                          });
                        }, 100);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                    >
                      Refresh Avatars
                    </button>
                    
                    {/* Diagnostic button to check all avatars in Firestore */}
                    <button
                      onClick={async () => {
                        try {
                          setLoading(true);
                          
                          // Get all avatars directly from Firestore
                          const snapshot = await getDocs(collection(db, 'avatars'));
                          
                          // Log detailed information about each avatar
                          console.log('===== AVATAR DIAGNOSTIC REPORT =====');
                          console.log(`Total avatars in Firestore: ${snapshot.size}`);
                          
                          // List all avatars with their details
                          snapshot.docs.forEach((doc, index) => {
                            const data = doc.data();
                            console.log(`Avatar ${index + 1}:`, {
                              id: doc.id,
                              name: data.name,
                              category: data.category,
                              isDefault: data.isDefault,
                              hasImage: !!data.imageUrl
                            });
                          });
                          
                          // Show success message
                          setError(`Found ${snapshot.size} avatars in Firestore. Check console for details.`);
                          setTimeout(() => setError(null), 5000);
                        } catch (err) {
                          console.error('Error in avatar diagnostic:', err);
                          setError('Error checking avatars. See console for details.');
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    >
                      Check All Avatars
                    </button>
                  </>
                )}
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
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                {error}
              </div>
            )}

            {/* Success message */}
            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
                {success}
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
                    
                    {/* Add category dropdown for avatars */}
                    {activeTab === 'avatars' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Category</label>
                        {showNewCategoryInput ? (
                          <div className="flex mt-1">
                            <input
                              type="text"
                              value={newCategory}
                              onChange={handleNewCategoryChange}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Enter new category name"
                              required
                            />
                            <button
                              type="button"
                              onClick={handleAddNewCategory}
                              className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none"
                            >
                              Add
                            </button>
                          </div>
                        ) : (
                          <select
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                          >
                            <option value="">Select a category</option>
                            {existingCategories.map(category => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                            <option value="add_new">+ Add new category</option>
                          </select>
                        )}
                        <p className="mt-1 text-sm text-gray-500">
                          Avatars are grouped by category in the selector. Choose an existing category or add a new one.
                        </p>
                      </div>
                    )}
                    
                    {/* Add isDefault checkbox for avatars */}
                    {activeTab === 'avatars' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Default Avatar</label>
                        <div className="mt-1">
                          <input
                            type="checkbox"
                            name="isDefault"
                            checked={formData.isDefault}
                            onChange={handleInputChange}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-600">Make this avatar the default for its category.</span>
                        </div>
                      </div>
                    )}
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
                    disabled={loading || uploadingImage || submitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Save'}
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
