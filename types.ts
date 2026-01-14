
export type UserRole = 'student' | 'admin';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  dob?: string;
  profilePic?: string; // Optional, defaults to blank if not provided
  friends: string[]; // List of user IDs
  role: UserRole;
  isLoggedIn: boolean;
  createdAt: string;
  authMethod: 'google' | 'manual';
  password?: string; // Only for manual users
}

export interface Group {
  id: string;
  name: string;
  description: string;
  members: string[]; // User IDs
  creatorId: string;
  isPrivate: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId?: string; 
  groupId?: string; 
  text: string;
  timestamp: string;
  fileUrl?: string;
  fileName?: string;
}

export interface Note {
  id: string;
  ownerId: string;
  title: string;
  content: string;
  isPublic: boolean;
  groupId?: string;
  timestamp: string;
}

export type Theme = 'light' | 'dark' | 'system';

export type AppTab = 'feed' | 'chats' | 'groups' | 'friends' | 'profile' | 'settings' | 'admin';
