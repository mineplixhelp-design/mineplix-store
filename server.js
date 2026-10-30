const express = require('express');
const path = require('path');
const app = express();

// Menjadikan folder 'public' sebagai folder utama file statis (CSS, JS, Gambar)
app.use(express.static(path.join(__dirname, 'public')));

// --- DAFTAR HALAMAN (ROUTES) ---

// 1. Home / Halaman Utama
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 2. Status
app.get('/status', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'status.html'));
});

// 3. Support
app.get('/support', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'support.html'));
});

// 4. Layanan 1
app.get('/layanan-1', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'layanan-1.html'));
});

// 5. Layanan 2
app.get('/layanan-2', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'layanan-2.html'));
});

// 6. Layanan 3
app.get('/layanan-3', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'layanan-3.html'));
});

// Menjalankan server lokal
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server aktif di port ${PORT}`);
});
