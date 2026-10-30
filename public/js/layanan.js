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

window.handleAuthAction = async () => {
    if (!currentUser) {
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            closeLoginModal();

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

window.handleAuthActionFromModal = async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        closeLoginModal();

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

onAuthStateChanged(auth, (user) => {
    currentUser = user;
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
});

// Form Submission Handler Universal
window.handleOrderSubmit = async function(event) {
    event.preventDefault();
    clearAllErrors();

    const theme = document.getElementById('mapTheme').value.trim();
    const desc = document.getElementById('mapDesc').value.trim();
    let isValid = true;
    let firstInvalidInputId = null;

    if (!desc) {
        showError('mapDesc', 'descError');
        isValid = false;
        firstInvalidInputId = 'mapDesc';
    }

    if (!theme) {
        showError('mapTheme', 'themeError');
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
            openLoginModal();
            return;
        }

        try {
            const totalPrice = document.getElementById('priceDisplay').innerText;
            const randomId = 'ORD-' + Math.random().toString(36).substring(2, 9).toUpperCase();
            const currentDate = new Date().toISOString();

            let orderData = {
                orderId: randomId,
                uid: currentUser.uid,
                customerName: currentUser.displayName || 'Anonymous',
                customerEmail: currentUser.email || 'No Email',
                designTheme: theme,
                totalPrice: totalPrice,
                orderDate: currentDate,
                status: 'Pending'
            };

            // Deteksi halaman berdasarkan elemen spesifik
            const mapTypeEl = document.getElementById('mapType');
            const variantCountEl = document.getElementById('variantCount');
            const pageComplexityEl = document.getElementById('pageComplexity');
            const mapSizeEl = document.getElementById('mapSize');

            if (variantCountEl) {
                orderData.serviceCategory = 'Graphic Design';
                orderData.graphicType = mapTypeEl ? mapTypeEl.value : '';
                orderData.variantCount = variantCountEl.value;
                orderData.designDescription = desc;
            } else if (pageComplexityEl) {
                orderData.serviceCategory = 'Frontend Web Design';
                orderData.webType = mapTypeEl ? mapTypeEl.value : '';
                orderData.pageComplexity = pageComplexityEl.value;
                orderData.projectDescription = desc;
            } else if (mapSizeEl) {
                orderData.serviceCategory = 'Minecraft Maps Builder';
                orderData.mapType = mapTypeEl ? mapTypeEl.value : '';
                orderData.mapSize = mapSizeEl.value + 'x' + mapSizeEl.value;
                orderData.mapDescription = desc;
            }

            const checkoutRef = ref(db, `account/data/checkout/${randomId}`);
            await set(checkoutRef, orderData);

            document.getElementById('modalDisplayOrderId').innerText = randomId;
            openSuccessModal();

            document.getElementById('orderForm').reset();
            if (typeof calculatePrice === 'function') calculatePrice();
            if (typeof calculateMapPrice === 'function') calculateMapPrice();
        } catch (error) {
            console.error("Gagal menyimpan pesanan:", error);
            alert("Terjadi kesalahan saat menyimpan pesanan. Silakan coba lagi.");
        }
    }
};

// UI Modals & Navigation Helpers
window.openLoginModal = function() {
    const modal = document.getElementById('loginModalOverlay');
    if (modal) modal.classList.add('show');
}

window.closeLoginModal = function() {
    const modal = document.getElementById('loginModalOverlay');
    if (modal) modal.classList.remove('show');
}

window.openSuccessModal = function() {
    const modal = document.getElementById('successModalOverlay');
    if (modal) modal.classList.add('show');
}

window.closeSuccessModal = function() {
    const modal = document.getElementById('successModalOverlay');
    if (modal) modal.classList.remove('show');
}

window.copyOrderIdToClipboard = function() {
    const orderIdText = document.getElementById('modalDisplayOrderId').innerText;
    navigator.clipboard.writeText(orderIdText).then(() => {
        const btn = document.querySelector('.copy-id-btn');
        if (btn) {
            btn.innerText = 'Berhasil Disalin!';
            setTimeout(() => {
                btn.innerText = 'Salin ID';
            }, 2000);
        }
    }).catch(err => {
        console.error('Gagal menyalin text: ', err);
    });
}

window.navigateToHome = function() { window.location.href = '../'; }
window.navigateToStatus = function() { window.location.href = '../status'; }
window.navigateToSupport = function() { window.location.href = '../support'; }

// Dropdown Toggles
window.toggleDropdownMenu = function(e) {
    e.stopPropagation();
    const menu = document.getElementById('dropdownMenuList');
    const chevron = document.getElementById('dropdownChevron');
    const isShown = menu.classList.contains('show');
    closeAllDropdowns();
    closeAllTooltips();
    if (!isShown && menu) {
        menu.classList.add('show');
        if (chevron) chevron.style.transform = 'rotate(180deg)';
    }
}

window.selectMapOption = function(value, text) {
    const inputType = document.getElementById('mapType');
    const mapText = document.getElementById('selectedMapText');
    if (inputType) inputType.value = value;
    if (mapText) mapText.innerText = text;
    closeAllDropdowns();
}

window.toggleVariantDropdownMenu = function(e) {
    e.stopPropagation();
    const menu = document.getElementById('variantDropdownMenuList');
    const chevron = document.getElementById('variantDropdownChevron');
    const isShown = menu.classList.contains('show');
    closeAllDropdowns();
    closeAllTooltips();
    if (!isShown && menu) {
        menu.classList.add('show');
        if (chevron) chevron.style.transform = 'rotate(180deg)';
    }
}

window.selectVariantOption = function(value, text) {
    const variantCount = document.getElementById('variantCount');
    const selectedVariantText = document.getElementById('selectedVariantText');
    if (variantCount) variantCount.value = value;
    if (selectedVariantText) selectedVariantText.innerText = text;
    closeAllDropdowns();
    calculatePrice();
}

window.togglePageDropdownMenu = function(e) {
    e.stopPropagation();
    const menu = document.getElementById('pageDropdownMenuList');
    const chevron = document.getElementById('pageDropdownChevron');
    const isShown = menu.classList.contains('show');
    closeAllDropdowns();
    closeAllTooltips();
    if (!isShown && menu) {
        menu.classList.add('show');
        if (chevron) chevron.style.transform = 'rotate(180deg)';
    }
}

window.selectPageOption = function(value, text) {
    const pageComplexity = document.getElementById('pageComplexity');
    const selectedPageText = document.getElementById('selectedPageText');
    if (pageComplexity) pageComplexity.value = value;
    if (selectedPageText) selectedPageText.innerText = text;
    closeAllDropdowns();
    calculatePrice();
}

// Kalkulator Harga & Slider
window.calculatePrice = function() {
    const countEl = document.getElementById('variantCount');
    const complexityEl = document.getElementById('pageComplexity');
    const sizePriceAdd = document.getElementById('sizePriceAdd');
    const priceDisplay = document.getElementById('priceDisplay');

    if (countEl) {
        const count = countEl.value;
        const basePrice = 15000;
        let addPrice = (count === '3') ? 20000 : 0;
        if (sizePriceAdd) sizePriceAdd.innerText = 'Rp ' + addPrice.toLocaleString('id-ID');
        if (priceDisplay) priceDisplay.innerText = 'Rp ' + (basePrice + addPrice).toLocaleString('id-ID');
    } else if (complexityEl) {
        const complexity = complexityEl.value;
        const basePrice = 25000;
        let addPrice = (complexity === 'multi') ? 15000 : 0;
        if (sizePriceAdd) sizePriceAdd.innerText = 'Rp ' + addPrice.toLocaleString('id-ID');
        if (priceDisplay) priceDisplay.innerText = 'Rp ' + (basePrice + addPrice).toLocaleString('id-ID');
    }
}

window.updateSliderFill = function(slider) {
    const min = parseFloat(slider.min) || 0;
    const max = parseFloat(slider.max) || 100;
    const val = parseFloat(slider.value) || 0;
    const percentage = ((val - min) / (max - min)) * 100;
    slider.style.setProperty('--slider-progress', percentage + '%');
}

window.calculateMapPrice = function() {
    const slider = document.getElementById('mapSize');
    if (!slider) return;
    updateSliderFill(slider);

    const size = parseInt(slider.value, 10);
    const sizeVal = document.getElementById('sizeVal');
    const sizeVal2 = document.getElementById('sizeVal2');
    const summarySizeText = document.getElementById('summarySizeText');
    if (sizeVal) sizeVal.innerText = size;
    if (sizeVal2) sizeVal2.innerText = size;
    if (summarySizeText) summarySizeText.innerText = size + 'x' + size;
    
    const basePrice = 10000;
    const multiplier = size / 5;
    const sizeAddPrice = multiplier * 5000;
    const totalPrice = basePrice + sizeAddPrice;

    const sizePriceAdd = document.getElementById('sizePriceAdd');
    const priceDisplay = document.getElementById('priceDisplay');
    if (sizePriceAdd) sizePriceAdd.innerText = 'Rp ' + sizeAddPrice.toLocaleString('id-ID');
    if (priceDisplay) priceDisplay.innerText = 'Rp ' + totalPrice.toLocaleString('id-ID');
}

// Tooltips & Errors
window.toggleTooltip = function(e, tooltipId) {
    e.stopPropagation();
    const tooltip = document.getElementById(tooltipId);
    const isShown = tooltip ? tooltip.classList.contains('show') : false;
    closeAllTooltips();
    closeAllDropdowns();
    if (!isShown && tooltip) tooltip.classList.add('show');
}

window.closeAllDropdowns = function() {
    ['dropdownMenuList', 'variantDropdownMenuList', 'pageDropdownMenuList'].forEach(id => {
        const menu = document.getElementById(id);
        if (menu) menu.classList.remove('show');
    });
    ['dropdownChevron', 'variantDropdownChevron', 'pageDropdownChevron'].forEach(id => {
        const chevron = document.getElementById(id);
        if (chevron) chevron.style.transform = 'rotate(0deg)';
    });
}

window.closeAllTooltips = function() {
    document.querySelectorAll('.floating-tooltip').forEach(t => t.classList.remove('show'));
}

window.showError = function(inputId, errorId) {
    const error = document.getElementById(errorId);
    const input = document.getElementById(inputId);
    if (error) error.classList.add('show');
    if (input) {
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        input.focus();
    }
}

window.clearError = function(inputId, errorId) {
    const error = document.getElementById(errorId);
    if (error) error.classList.remove('show');
}

window.clearAllErrors = function() {
    clearError('mapTheme', 'themeError');
    clearError('mapDesc', 'descError');
}

window.addEventListener('DOMContentLoaded', () => {
    if (typeof calculatePrice === 'function') calculatePrice();
    if (typeof calculateMapPrice === 'function') calculateMapPrice();
});

window.addEventListener('click', function(e) {
    closeAllDropdowns();
    closeAllTooltips();
});