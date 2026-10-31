const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/status', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'status.html'));
});

app.get('/support', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'support.html'));
});

app.get('/server', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'server.html'));
});

app.get('/server/wiki', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'wiki.html'));
});

app.get('/envadminanv', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/layanan/frontend-design', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'frontend-design.html'));
});

app.get('/layanan/graphic-design', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'graphic-design.html'));
});

app.get('/layanan/maps-builder', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'maps-builder.html'));
});

app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server aktif di port ${PORT}`);
});
