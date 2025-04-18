export function openWebsite(url) {
  window.open(url, "_blank");
}

function onClick() {
  var audio = new Audio('sounds/button_click.ogg');
  audio.play();
}
// تأكد من استيراد Firebase بشكل صحيح
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot,  } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// تصدير الدوال اللازمة للاستخدام في أماكن أخرى
export { db, collection, addDoc, onSnapshot };
function showAlert(message, type) {
      const alertBox = document.createElement('div');
      alertBox.classList.add('custom-alert');
      alertBox.classList.add(type); // إما success أو error
      alertBox.innerHTML = `${message}<br><button onclick="closeAlert(this)">موافق</button>`;
      document.body.appendChild(alertBox);

      // عرض التنبيه لمدة 3 ثواني ثم إخفاءه
      setTimeout(() => {
        alertBox.style.display = 'none';
        document.body.removeChild(alertBox);
      }, 3000);

      alertBox.style.display = 'block';
    }

    // دالة لإغلاق التنبيه
    function closeAlert(button) {
      const alertBox = button.parentElement;
      alertBox.style.display = 'none';
      document.body.removeChild(alertBox);
    }
import { doc, updateDoc, setDoc, increment } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

const visitorRef = doc(db, "stats", "visitors");

updateDoc(visitorRef, {
  count: increment(1)
}).catch(async () => {
  await setDoc(visitorRef, { count: 1 });
});