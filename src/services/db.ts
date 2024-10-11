import { openDB, DBSchema } from 'idb';

interface User {
  id?: number;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  school: string;
  profilePicture?: string;
}

interface GameStats {
  id?: number;
  userId: number;
  date: Date;
  score: number;
  totalQuestions: number;
  duration: number;
}

interface MyDB extends DBSchema {
  users: {
    key: number;
    value: User;
    indexes: { 'by-username': string };
  };
  gameStats: {
    key: number;
    value: GameStats;
    indexes: { 'by-userId': number };
  };
}

const dbPromise = openDB<MyDB>('MultiplicationGameDB', 1, {
  upgrade(db) {
    const userStore = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
    userStore.createIndex('by-username', 'username', { unique: true });

    const gameStatsStore = db.createObjectStore('gameStats', { keyPath: 'id', autoIncrement: true });
    gameStatsStore.createIndex('by-userId', 'userId');
  },
});

export async function addUser(user: Omit<User, 'id'>): Promise<number> {
  const db = await dbPromise;
  return db.add('users', user);
}

export async function getUserByUsername(username: string): Promise<User | undefined> {
  const db = await dbPromise;
  return db.getFromIndex('users', 'by-username', username);
}

export async function updateUser(user: User): Promise<void> {
  const db = await dbPromise;
  await db.put('users', user);
}

export async function addGameStats(stats: Omit<GameStats, 'id'>): Promise<number> {
  const db = await dbPromise;
  return db.add('gameStats', stats);
}

export async function getGameStatsByUserId(userId: number): Promise<GameStats[]> {
  const db = await dbPromise;
  return db.getAllFromIndex('gameStats', 'by-userId', userId);
}

export async function getAllGameStats(): Promise<GameStats[]> {
  const db = await dbPromise;
  return db.getAll('gameStats');
}

export async function getAllUsers(): Promise<User[]> {
  const db = await dbPromise;
  return db.getAll('users');
}