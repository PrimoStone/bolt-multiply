// Script to add standard rewards to Firebase
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

// Define the badges as per REWARD_SYSTEM_PLAN.md
const badges = [
  {
    name: 'Math Apprentice',
    description: 'Complete your first game',
    iconUrl: 'https://via.placeholder.com/150',
    requirements: {
      gamesCompleted: 1
    },
    createdAt: new Date()
  },
  {
    name: 'Multiplication Master',
    description: 'Get 100% on a multiplication game',
    iconUrl: 'https://via.placeholder.com/150',
    requirements: {
      gameType: 'multiplication',
      perfectScore: true
    },
    createdAt: new Date()
  },
  {
    name: 'Addition Ace',
    description: 'Get 100% on an addition game',
    iconUrl: 'https://via.placeholder.com/150',
    requirements: {
      gameType: 'addition',
      perfectScore: true
    },
    createdAt: new Date()
  },
  {
    name: 'Subtraction Star',
    description: 'Get 100% on a subtraction game',
    iconUrl: 'https://via.placeholder.com/150',
    requirements: {
      gameType: 'subtraction',
      perfectScore: true
    },
    createdAt: new Date()
  },
  {
    name: 'Division Dynamo',
    description: 'Get 100% on a division game',
    iconUrl: 'https://via.placeholder.com/150',
    requirements: {
      gameType: 'division',
      perfectScore: true
    },
    createdAt: new Date()
  },
  {
    name: 'Speed Demon',
    description: 'Complete a game in under 45 seconds',
    iconUrl: 'https://via.placeholder.com/150',
    requirements: {
      maxTime: 45
    },
    createdAt: new Date()
  },
  {
    name: 'Streak Seeker',
    description: 'Achieve a 15-answer streak',
    iconUrl: 'https://via.placeholder.com/150',
    requirements: {
      minStreak: 15
    },
    createdAt: new Date()
  },
  {
    name: 'Perfect Week',
    description: 'Play every day for 7 days',
    iconUrl: 'https://via.placeholder.com/150',
    requirements: {
      consecutiveDays: 7
    },
    createdAt: new Date()
  },
  {
    name: 'All-Rounder',
    description: 'Complete all game types',
    iconUrl: 'https://via.placeholder.com/150',
    requirements: {
      allGameTypes: true
    },
    createdAt: new Date()
  },
  {
    name: 'Math Ninja',
    description: 'Earn all other badges',
    iconUrl: 'https://via.placeholder.com/150',
    requirements: {
      allBadges: true
    },
    createdAt: new Date()
  }
];

// Define the trophies as per REWARD_SYSTEM_PLAN.md
const trophies = [
  {
    name: 'Bronze Trophy',
    description: 'Basic achievement recognition',
    imageUrl: 'https://via.placeholder.com/150',
    rarity: 'common',
    requirements: {
      gamesCompleted: 5
    },
    createdAt: new Date()
  },
  {
    name: 'Silver Trophy',
    description: 'Intermediate achievement',
    imageUrl: 'https://via.placeholder.com/150',
    rarity: 'uncommon',
    requirements: {
      gamesCompleted: 20,
      minAccuracy: 80
    },
    createdAt: new Date()
  },
  {
    name: 'Gold Trophy',
    description: 'Advanced achievement',
    imageUrl: 'https://via.placeholder.com/150',
    rarity: 'rare',
    requirements: {
      gamesCompleted: 50,
      minAccuracy: 90
    },
    createdAt: new Date()
  },
  {
    name: 'Platinum Trophy',
    description: 'Expert achievement',
    imageUrl: 'https://via.placeholder.com/150',
    rarity: 'very-rare',
    requirements: {
      gamesCompleted: 100,
      minAccuracy: 95
    },
    createdAt: new Date()
  },
  {
    name: 'Diamond Trophy',
    description: 'Master achievement',
    imageUrl: 'https://via.placeholder.com/150',
    rarity: 'legendary',
    requirements: {
      allAchievements: true,
      minCoins: 1000
    },
    createdAt: new Date()
  }
];

// Define the avatar items as per REWARD_SYSTEM_PLAN.md
const avatarItems = [
  // Headbands
  {
    name: 'Starter Headband',
    description: 'Basic ninja headband for beginners',
    type: 'headband',
    imageUrl: 'https://via.placeholder.com/150',
    cost: 0,
    rarity: 'common',
    createdAt: new Date()
  },
  {
    name: 'Blue Math Headband',
    description: 'Blue headband with math symbols',
    type: 'headband',
    imageUrl: 'https://via.placeholder.com/150',
    cost: 100,
    rarity: 'common',
    createdAt: new Date()
  },
  {
    name: 'Red Math Headband',
    description: 'Red headband with math symbols',
    type: 'headband',
    imageUrl: 'https://via.placeholder.com/150',
    cost: 100,
    rarity: 'common',
    createdAt: new Date()
  },
  {
    name: 'Golden Headband',
    description: 'Golden headband for math masters',
    type: 'headband',
    imageUrl: 'https://via.placeholder.com/150',
    cost: 500,
    rarity: 'rare',
    unlockRequirement: {
      perfectGames: 10
    },
    createdAt: new Date()
  },
  
  // Outfits
  {
    name: 'Novice Ninja Outfit',
    description: 'Basic ninja outfit for beginners',
    type: 'outfit',
    imageUrl: 'https://via.placeholder.com/150',
    cost: 0,
    rarity: 'common',
    createdAt: new Date()
  },
  {
    name: 'Blue Ninja Outfit',
    description: 'Blue ninja outfit',
    type: 'outfit',
    imageUrl: 'https://via.placeholder.com/150',
    cost: 200,
    rarity: 'common',
    createdAt: new Date()
  },
  {
    name: 'Red Ninja Outfit',
    description: 'Red ninja outfit',
    type: 'outfit',
    imageUrl: 'https://via.placeholder.com/150',
    cost: 200,
    rarity: 'common',
    createdAt: new Date()
  },
  {
    name: 'Master Ninja Outfit',
    description: 'Special outfit for math masters',
    type: 'outfit',
    imageUrl: 'https://via.placeholder.com/150',
    cost: 1000,
    rarity: 'very-rare',
    unlockRequirement: {
      trophyId: 'gold-trophy'
    },
    createdAt: new Date()
  },
  
  // Accessories
  {
    name: 'Calculator Accessory',
    description: 'A small calculator accessory',
    type: 'accessory',
    imageUrl: 'https://via.placeholder.com/150',
    cost: 150,
    rarity: 'common',
    createdAt: new Date()
  },
  {
    name: 'Abacus Accessory',
    description: 'An ancient abacus for calculations',
    type: 'accessory',
    imageUrl: 'https://via.placeholder.com/150',
    cost: 150,
    rarity: 'uncommon',
    createdAt: new Date()
  },
  {
    name: 'Math Book Accessory',
    description: 'A book of math knowledge',
    type: 'accessory',
    imageUrl: 'https://via.placeholder.com/150',
    cost: 300,
    rarity: 'rare',
    createdAt: new Date()
  },
  {
    name: 'Golden Compass',
    description: 'A golden compass for math masters',
    type: 'accessory',
    imageUrl: 'https://via.placeholder.com/150',
    cost: 800,
    rarity: 'legendary',
    unlockRequirement: {
      badgeId: 'math-ninja'
    },
    createdAt: new Date()
  },
  
  // Backgrounds
  {
    name: 'Classroom Background',
    description: 'A simple classroom background',
    type: 'background',
    imageUrl: 'https://via.placeholder.com/150',
    cost: 100,
    rarity: 'common',
    createdAt: new Date()
  },
  {
    name: 'Math Lab Background',
    description: 'A math laboratory background',
    type: 'background',
    imageUrl: 'https://via.placeholder.com/150',
    cost: 250,
    rarity: 'uncommon',
    createdAt: new Date()
  },
  {
    name: 'Number Universe Background',
    description: 'A cosmic background with floating numbers',
    type: 'background',
    imageUrl: 'https://via.placeholder.com/150',
    cost: 500,
    rarity: 'rare',
    createdAt: new Date()
  },
  {
    name: 'Legendary Math Dojo',
    description: 'The legendary dojo where math ninjas train',
    type: 'background',
    imageUrl: 'https://via.placeholder.com/150',
    cost: 1500,
    rarity: 'legendary',
    unlockRequirement: {
      perfectGames: 50
    },
    createdAt: new Date()
  }
];

/**
 * Function to add badges to Firestore
 * Adds all the standard badges defined in the REWARD_SYSTEM_PLAN.md
 */
export async function addBadges() {
  console.log('Adding badges...');
  for (const badge of badges) {
    try {
      const docRef = await addDoc(collection(db, 'badges'), badge);
      console.log(`Added badge: ${badge.name} with ID: ${docRef.id}`);
    } catch (error) {
      console.error(`Error adding badge ${badge.name}:`, error);
    }
  }
}

/**
 * Function to add trophies to Firestore
 * Adds all the standard trophies defined in the REWARD_SYSTEM_PLAN.md
 */
export async function addTrophies() {
  console.log('Adding trophies...');
  for (const trophy of trophies) {
    try {
      const docRef = await addDoc(collection(db, 'trophies'), trophy);
      console.log(`Added trophy: ${trophy.name} with ID: ${docRef.id}`);
    } catch (error) {
      console.error(`Error adding trophy ${trophy.name}:`, error);
    }
  }
}

/**
 * Function to add avatar items to Firestore
 * Adds all the standard avatar items defined in the REWARD_SYSTEM_PLAN.md
 */
export async function addAvatarItems() {
  console.log('Adding avatar items...');
  for (const item of avatarItems) {
    try {
      const docRef = await addDoc(collection(db, 'avatarItems'), item);
      console.log(`Added avatar item: ${item.name} with ID: ${docRef.id}`);
    } catch (error) {
      console.error(`Error adding avatar item ${item.name}:`, error);
    }
  }
}

/**
 * Main function to add all rewards to Firestore
 * This can be called from the admin panel or other parts of the application
 */
export async function addAllRewards() {
  try {
    console.log('Starting to add rewards to Firebase...');
    await addBadges();
    await addTrophies();
    await addAvatarItems();
    console.log('All rewards added successfully!');
    return { success: true, message: 'All rewards added successfully!' };
  } catch (error) {
    console.error('Error adding rewards:', error);
    return { success: false, message: 'Error adding rewards', error };
  }
}
