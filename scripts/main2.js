import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

// إعداد Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBf-HKpI4G5p6E0xP1OHGLxtDTGwE_0gg0",
  authDomain: "minecraft-community-4fd3d.firebaseapp.com",
  projectId: "minecraft-community-4fd3d",
  storageBucket: "minecraft-community-4fd3d.firebasestorage.app",
  messagingSenderId: "550140131027",
  appId: "1:550140131027:web:a5186726cf5372e138c626",
  measurementId: "G-F18SFG2LMZ"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ✅ جلب جميع المستخدمين مع إيميلاتهم
async function fetchAllUsersWithEmails() {
    const usersCollection = collection(db, "users");
    const usersSnapshot = await getDocs(usersCollection);
    
    usersSnapshot.forEach(doc => {
        console.log(`👤 المستخدم: ${doc.id}, 📧 البريد: ${doc.data().email}`);
    });
}

// ✅ جلب البريد الإلكتروني لمستخدم معين
async function fetchUserEmail(username) {
    const userRef = doc(db, "users", username);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        console.log(`📧 البريد الإلكتروني للمستخدم "${username}": ${userSnap.data().email}`);
    } else {
        console.log("❌ المستخدم غير موجود");
    }
}

// 🔹 تشغيل الدوال لاختبارها
fetchAllUsersWithEmails(); // يعرض كل المستخدمين مع إيميلاتهم
fetchUserEmail("Anis"); // يعرض بريد المستخدم "Anis"
export async function fetchAllUsers() {
    const usersCollection = collection(db, "users");
    const usersSnapshot = await getDocs(usersCollection);
    
    const users = [];
    usersSnapshot.forEach(doc => {
        users.push({ username: doc.id, email: doc.data().email });
    });

    console.log("📜 قائمة المستخدمين:", users);
    return users;
}