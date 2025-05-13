importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBf-HKpI4G5p6E0xP1OHGLxtDTGwE_0gg0",
  authDomain: "minecraft-community-4fd3d.firebaseapp.com",
  projectId: "minecraft-community-4fd3d",
  storageBucket: "minecraft-community-4fd3d.appspot.com",
  messagingSenderId: "550140131027",
  appId: "1:550140131027:web:a5186726cf5372e138c626",
  measurementId: "G-F18SFG2LMZ"
});

const messaging = firebase.messaging();