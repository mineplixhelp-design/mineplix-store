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

const authContainer = document.getElementById('authContainer');
let currentUser = null;

// 1. Fungsi Utama Login / Logout dari Navbar
window.handleAuthAction = async () => {
    if (!currentUser) {
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            
            // Cek apakah fungsi closeLoginModal ada di HTML
            if (typeof closeLoginModal === 'function') {
                closeLoginModal();
            }

            const notifRef = ref(db, 'notifikasi');
            const newNotifRef = push(notifRef);
            await set(newNotifRef, {
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

// 2. Fungsi Login dari Modal
window.handleAuthActionFromModal = async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        if (typeof closeLoginModal === 'function') {
            closeLoginModal();
        }

        const notifRef = ref(db, 'notifikasi');
        const newNotifRef = push(notifRef);
        await set(newNotifRef, {
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

// 3. Pantau Status Sesi Login Pengguna
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

// 4. Fungsi Submit Order / Pesanan
window.handleOrderSubmit = async function(event) {
    event.preventDefault();
    
    if (typeof clearAllErrors === 'function') {
        clearAllErrors();
    }

    const theme = document.getElementById('mapTheme').value.trim();
    const desc = document.getElementById('mapDesc').value.trim();
    let isValid = true;
    let firstInvalidInputId = null;

    if (!desc) {
        if (typeof showError === 'function') showError('mapDesc', 'descError');
        isValid = false;
        firstInvalidInputId = 'mapDesc';
    }

    if (!theme) {
        if (typeof showError === 'function') showError('mapTheme', 'themeError');
        isValid = false;
        firstInvalidInputId = 'mapTheme';
    }

    if (!isValid && firstInvalidInputId) {
        const el = document.getElementById(firstInvalidInputId);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.focus();
        }
        return;
    }

    if (isValid) {
        if (!currentUser) {
            if (typeof openLoginModal === 'function') openLoginModal();
            return;
        }

        try {
            const webType = document.getElementById('mapType').value;
            const pageComplexity = document.getElementById('pageComplexity').value;
            const totalPrice = document.getElementById('priceDisplay').innerText;
            
            const randomId = 'ORD-' + Math.random().toString(36).substring(2, 9).toUpperCase();
            const currentDate = new Date().toISOString();

            const orderData = {
                orderId: randomId,
                serviceCategory: 'Frontend Web Design',
                uid: currentUser.uid,
                customerName: currentUser.displayName || 'Anonymous',
                customerEmail: currentUser.email || 'No Email',
                webType: webType,
                pageComplexity: pageComplexity,
                designTheme: theme,
                projectDescription: desc,
                totalPrice: totalPrice,
                orderDate: currentDate,
                status: 'Pending'
            };

            const checkoutRef = ref(db, `account/data/checkout/${randomId}`);
            await set(checkoutRef, orderData);

            const displayOrderIdEl = document.getElementById('modalDisplayOrderId');
            if (displayOrderIdEl) displayOrderIdEl.innerText = randomId;
            
            if (typeof openSuccessModal === 'function') openSuccessModal();

            const orderForm = document.getElementById('orderForm');
            if (orderForm) orderForm.reset();
            
            if (typeof calculatePrice === 'function') calculatePrice();
        } catch (error) {
            console.error("Gagal menyimpan pesanan:", error);
            alert("Terjadi kesalahan saat menyimpan pesanan. Silakan coba lagi.");
        }
    }
};
