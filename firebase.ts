import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const storage = getStorage(app);
// Set short retry times so that if Firebase Storage is not initialized,
// it falls back to Firestore base64 storage quickly instead of hanging for 2 minutes.
storage.maxUploadRetryTime = 3000;
storage.maxOperationRetryTime = 3000;
