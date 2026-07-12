import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, updateProfile } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, addDoc, query, where, orderBy, limit, getDocs, serverTimestamp, updateDoc, arrayUnion, increment, deleteDoc, onSnapshot } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // Create or update user profile
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        const userData: any = {
          uid: user.uid,
          email: user.email || '',
          createdAt: serverTimestamp(),
        };
        
        if (user.displayName) {
          userData.displayName = user.displayName;
        }
        
        await setDoc(userRef, userData);
      }
    } catch (firestoreError) {
      handleFirestoreError(firestoreError, OperationType.WRITE, `users/${user.uid}`);
    }
    
    return user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};

export const saveSession = async (userId: string, mood: string, aiResponse: string, theme: string = 'default', takeaways?: string[]) => {
  try {
    const data: any = {
      userId,
      mood,
      aiResponse,
      theme,
      createdAt: serverTimestamp(),
    };
    if (takeaways) data.takeaways = takeaways;

    await addDoc(collection(db, 'sessions'), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'sessions');
  }
};

export interface SessionData {
  id: string;
  userId: string;
  mood: string;
  aiResponse: string;
  theme?: string;
  takeaways?: string[];
  createdAt: any;
}

export interface JournalEntry {
  id: string;
  userId: string;
  text: string;
  tags: string[];
  createdAt: any;
}

export const saveJournalEntry = async (userId: string, text: string, tags: string[]) => {
  try {
    const data = {
      userId,
      text,
      tags,
      createdAt: serverTimestamp(),
    };
    await addDoc(collection(db, 'journal_entries'), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'journal_entries');
  }
};

export const getJournalEntries = async (userId: string): Promise<JournalEntry[]> => {
  try {
    const q = query(
      collection(db, 'journal_entries'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as JournalEntry));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'journal_entries');
    return [];
  }
};

export const deleteJournalEntry = async (entryId: string) => {
  try {
    await deleteDoc(doc(db, 'journal_entries', entryId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `journal_entries/${entryId}`);
  }
};

export const getRecentSessions = async (userId: string, limitCount: number = 5): Promise<SessionData[]> => {
  try {
    const q = query(
      collection(db, 'sessions'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as SessionData)).reverse(); // Return in chronological order
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'sessions');
    return [];
  }
};

export const saveFeedback = async (userId: string, name: string, email: string, message: string, rating: number) => {
  try {
    await addDoc(collection(db, 'feedback'), {
      userId,
      name,
      email,
      message,
      rating,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'feedback');
  }
};

export interface CommunityPost {
  id: string;
  authorId: string;
  text: string;
  room: string;
  supportCount: number;
  supportedBy: string[];
  createdAt: any;
}

export const getCommunityPosts = async (limitCount: number = 50, roomName?: string): Promise<CommunityPost[]> => {
  try {
    let q;
    if (roomName) {
      q = query(
        collection(db, 'community_posts'),
        where('room', '==', roomName),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
    } else {
      q = query(
        collection(db, 'community_posts'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
    }
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as object)
    } as CommunityPost));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'community_posts');
    return [];
  }
};

export const createCommunityPost = async (authorId: string, text: string, room: string = 'genel') => {
  try {
    await addDoc(collection(db, 'community_posts'), {
      authorId,
      text,
      room,
      supportCount: 0,
      supportedBy: [],
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'community_posts');
  }
};

export const supportCommunityPost = async (postId: string, userId: string) => {
  try {
    const postRef = doc(db, 'community_posts', postId);
    await updateDoc(postRef, {
      supportCount: increment(1),
      supportedBy: arrayUnion(userId)
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `community_posts/${postId}`);
  }
};

export const editCommunityPost = async (postId: string, text: string) => {
  try {
    const postRef = doc(db, 'community_posts', postId);
    await updateDoc(postRef, {
      text: text
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `community_posts/${postId}`);
  }
};

export const deleteCommunityPost = async (postId: string) => {
  try {
    await deleteDoc(doc(db, 'community_posts', postId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `community_posts/${postId}`);
  }
};

export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  userPhotoUrl?: string | null;
  text: string;
  createdAt: any;
}

export const sendChatMessage = async (userId: string, userName: string, userPhotoUrl: string | null = null, roomId: string, text: string) => {
  try {
    const data = {
      userId,
      userName,
      userPhotoUrl,
      roomId,
      text,
      createdAt: serverTimestamp()
    };
    await addDoc(collection(db, 'chat_messages'), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'chat_messages');
  }
};

export const subscribeToChatMessages = (roomId: string, limitCount: number = 50, callback: (messages: ChatMessage[]) => void) => {
  const q = query(
    collection(db, 'chat_messages'),
    where('roomId', '==', roomId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ChatMessage)).reverse(); 
    callback(messages);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, `chat_messages for room ${roomId}`);
  });
};

export interface UserProfile {
  userId: string;
  displayName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  updatedAt: any;
}

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const docSnap = await getDoc(doc(db, 'user_profiles', userId));
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `user_profiles/${userId}`);
    return null;
  }
};

export const saveUserProfile = async (userId: string, data: Partial<UserProfile>) => {
  try {
    await setDoc(doc(db, 'user_profiles', userId), {
      ...data,
      userId,
      updatedAt: serverTimestamp()
    }, { merge: true });

    if (auth.currentUser && auth.currentUser.uid === userId) {
      const authUpdates: { displayName?: string, photoURL?: string } = {};
      if (data.displayName !== undefined) authUpdates.displayName = data.displayName || "";
      if (data.avatarUrl !== undefined) authUpdates.photoURL = data.avatarUrl || "";
      
      if (Object.keys(authUpdates).length > 0) {
        await updateProfile(auth.currentUser, authUpdates);
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `user_profiles/${userId}`);
  }
};

