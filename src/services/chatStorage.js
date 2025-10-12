import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  orderBy, 
  limit,
  where,
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../firebase/config';

export class ChatStorageService {
  constructor(userId) {
    this.userId = userId;
    this.userChatsCollection = collection(db, 'users', userId, 'chats');
  }

  // Save a chat session to Firestore
  async saveChatSession(sessionId, sessionData, isNewSession = false) {
    try {
      const chatDoc = {
        ...sessionData,
        id: sessionId,
        userId: this.userId,
        updatedAt: new Date(),
        createdAt: sessionData.createdAt || new Date()
      };

      await setDoc(doc(this.userChatsCollection, sessionId.toString()), chatDoc);
      
      // Update total chat count if this is a new session
      if (isNewSession) {
        await this.updateTotalChatCount();
      }
      
      return true;
    } catch (error) {
      console.error('Error saving chat session:', error);
      throw new Error('Failed to save chat session');
    }
  }

  // Load all chat sessions for the user
  async loadChatSessions() {
    try {
      const q = query(this.userChatsCollection, orderBy('updatedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const sessions = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        sessions.push({
          ...data,
          id: doc.id,
          timestamp: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        });
      });

      return sessions;
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      throw new Error('Failed to load chat sessions');
    }
  }

  // Load a specific chat session
  async loadChatSession(sessionId) {
    try {
      const docRef = doc(this.userChatsCollection, sessionId.toString());
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...data,
          id: docSnap.id,
          timestamp: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error loading chat session:', error);
      throw new Error('Failed to load chat session');
    }
  }

  // Delete a chat session
  async deleteChatSession(sessionId) {
    try {
      await deleteDoc(doc(this.userChatsCollection, sessionId.toString()));
      
      // Update total chat count after deletion
      await this.updateTotalChatCount();
      
      return true;
    } catch (error) {
      console.error('Error deleting chat session:', error);
      throw new Error('Failed to delete chat session');
    }
  }

  // Get recent chat sessions (for quick access)
  async getRecentChatSessions(limitCount = 10) {
    try {
      const q = query(
        this.userChatsCollection, 
        orderBy('updatedAt', 'desc'), 
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      
      const sessions = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        sessions.push({
          ...data,
          id: doc.id,
          timestamp: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        });
      });

      return sessions;
    } catch (error) {
      console.error('Error loading recent chat sessions:', error);
      return [];
    }
  }

  // Listen to real-time updates for chat sessions
  subscribeToSessions(callback) {
    try {
      const q = query(this.userChatsCollection, orderBy('updatedAt', 'desc'));
      
      return onSnapshot(q, (querySnapshot) => {
        const sessions = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          sessions.push({
            ...data,
            id: doc.id,
            timestamp: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          });
        });
        
        callback(sessions);
      }, (error) => {
        console.error('Error listening to chat sessions:', error);
      });
    } catch (error) {
      console.error('Error setting up session listener:', error);
      return null;
    }
  }

  // Update chat session metadata (title, last activity, etc.)
  async updateSessionMetadata(sessionId, metadata) {
    try {
      const docRef = doc(this.userChatsCollection, sessionId.toString());
      await setDoc(docRef, {
        ...metadata,
        updatedAt: new Date()
      }, { merge: true });
      
      return true;
    } catch (error) {
      console.error('Error updating session metadata:', error);
      throw new Error('Failed to update session metadata');
    }
  }

  // Export all user's chat data
  async exportAllChats() {
    try {
      const sessions = await this.loadChatSessions();
      return sessions;
    } catch (error) {
      console.error('Error exporting chats:', error);
      throw new Error('Failed to export chat data');
    }
  }

  // Update the total chat count in user's profile
  async updateTotalChatCount() {
    try {
      const sessions = await this.loadChatSessions();
      const totalChats = sessions.length;
      
      console.log(`Updating total chat count to: ${totalChats}`);
      await UserChatStats.updateUserStats(this.userId, {
        totalChats: totalChats,
        lastChatCountUpdate: new Date()
      });
      
      return totalChats;
    } catch (error) {
      console.error('Error updating total chat count:', error);
      return 0;
    }
  }
}

// Static methods for managing user's overall chat statistics
export class UserChatStats {
  static async updateUserStats(userId, stats) {
    try {
      const userStatsRef = doc(db, 'users', userId);
      await setDoc(userStatsRef, stats, { merge: true });
      return true;
    } catch (error) {
      console.error('Error updating user stats:', error);
      return false;
    }
  }

  static async getUserStats(userId) {
    try {
      const userStatsRef = doc(db, 'users', userId);
      const docSnap = await getDoc(userStatsRef);
      
      if (docSnap.exists()) {
        return docSnap.data();
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user stats:', error);
      return null;
    }
  }
}

// Helper function to migrate localStorage data to Firestore
export async function migrateLocalStorageToFirestore(userId) {
  try {
    const localData = localStorage.getItem('chatSessions');
    if (!localData) return { success: true, message: 'No local data to migrate' };

    const sessions = JSON.parse(localData);
    if (!Array.isArray(sessions) || sessions.length === 0) {
      return { success: true, message: 'No valid sessions to migrate' };
    }

    const chatStorage = new ChatStorageService(userId);
    let migratedCount = 0;

    for (const session of sessions) {
      try {
        await chatStorage.saveChatSession(session.id, {
          title: session.title,
          messages: session.messages || [],
          createdAt: session.timestamp ? new Date(session.timestamp) : new Date()
        });
        migratedCount++;
      } catch (error) {
        console.error(`Failed to migrate session ${session.id}:`, error);
      }
    }

    // Clear localStorage after successful migration
    if (migratedCount > 0) {
      localStorage.removeItem('chatSessions');
      
      // Update user stats
      await UserChatStats.updateUserStats(userId, {
        totalChats: migratedCount,
        migratedAt: new Date()
      });
    }

    return { 
      success: true, 
      message: `Successfully migrated ${migratedCount} chat sessions`,
      count: migratedCount
    };
  } catch (error) {
    console.error('Migration error:', error);
    return { 
      success: false, 
      message: 'Failed to migrate local data',
      error: error.message
    };
  }
}