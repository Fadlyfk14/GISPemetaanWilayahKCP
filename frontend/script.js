// ================== KONFIGURASI DASAR ==================
// Menggunakan string kosong agar otomatis menyesuaikan dengan domain tempat dia di-deploy
const API_ROOT = ''; 
const map = L.map('map').setView([-6.9, 107.56], 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19
}).addTo(map);

// ================== UTIL WARNA KONSISTEN ==================
function colorFromString(str){
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return "#" + "000000".substring(0, 6 - color.length) + color;
}

// ================== STATE ==================
let kecColors = {};
let markers = [];
let titikData = [];
let wilayahData = [];

// ================== LOAD WILAYAH (POLYGON) ==================
async function loadWilayah(){
  try {
    // Memanggil file statis wilayah.json
    const res = await fetch('/data/wilayah.json'); 
    wilayahData = await res.json();
  } catch (e) {
    console.error("Gagal load wilayah.json:", e);
    wilayahData = [];
  }

  wilayahData.forEach(w => {
    const color = colorFromString(w.kecamatan);
    L.polygon(
      w.coordinates.map(c => [c[1], c[0]]),
      { color, fillColor: color, fillOpacity: 0.25 }
    ).addTo(map).bindPopup('Kecamatan: ' + w.kecamatan);
  });
}

// ================== REBUILD KECAMATAN ==================
function rebuildKecamatan(){
  kecColors = {};
  wilayahData.forEach(w => {
    if (w.kecamatan) kecColors[w.kecamatan] = colorFromString(w.kecamatan);
  });
  titikData.forEach(t => {
    if (t.kecamatan) kecColors[t.kecamatan] = colorFromString(t.kecamatan);
  });
  buildLegend();
  buildFilters();
}

// ================== FETCH TITIK DARI BACKEND ==================
async function fetchTitik(){
  try {
    // Ditambahkan prefix /api sesuai dengan server.js
    const res = await fetch(API_ROOT + '/api/titik');
    titikData = await res.json();

    clearMarkers();
    rebuildKecamatan();
    renderTable(titikData);
    placeMarkers(titikData);
  } catch (e) {
    console.error("Gagal fetch data titik:", e);
  }
}

// ================== LEGEND ==================
function buildLegend(){
  const container = document.getElementById('legendItems');
  if(!container) return;
  container.innerHTML = '';

  Object.keys(kecColors).sort().forEach(kec => {
    const div = document.createElement('div');
    div.className = 'legend-item';
    div.innerHTML = `
      <div class="legend-color" style="background:${kecColors[kec]}"></div>
      <div>${kec}</div>
    `;
    container.appendChild(div);
  });
}

// ================== FILTER ==================
function buildFilters(){
  const kecSelect = document.getElementById('filterKec');
  if(!kecSelect) return;
  
  kecSelect.innerHTML = '<option value="">-- Semua Kecamatan --</option>';
  Object.keys(kecColors).sort().forEach(kec => {
    const opt = document.createElement('option');
    opt.value = kec;
    opt.textContent = kec;
    kecSelect.appendChild(opt);
  });

  document.getElementById('filterJenis').onchange = applyFilters;
  document.getElementById('filterKec').onchange = applyFilters;
  document.getElementById('search').oninput = applyFilters;
  
  const btnAdd = document.getElementById('btnAdd');
  if(btnAdd) btnAdd.onclick = () => location.href = '/add.html';
}

// ================== APPLY FILTER ==================
function applyFilters(){
  const jenis = document.getElementById('filterJenis').value;
  const kec = document.getElementById('filterKec').value;
  const q = document.getElementById('search').value.toLowerCase();

  const filtered = titikData.filter(t => {
    if (jenis && t.kategori !== jenis) return false;
    if (kec && t.kecamatan !== kec) return false;
    if (q && !t.nama.toLowerCase().includes(q)) return false;
    return true;
  });

  clearMarkers();
  renderTable(filtered);
  placeMarkers(filtered);
}

// ================== TABLE ==================
function renderTable(data){
  const tbody = document.querySelector('#kantorTable tbody');
  if(!tbody) return;
  tbody.innerHTML = '';

  data.forEach(t => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${t.nama}</td>
      <td>${t.kategori}</td>
      <td>${t.kecamatan || ''}</td>
      <td><button class="action-btn" data-id="${t.id}">Hapus</button></td>
    `;

    tr.onclick = (e) => {
      if (e.target.tagName === 'BUTTON') return;
      map.setView([t.lat, t.lng], 15);
      markers.find(m => m.metaId === t.id)?.openPopup();
    };

    tbody.appendChild(tr);
  });

  document.querySelectorAll('.action-btn').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      if (!confirm('Hapus titik ini?')) return;
      
      // Update endpoint DELETE dengan /api
      await fetch(API_ROOT + '/api/titik/' + btn.dataset.id, { method: 'DELETE' });
      fetchTitik(); 
    };
  });
}

// ================== MARKER ==================
function placeMarkers(data){
  data.forEach(t => {
    const color = kecColors[t.kecamatan] || '#3388ff';
    const m = L.circleMarker([t.lat, t.lng], {
      radius: 8,
      fillColor: color,
      color: '#333',
      weight: 1,
      fillOpacity: 1
    }).addTo(map);

    m.bindPopup(`<b>${t.nama}</b><br>${t.kategori}<br>${t.kecamatan || ''}`);
    m.metaId = t.id;
    markers.push(m);
  });
}

function clearMarkers(){
  markers.forEach(m => map.removeLayer(m));
  markers = [];
}

// ================== INIT ==================
(async function(){
  await loadWilayah();
  await fetchTitik();
})();