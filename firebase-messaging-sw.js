// Scripts for firebase and firebase messaging
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

// Firebase konfiguratsiyasi (films.txt faylidagi bilan bir xil bo'lishi kerak)
const firebaseConfig = {
    apiKey: "AIzaSyBeYmiy_FX22I4--UnNTRxjWiAh--sX9Ug",
    authDomain: "soundora-music.firebaseapp.com",
    projectId: "soundora-music",
    storageBucket: "soundora-music.appspot.com",
    messagingSenderId: "92363153683",
    appId: "1:92363153683:web:16feda8fb9607d8da97ae6",
    measurementId: "G-KP08NSCRD6"
};

// Firebase-ni ishga tushirish
firebase.initializeApp(firebaseConfig);

// Messaging xizmatini olish
const messaging = firebase.messaging();

// Ilova yopiq bo'lganda (background) kelgan xabarlarni ushlab qolish
messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );
  
  // Bildirishnomani ko'rsatish
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/favicon.ico", // Bu yerga o'zingizning ikonkangiz manzilini qo'ying
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
