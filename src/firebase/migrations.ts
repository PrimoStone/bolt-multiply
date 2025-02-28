import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from './config';

/**
 * Migrate existing users to include coins field
 * This function should be run once to update all existing users
 * @returns Promise with the number of users updated
 */
export const migrateUsersToIncludeCoins = async (): Promise<number> => {
  try {
    // Get all users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    
    let updatedCount = 0;
    
    // Update each user that doesn't have coins
    const updatePromises = usersSnapshot.docs.map(async (userDoc) => {
      const userData = userDoc.data();
      
      // Only update if coins field is missing
      if (typeof userData.coins === 'undefined') {
        await updateDoc(doc(db, 'users', userDoc.id), {
          coins: 0
        });
        updatedCount++;
      }
    });
    
    // Wait for all updates to complete
    await Promise.all(updatePromises);
    
    console.log(`Updated ${updatedCount} users to include coins field`);
    return updatedCount;
  } catch (error) {
    console.error('Error migrating users:', error);
    throw error;
  }
};
