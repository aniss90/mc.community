importScripts("https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.2/firebase-messaging.js");

// تهيئة Firebase داخل Service Worker
const firebaseConfig = {
  apiKey: "AIzaSyBf-HKpI4G5p6E0xP1OHGLxtDTGwE_0gg0",
  authDomain: "minecraft-community-4fd3d.firebaseapp.com",
  projectId: "minecraft-community-4fd3d",
  storageBucket: "minecraft-community-4fd3d.firebasestorage.app",
  messagingSenderId: "550140131027",
  appId: "1:550140131027:web:a5186726cf5372e138c626",
  measurementId: "G-F18SFG2LMZ"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// استقبال الإشعارات حتى عند إغلاق الموقع
messaging.onBackgroundMessage((payload) => {
    console.log("إشعار في الخلفية:", payload);
    self.registration.showNotification(payload.notification.title, {
        body: payload.notification.body,
        icon: payload.notification.icon
    });
});