import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, setDoc, increment } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-storage.js"; // جديد

const firebaseConfig = {
  apiKey: "AIzaSyBf-HKpI4G5p6E0xP1OHGLxtDTGwE_0gg0",
  authDomain: "minecraft-community-4fd3d.firebaseapp.com",
  projectId: "minecraft-community-4fd3d",
  storageBucket: "minecraft-community-4fd3d.firebasestorage.app",
  messagingSenderId: "550140131027",
  appId: "1:550140131027:web:a5186726cf5372e138c626",
  measurementId: "G-F18SFG2LMZ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app); // جديد

const visitorRef = doc(db, "stats", "visitors");
updateDoc(visitorRef, {
  count: increment(1)
}).catch(async () => {
  await setDoc(visitorRef, { count: 1 });
});

export function openWebsite(url) {
  window.open(url, "_blank");
}

export function onClick() {
  var audio = new Audio('sounds/button_click.ogg');
  audio.play();
}


export function closeAlert(button) {
  const alertBox = button.parentElement;
  alertBox.style.display = 'none';
  document.body.removeChild(alertBox);
}

export { db, auth, storage, collection, addDoc, onSnapshot, doc, updateDoc, setDoc };
// أضف هذا إذا لم يكن موجودًا في ملف main.js
export const generateUserProfileLink = (userId) => {
  return `${window.location.origin}/profile.html?user=${userId}`;
};