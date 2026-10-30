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
    set, 
    onValue 
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
let activeListenerRef = null;

window.handleAuthAction = async () => {
    const authContainer = document.getElementById('authContainer');
    
    if (!currentUser) {
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            const notifRef = ref(db, 'notifikasi');
            const newNotifRef = push(notifRef);
            const pagePath = window.location.pathname;
            
            await set(newNotifRef, {
                uid: user.uid,
                displayName: user.displayName || 'No Name',
                email: user.email || 'No Email',
                photoURL: user.photoURL || '',
                timestamp: new Date().toISOString(),
                type: 'google_login',
                message: `User ${user.displayName} (${user.email}) logged in successfully on ${pagePath}.`
            });
        } catch (error) {
            console.error("Login Error:", error);
        }
    } else {
        try {
            if (activeListenerRef) {
                onValue(activeListenerRef, null);
                activeListenerRef = null;
            }
            await signOut(auth);
        } catch (error) {
            console.error("Logout Error:", error);
        }
    }
};

onAuthStateChanged(auth, (user) => {
    currentUser = user;
    const authContainer = document.getElementById('authContainer');

    if (authContainer) {
        if (user) {
            const initial = (user.displayName || user.email || 'U').charAt(0).toUpperCase();
            authContainer.innerHTML = `
                <div class="auth-bar" onclick="handleAuthAction()">
                    <div class="auth-icon-circle">${initial}</div>
                    <span>Logout</span>
                </div>
            `;
            
            const orderIdInput = document.getElementById('orderIdInput');
            if (orderIdInput && orderIdInput.value.trim() === '') {
                window.searchOrderStatus();
            }
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

window.searchOrderStatus = function() {
    const orderIdInput = document.getElementById('orderIdInput');
    if (!orderIdInput) return;

    const orderIdInputVal = orderIdInput.value.trim();
    const errorMsg = document.getElementById('errorMsg');
    const resultWrapper = document.getElementById('resultWrapper');
    const ordersContainer = document.getElementById('ordersContainer');

    if (errorMsg) errorMsg.style.display = 'none';
    if (resultWrapper) resultWrapper.classList.remove('show');
    if (ordersContainer) ordersContainer.innerHTML = '';

    if (activeListenerRef) {
        onValue(activeListenerRef, null);
        activeListenerRef = null;
    }

    if (orderIdInputVal !== '') {
        const orderId = orderIdInputVal.toUpperCase();
        activeListenerRef = ref(db, `account/data/checkout/${orderId}`);

        onValue(activeListenerRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                renderOrderCards([data]);
            } else {
                if (resultWrapper) resultWrapper.classList.remove('show');
                if (errorMsg) {
                    errorMsg.innerText = 'ID Pesanan tidak ditemukan atau belum terdaftar di sistem.';
                    errorMsg.style.display = 'block';
                }
            }
        }, (error) => {
            console.error("Gagal memantau pesanan:", error);
            if (errorMsg) {
                errorMsg.innerText = 'Terjadi kesalahan koneksi database.';
                errorMsg.style.display = 'block';
            }
        });

    } else {
        if (!currentUser) {
            if (errorMsg) {
                errorMsg.innerText = 'Silakan login terlebih dahulu untuk melacak pesanan berdasarkan akun Anda, atau masukkan ID Pesanan.';
                errorMsg.style.display = 'block';
            }
            return;
        }

        activeListenerRef = ref(db, `account/data/checkout`);

        onValue(activeListenerRef, (snapshot) => {
            if (snapshot.exists()) {
                const allOrders = snapshot.val();
                const matchedOrders = [];

                Object.values(allOrders).forEach(order => {
                    if ((order.uid && order.uid === currentUser.uid) || 
                        (order.customerEmail && currentUser.email && order.customerEmail.toLowerCase() === currentUser.email.toLowerCase())) {
                        matchedOrders.push(order);
                    }
                });

                if (matchedOrders.length > 0) {
                    renderOrderCards(matchedOrders);
                } else {
                    if (resultWrapper) resultWrapper.classList.remove('show');
                    if (errorMsg) {
                        errorMsg.innerText = 'Tidak ada pesanan yang ditemukan untuk akun Anda saat ini.';
                        errorMsg.style.display = 'block';
                    }
                }
            } else {
                if (resultWrapper) resultWrapper.classList.remove('show');
                if (errorMsg) {
                    errorMsg.innerText = 'Belum ada data pesanan di database.';
                    errorMsg.style.display = 'block';
                }
            }
        }, (error) => {
            console.error("Gagal memantau pesanan:", error);
            if (errorMsg) {
                errorMsg.innerText = 'Terjadi kesalahan koneksi database.';
                errorMsg.style.display = 'block';
            }
        });
    }
};

function renderOrderCards(ordersList) {
    const ordersContainer = document.getElementById('ordersContainer');
    const resultWrapper = document.getElementById('resultWrapper');
    if (!ordersContainer) return;

    ordersContainer.innerHTML = '';

    ordersList.forEach(data => {
        let formattedDate = '-';
        if (data.orderDate) {
            try {
                const dateObj = new Date(data.orderDate);
                formattedDate = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
            } catch (e) {
                formattedDate = data.orderDate;
            }
        }

        let specText = '';
        if (data.mapType) specText += `Jenis: ${data.mapType}, Ukuran: ${data.mapSize}, Tema: ${data.mapTheme}`;
        else if (data.webType) specText += `Tipe: ${data.webType}, Kompleksitas: ${data.pageComplexity}, Tema: ${data.designTheme}`;
        else if (data.graphicType) specText += `Tipe: ${data.graphicType}, Varian: ${data.variantCount}, Tema: ${data.designTheme}`;
        else specText = data.mapDescription || data.projectDescription || data.designDescription || 'Custom Request';

        const status = data.status || 'Pending';
        let displayedPrice = 'Harga Belum Pasti';
        if (status !== 'Pending') {
            displayedPrice = data.totalPrice || 'Rp 0';
        }

        let actionHtml = '';

        if (status === 'Pending') {
            actionHtml = `
                <div style="background-color: #16131a; padding: 18px; border-radius: 16px; margin-top: 16px; text-align: center;">
                    <h4 style="font-size: 1rem; margin-bottom: 4px;">Menunggu Konfirmasi Admin</h4>
                    <p style="color: var(--text-muted); font-size: 0.85rem;">Admin kami sedang memeriksa detail pesanan Anda dan akan segera menentukan nominal total serta QRIS pembayaran.</p>
                </div>
            `;
        } else if (status === 'Menunggu Pembayaran' || status === 'Payment') {
            actionHtml = `
                <div class="payment-action-box">
                    <h4 style="font-size: 1rem; font-weight: 700; margin-bottom: 4px;">Silakan Lakukan Pembayaran QRIS</h4>
                    <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 12px;">Scan kode QRIS di bawah ini sesuai dengan nominal harga total pesanan Anda.</p>
                    <img src="../public/img/qris.png" alt="QRIS Mineplix" class="qris-img-full">
                    <a href="../public/img/qris.jpeg" download="QRIS-Mineplix.jpeg" class="download-qris-btn">
                        <i class="fa-solid fa-download"></i> Download QRIS
                    </a>
                    <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 10px;">Setelah transfer, konfirmasikan bukti pembayaran ke Discord Ticket.</p>
                </div>
            `;
        } else if (status === 'Pengerjaan' || status === 'Progress') {
            actionHtml = `
                <div style="background-color: #16131a; padding: 18px; border-radius: 16px; margin-top: 16px; text-align: center;">
                    <h4 style="font-size: 1rem; margin-bottom: 4px;">Dalam Pengerjaan (24 Jam / 3 Hari)</h4>
                    <p style="color: var(--text-muted); font-size: 0.85rem;">Estimasi waktu pengerjaan berkisar antara 24 jam hingga 3 hari kerja. Anda dapat meninggalkan halaman ini dan memantau secara berkala.</p>
                </div>
            `;
        } else if (status === 'Selesai' || status === 'Completed') {
            actionHtml = `
                <div style="background-color: #16131a; padding: 18px; border-radius: 16px; margin-top: 16px; text-align: center;">
                    <h4 style="font-size: 1rem; margin-bottom: 4px; color: var(--text-white);">Project Selesai</h4>
                    <p style="color: var(--text-muted); font-size: 0.85rem;">Hasil file project dan informasi selengkapnya telah dikirimkan ke email Anda (${data.customerEmail || 'terdaftar'}).</p>
                </div>
            `;
        }

        const cardHtml = `
            <div class="status-card">
                <div>
                    <div class="status-header-flex">
                        <span class="order-id-label">${data.orderId}</span>
                        <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;"><i class="fa-regular fa-calendar" style="margin-right: 4px;"></i> ${formattedDate}</span>
                    </div>

                    <div class="status-detail-grid">
                        <div class="detail-item-box">
                            <div class="detail-label">Kategori Layanan</div>
                            <div class="detail-value">${data.serviceCategory || 'Minecraft Maps Builder'}</div>
                        </div>
                        <div class="detail-item-box">
                            <div class="detail-label">Pemesan</div>
                            <div class="detail-value">${data.customerName || 'Anonymous'}</div>
                        </div>
                        <div class="detail-item-box">
                            <div class="detail-label">Detail Pesanan</div>
                            <div class="detail-value">${specText}</div>
                        </div>
                        <div class="detail-item-box">
                            <div class="detail-label">Total Biaya</div>
                            <div class="detail-value">${displayedPrice}</div>
                        </div>
                    </div>

                    ${actionHtml}
                </div>

                <div class="ticket-support-box">
                    <div>
                        <strong style="font-size: 0.9rem;">Butuh revisi atau pertanyaan?</strong>
                        <div style="font-size: 0.8rem; color: var(--text-muted);">Buka tiket bantuan melalui Discord.</div>
                    </div>
                    <a href="https://discord.gg/bJNR4cPhYh" target="_blank" class="ticket-btn">
                        <i class="fa-brands fa-discord"></i> Discord Ticket
                    </a>
                </div>
            </div>
        `;
        ordersContainer.innerHTML += cardHtml;
    });

    if (resultWrapper) resultWrapper.classList.add('show');
}

document.addEventListener('DOMContentLoaded', () => {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const icon = item.querySelector('.faq-icon i');

        if (question) {
            question.addEventListener('click', () => {
                const isActive = item.classList.contains('active');

                faqItems.forEach(otherItem => {
                    otherItem.classList.remove('active');
                    const otherIcon = otherItem.querySelector('.faq-icon i');
                    if (otherIcon) {
                        otherIcon.className = 'fa-solid fa-plus';
                    }
                });

                if (!isActive) {
                    item.classList.add('active');
                    if (icon) icon.className = 'fa-solid fa-minus';
                }
            });
        }
    });
});

window.scrollToHome = function() {
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setActiveNav('home');
    } else {
        window.location.href = '../';
    }
};

window.navigateToHome = function() {
    window.location.href = '../';
};

window.navigateToStatus = function() {
    window.location.href = '../status';
};

window.navigateToSupport = function() {
    window.location.href = '../support';
};

window.setActiveNav = function(type) {
    document.querySelectorAll('.nav-link-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.bottom-nav-item').forEach(el => el.classList.remove('active'));
    
    if (type === 'home') {
        const deskHome = document.getElementById('desktopHome');
        const mobHome = document.getElementById('mobHome');
        if (deskHome) deskHome.classList.add('active');
        if (mobHome) mobHome.classList.add('active');
    }
};
