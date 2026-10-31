// public/js/app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";
import { 
    getAuth, 
    signInWithPopup, 
    GoogleAuthProvider, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";
import { 
    getDatabase, 
    ref, 
    push, 
    set 
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCdZkTVOW_TrOiKtsYwojUI5GHHVh_ZMwk",
  authDomain: "mineplix-3d91c.firebaseapp.com",
  databaseURL: "https://mineplix-3d91c-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "mineplix-3d91c",
  storageBucket: "mineplix-3d91c.firebasestorage.app",
  messagingSenderId: "932702850146",
  appId: "1:932702850146:web:0933bde133e94b4254953b",
  measurementId: "G-VTMMJV3HY7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getDatabase(app);

let currentUser = null;

// Fungsi Utama Login / Logout
window.handleAuthAction = async () => {
    if (!currentUser) {
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            
            if (typeof closeLoginModal === 'function') {
                closeLoginModal();
            }

            const notifRef = ref(db, 'notifikasi');
            await set(push(notifRef), {
                uid: user.uid,
                displayName: user.displayName || 'No Name',
                email: user.email || 'No Email',
                photoURL: user.photoURL || '',
                timestamp: new Date().toISOString(),
                type: 'google_login',
                message: `User ${user.displayName} logged in.`
            });
        } catch (error) {
            console.error("Login Error:", error);
        }
    } else {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Logout Error:", error);
        }
    }
};

window.handleAuthActionFromModal = async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        if (typeof closeLoginModal === 'function') {
            closeLoginModal();
        }

        const notifRef = ref(db, 'notifikasi');
        await set(push(notifRef), {
            uid: user.uid,
            displayName: user.displayName || 'No Name',
            email: user.email || 'No Email',
            photoURL: user.photoURL || '',
            timestamp: new Date().toISOString(),
            type: 'google_login',
            message: `User ${user.displayName} logged in.`
        });
    } catch (error) {
        console.error("Login Error:", error);
    }
};

// Pantau Status Login setelah halaman siap
document.addEventListener("DOMContentLoaded", () => {
    const authContainer = document.getElementById('authContainer');

    onAuthStateChanged(auth, (user) => {
        currentUser = user;
        if (authContainer) {
            if (user) {
                const initial = (user.displayName || user.email || 'U').charAt(0).toUpperCase();
                authContainer.innerHTML = `
                    <div class="auth-bar" onclick="handleAuthAction()">
                        <div class="auth-icon-circle">${initial}</div>
                        <span>Logout</span>
                    </div>
                `;
            } else {
                authContainer.innerHTML = `
                    <div class="auth-bar" onclick="handleAuthAction()">
                        <div class="auth-icon-circle"><i class="fa-brands fa-google"></i></div>
                        <span>Login</span>
                    </div>
                `;
            }
        }
    });
});
