// استيراد مكتبة Firebase v8
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

// إعداد Firebase
firebase.initializeApp({
  apiKey: "AIzaSyBf-HKpI4G5p6E0xP1OHGLxtDTGwE_0gg0",
  authDomain: "minecraft-community-4fd3d.firebaseapp.com",
  projectId: "minecraft-community-4fd3d",
  messagingSenderId: "550140131027",
  appId: "1:550140131027:web:a5186726cf5372e138c626"
});

const messaging = firebase.messaging();

// استقبال الإشعار في الخلفية
messaging.onBackgroundMessage(payload => {
  console.log("رسالة خلفية:", payload);
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: payload.notification.icon
  });
});