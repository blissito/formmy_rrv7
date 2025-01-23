// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  deleteObject,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
} from "firebase/storage";
import { v4 as uuidv4 } from "uuid";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDBsMq4N7ij27ZDEjeKXwvRbVdX_0jd50Y",
  authDomain: "formmy-4aa4e.firebaseapp.com",
  projectId: "formmy-4aa4e",
  storageBucket: "formmy-4aa4e.appspot.com",
  messagingSenderId: "161114004465",
  appId: "1:161114004465:web:f76824677fe63dc0d60250",
  measurementId: "G-YR8HM4P9ML",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
// Storage
const storage = getStorage();

// Upload file
export const uploadPublicPic = async (file: File) => {
  const publicRef = ref(storage, `formmyV1/public/pictures/${uuidv4()}`);
  await uploadBytes(publicRef, file);
  // @TODO: validation?
  return await getDownloadURL(publicRef);
};

export const removePublicPic = async (url: string) => {
  const httpsReference = ref(storage, url);
  deleteObject(httpsReference).catch((e) => console.error(e));
};
