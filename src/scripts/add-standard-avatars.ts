import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Standard avatars categorized by type
 * Each avatar has a name, image URL, and category
 */
const STANDARD_AVATARS = [
  // Characters
  {
    name: 'Math Wizard',
    imageUrl: 'https://via.placeholder.com/150?text=Wizard',
    category: 'Characters',
    isDefault: true
  },
  {
    name: 'Number Ninja',
    imageUrl: 'https://via.placeholder.com/150?text=Ninja',
    category: 'Characters',
    isDefault: true
  },
  {
    name: 'Calculation Cat',
    imageUrl: 'https://via.placeholder.com/150?text=Cat',
    category: 'Characters',
    isDefault: true
  },
  {
    name: 'Equation Eagle',
    imageUrl: 'https://via.placeholder.com/150?text=Eagle',
    category: 'Characters',
    isDefault: true
  },
  {
    name: 'Digit Dragon',
    imageUrl: 'https://via.placeholder.com/150?text=Dragon',
    category: 'Characters',
    isDefault: true
  },
  
  // Colors
  {
    name: 'Blue Circle',
    imageUrl: 'https://via.placeholder.com/150/0088ff/FFFFFF?text=Blue',
    category: 'Colors',
    isDefault: true
  },
  {
    name: 'Red Circle',
    imageUrl: 'https://via.placeholder.com/150/ff0000/FFFFFF?text=Red',
    category: 'Colors',
    isDefault: true
  },
  {
    name: 'Green Circle',
    imageUrl: 'https://via.placeholder.com/150/00cc44/FFFFFF?text=Green',
    category: 'Colors',
    isDefault: true
  },
  {
    name: 'Purple Circle',
    imageUrl: 'https://via.placeholder.com/150/8800ff/FFFFFF?text=Purple',
    category: 'Colors',
    isDefault: true
  },
  {
    name: 'Orange Circle',
    imageUrl: 'https://via.placeholder.com/150/ff8800/FFFFFF?text=Orange',
    category: 'Colors',
    isDefault: true
  },
  
  // Geometric
  {
    name: 'Triangle',
    imageUrl: 'https://via.placeholder.com/150?text=△',
    category: 'Geometric',
    isDefault: true
  },
  {
    name: 'Square',
    imageUrl: 'https://via.placeholder.com/150?text=□',
    category: 'Geometric',
    isDefault: true
  },
  {
    name: 'Circle',
    imageUrl: 'https://via.placeholder.com/150?text=○',
    category: 'Geometric',
    isDefault: true
  },
  {
    name: 'Pentagon',
    imageUrl: 'https://via.placeholder.com/150?text=⬠',
    category: 'Geometric',
    isDefault: true
  },
  {
    name: 'Hexagon',
    imageUrl: 'https://via.placeholder.com/150?text=⬡',
    category: 'Geometric',
    isDefault: true
  }
];

/**
 * Adds standard avatars to the Firestore database
 * Checks for existing avatars to avoid duplicates
 * 
 * @returns Promise with success status and message
 */
export const addStandardAvatars = async () => {
  try {
    // Check for existing default avatars
    const avatarsRef = collection(db, 'avatars');
    const defaultAvatarsQuery = query(avatarsRef, where('isDefault', '==', true));
    const existingAvatars = await getDocs(defaultAvatarsQuery);
    
    // If we already have default avatars, don't add more
    if (!existingAvatars.empty) {
      console.log(`Found ${existingAvatars.size} existing default avatars. Skipping...`);
      return {
        success: true,
        message: `${existingAvatars.size} default avatars already exist.`
      };
    }
    
    // Add all standard avatars
    const addedAvatars = [];
    for (const avatar of STANDARD_AVATARS) {
      const docRef = await addDoc(avatarsRef, {
        ...avatar,
        createdAt: new Date()
      });
      addedAvatars.push(docRef.id);
    }
    
    console.log(`Successfully added ${addedAvatars.length} standard avatars.`);
    return {
      success: true,
      message: `Added ${addedAvatars.length} standard avatars.`
    };
  } catch (error) {
    console.error('Error adding standard avatars:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Export the list of standard avatars for reference
export const standardAvatars = STANDARD_AVATARS;
