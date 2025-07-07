import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
	apiKey: "AIzaSyCrJtUUkvF43G5ULnuxWEuU6_AsAo-6gQk",
	authDomain: "realtime-video-chatting-app.firebaseapp.com",
	projectId: "realtime-video-chatting-app",
	storageBucket: "realtime-video-chatting-app.firebasestorage.app",
	messagingSenderId: "107143993336",
	appId: "1:107143993336:web:9c7228fe0d076e2873280d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const firestore = getFirestore(app);

export { firestore };
