// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const morgan = require('morgan');
// body-parser sudah include di express versi terbaru, lebih simpel pakai express.json()
const cors = require('cors');

const app = express();

// Middleware
app.use(morgan('dev'));
app.use(cors());
app.use(express.json()); // Pengganti body-parser.json()

const PORT = process.env.PORT || 5000;

// SESUAIKAN PATH: 
// __dirname adalah folder 'backend'. 
// '..' berarti naik satu tingkat ke root, lalu masuk ke 'frontend'
const frontendPath = path.join(__dirname, '..', 'frontend');
const dataDir = path.join(__dirname, 'data');

// Pastikan folder data ada
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const fileTitik = path.join(dataDir, 'titik.json');

// Pastikan file titik.json ada
if (!fs.existsSync(fileTitik)) {
    fs.writeFileSync(fileTitik, JSON.stringify([], null, 2));
}

// Helper load/save
function loadTitik() {
    try {
        const data = fs.readFileSync(fileTitik, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        return [];
    }
}

function saveTitik(arr) {
    fs.writeFileSync(fileTitik, JSON.stringify(arr, null, 2));
}

/**
 * URUTAN PENTING:
 * 1. API Routes dulu
 * 2. Static Files (Frontend)
 * 3. Fallback (Index.html)
 */

// API: get semua titik
app.get('/api/titik', (req, res) => {
    const arr = loadTitik();
    res.json(arr);
});

// API: tambah titik
app.post('/api/titik', (req, res) => {
    const arr = loadTitik();
    const nextId = arr.reduce((m, x) => Math.max(m, x.id || 0), 0) + 1;
    const body = req.body;

    if (!body.nama || !body.kategori || !body.lat || !body.lng) {
        return res.status(400).json({ error: 'nama, kategori, lat, lng wajib diisi' });
    }

    const obj = {
        id: nextId,
        nama: body.nama,
        kategori: body.kategori,
        kecamatan: body.kecamatan || '',
        alamat: body.alamat || '',
        lat: parseFloat(body.lat),
        lng: parseFloat(body.lng)
    };

    arr.push(obj);
    saveTitik(arr);
    res.status(201).json(obj);
});

// API: hapus titik
app.delete('/api/titik/:id', (req, res) => {
    const id = parseInt(req.params.id);
    let arr = loadTitik();
    const before = arr.length;
    arr = arr.filter(x => x.id !== id);

    if (arr.length === before) return res.status(404).json({ error: 'Data tidak ditemukan' });

    saveTitik(arr);
    res.json({ ok: true, message: 'Berhasil dihapus' });
});

// Serve frontend static files
app.use(express.static(frontendPath));

// Fallback: serve index.html untuk semua route yang tidak terdaftar (PENTING untuk SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// Jalankan server dengan IP 0.0.0.0 agar bisa diakses di Railway/Cloud
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server berjalan di port ${PORT}`);
    console.log(`📂 Mendeteksi frontend di: ${frontendPath}`);
});