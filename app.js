// ==========================================
// KONFIGURASI SUPABASE
// ==========================================
const SUPABASE_URL = 'https://gyortxfcoifxzrwfogzr.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5b3J0eGZjb2lmeHpyd2ZvZ3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNzE2NzEsImV4cCI6MjEwNTc0NzY3MX0.dO07GyxM9WYRMHYOE70-nJQI_TONr7SXK7loXLRdkHU';

// Inisialisasi klien Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// State Konfigurasi Default
let webConfigs = {
    site_title: 'CompanySpace',
    guest_heading: 'Form Registrasi Tamu',
    guest_subheading: 'Silakan isi data diri Anda. Admin akan memberikan akses setelah data diverifikasi.'
};

// ==========================================
// FUNGSI NAVIGASI HALAMAN
// ==========================================
function showPage(pageId) {
    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(pageId);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    if (pageId === 'login-page') {
        const msgDiv = document.getElementById('login-message');
        if (msgDiv) {
            msgDiv.style.display = 'none';
            msgDiv.textContent = '';
        }
    }

    if (pageId === 'admin-dashboard') {
        fetchGuests();
        loadConfigToForm();
    }
}

// Cek status login saat halaman pertama dimuat
async function checkInitialAuth() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (session) {
        document.getElementById('nav-login-btn').style.display = 'none';
        document.getElementById('nav-logout-btn').style.display = 'inline-block';
        showPage('admin-dashboard');
    } else {
        document.getElementById('nav-login-btn').style.display = 'inline-block';
        document.getElementById('nav-logout-btn').style.display = 'none';
    }
}

// Event listener otentikasi Supabase Realtime
supabaseClient.auth.onAuthStateChange((event, session) => {
    const loginBtn = document.getElementById('nav-login-btn');
    const logoutBtn = document.getElementById('nav-logout-btn');

    if (session) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        if (event === 'SIGNED_IN') {
            showPage('admin-dashboard');
        }
    } else {
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (event === 'SIGNED_OUT') {
            showPage('guest-page');
        }
    }
});

// ==========================================
// LOGIKA BUKU TAMU (GUEST)
// ==========================================
document.getElementById('guest-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('guest-name').value;
    const company = document.getElementById('guest-company').value;
    const purpose = document.getElementById('guest-purpose').value;
    const messageDiv = document.getElementById('guest-message');

    const { error } = await supabaseClient
        .from('guests')
        .insert([{ nama: name, instansi: company, keperluan: purpose, status: 'Menunggu Akses' }]);

    if (error) {
        messageDiv.className = 'message error';
        messageDiv.style.display = 'block';
        messageDiv.textContent = 'Gagal mendaftar: ' + error.message;
    } else {
        messageDiv.className = 'message success';
        messageDiv.style.display = 'block';
        messageDiv.textContent = 'Registrasi berhasil! Silakan tunggu konfirmasi admin.';
        document.getElementById('guest-form').reset();
    }
});

// ==========================================
// LOGIKA ADMIN LOGIN & LOGOUT
// ==========================================
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    const messageDiv = document.getElementById('login-message');

    const { error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        messageDiv.className = 'message error';
        messageDiv.style.display = 'block';
        messageDiv.textContent = 'Email atau password salah!';
    } else {
        messageDiv.style.display = 'none';
        document.getElementById('login-form').reset();
        showPage('admin-dashboard');
    }
});

async function logoutAdmin() {
    await supabaseClient.auth.signOut();
}

// Switch Tab di Dashboard Admin
function switchAdminTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');

    if (tabId === 'data-tab') {
        document.getElementById('data-tab').style.display = 'block';
        event.target.classList.add('active');
        fetchGuests();
    } else if (tabId === 'config-tab') {
        document.getElementById('config-tab').style.display = 'block';
        event.target.classList.add('active');
        renderConfigTable();
    }
}

// ==========================================
// LOGIKA DASHBOARD ADMIN (AMBIL & HAPUS DATA TAMU)
// ==========================================
async function fetchGuests() {
    const tbody = document.getElementById('guests-tbody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6">Memuat data...</td></tr>';

    const { data, error } = await supabaseClient
        .from('guests')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching data:', error);
        tbody.innerHTML = '<tr><td colspan="6">Gagal memuat data</td></tr>';
        return;
    }

    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Belum ada data tamu.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    
    data.forEach(guest => {
        const tr = document.createElement('tr');
        const date = new Date(guest.created_at).toLocaleString('id-ID');
        
        let statusBadge = guest.status === 'Diberikan Akses' 
            ? '<span class="status-badge status-diberikan">Diberikan Akses</span>'
            : '<span class="status-badge status-menunggu">Menunggu</span>';

        let actionBtn = (guest.status === 'Menunggu Akses' || guest.status === 'Menunggu' || !guest.status)
            ? `<button onclick="grantAccess('${guest.id}')" class="btn-success btn-xs">Beri Akses</button>`
            : '<span class="text-muted">Akses Aktif</span>';

        tr.innerHTML = `
            <td>${date}</td>
            <td>${guest.nama}</td>
            <td>${guest.instansi}</td>
            <td>${guest.keperluan}</td>
            <td>${statusBadge}</td>
            <td>
                <div class="action-buttons">
                    ${actionBtn}
                    <button onclick="deleteGuest('${guest.id}')" class="btn-danger btn-xs">Hapus</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Beri Akses Tamu
async function grantAccess(id) {
    const { error } = await supabaseClient
        .from('guests')
        .update({ status: 'Diberikan Akses' })
        .eq('id', id);

    if (error) {
        alert('Gagal mengupdate status: ' + error.message);
    } else {
        fetchGuests();
    }
}

// Menghapus Satuan Data Tamu
async function deleteGuest(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus data tamu ini?')) return;

    const { error } = await supabaseClient
        .from('guests')
        .delete()
        .eq('id', id);

    if (error) {
        alert('Gagal menghapus data: ' + error.message);
    } else {
        fetchGuests();
    }
}

// Menghapus SEMUA Data Tamu
async function deleteAllGuests() {
    const confirmMessage = prompt('PERINGATAN! Ketik "HAPUS" untuk mengonfirmasi penghapusan seluruh data tamu:');
    if (confirmMessage !== 'HAPUS') {
        alert('Penghapusan dibatalkan.');
        return;
    }

    // Menghapus seluruh baris data pada tabel guests
    const { error } = await supabaseClient
        .from('guests')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Menghapus semua ID

    if (error) {
        alert('Gagal menghapus semua data: ' + error.message);
    } else {
        alert('Seluruh data tamu berhasil dihapus!');
        fetchGuests();
    }
}

// Toggle Form Tambah Tamu Manual Admin
function toggleAdminAddGuest() {
    const box = document.getElementById('admin-add-guest-box');
    box.style.display = box.style.display === 'none' ? 'block' : 'none';
}

// Submit Tambah Tamu Manual Admin
document.getElementById('admin-guest-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('admin-guest-name').value;
    const company = document.getElementById('admin-guest-company').value;
    const purpose = document.getElementById('admin-guest-purpose').value;

    const { error } = await supabaseClient
        .from('guests')
        .insert([{ nama: name, instansi: company, keperluan: purpose, status: 'Diberikan Akses' }]);

    if (error) {
        alert('Gagal menambah data tamu: ' + error.message);
    } else {
        alert('Data tamu berhasil ditambahkan!');
        document.getElementById('admin-guest-form').reset();
        toggleAdminAddGuest();
        fetchGuests();
    }
});

// ==========================================
// LOGIKA KONFIGURASI WEB (ADD / EDIT / DELETE CONFIG)
// ==========================================

// Muat Konfigurasi dari Supabase / LocalStorage
async function loadConfigurations() {
    try {
        const { data, error } = await supabaseClient.from('site_config').select('*');
        if (!error && data && data.length > 0) {
            data.forEach(item => {
                webConfigs[item.key] = item.value;
            });
        } else {
            const localCfg = localStorage.getItem('site_config');
            if (localCfg) {
                webConfigs = { ...webConfigs, ...JSON.parse(localCfg) };
            }
        }
    } catch (err) {
        const localCfg = localStorage.getItem('site_config');
        if (localCfg) {
            webConfigs = { ...webConfigs, ...JSON.parse(localCfg) };
        }
    }
    applyConfigToUI();
}

// Terapkan Konfigurasi ke Tampilan Web
function applyConfigToUI() {
    if (webConfigs.site_title) {
        document.getElementById('site-logo').textContent = webConfigs.site_title;
        document.getElementById('site-title-tag').textContent = webConfigs.site_title;
    }
    if (webConfigs.guest_heading) {
        document.getElementById('guest-heading').textContent = webConfigs.guest_heading;
    }
    if (webConfigs.guest_subheading) {
        document.getElementById('guest-subheading').textContent = webConfigs.guest_subheading;
    }
}

// Isikan Konfigurasi ke Form Admin
function loadConfigToForm() {
    document.getElementById('cfg-site-title').value = webConfigs.site_title || '';
    document.getElementById('cfg-guest-heading').value = webConfigs.guest_heading || '';
    document.getElementById('cfg-guest-subheading').value = webConfigs.guest_subheading || '';
    renderConfigTable();
}

// Simpan Konfigurasi Utama
document.getElementById('config-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('cfg-site-title').value;
    const heading = document.getElementById('cfg-guest-heading').value;
    const subheading = document.getElementById('cfg-guest-subheading').value;

    await saveSingleConfig('site_title', title);
    await saveSingleConfig('guest_heading', heading);
    await saveSingleConfig('guest_subheading', subheading);

    alert('Konfigurasi web berhasil disimpan!');
    loadConfigurations();
});

// Simpan/Tambah Konfigurasi Kustom (Key-Value)
document.getElementById('custom-config-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const key = document.getElementById('cfg-key').value.trim();
    const value = document.getElementById('cfg-value').value.trim();

    if (!key) return;

    await saveSingleConfig(key, value);
    alert(`Konfigurasi "${key}" berhasil ditambahkan/diperbarui!`);
    
    document.getElementById('custom-config-form').reset();
    loadConfigurations();
    renderConfigTable();
});

// Fungsi Pembantu Simpan Konfigurasi Tunggal (Supabase & LocalStorage)
async function saveSingleConfig(key, value) {
    webConfigs[key] = value;
    localStorage.setItem('site_config', JSON.stringify(webConfigs));

    try {
        await supabaseClient
            .from('site_config')
            .upsert([{ key: key, value: value }], { onConflict: 'key' });
    } catch (e) {
        console.log('Tabel site_config belum tersedia di Supabase, menyimpan secara lokal.');
    }
}

// Menampilkan Tabel Konfigurasi
function renderConfigTable() {
    const tbody = document.getElementById('config-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    const keys = Object.keys(webConfigs);
    if (keys.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3">Tidak ada konfigurasi tersimpan.</td></tr>';
        return;
    }

    keys.forEach(key => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><code>${key}</code></td>
            <td>${webConfigs[key]}</td>
            <td>
                <button onclick="deleteConfig('${key}')" class="btn-danger btn-xs">Hapus</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Menghapus Konfigurasi Spesifik
async function deleteConfig(key) {
    if (!confirm(`Apakah Anda yakin ingin menghapus konfigurasi "${key}"?`)) return;

    delete webConfigs[key];
    localStorage.setItem('site_config', JSON.stringify(webConfigs));

    try {
        await supabaseClient
            .from('site_config')
            .delete()
            .eq('key', key);
    } catch (e) {
        console.log('Proses hapus konfigurasi lokal selesai.');
    }

    alert(`Konfigurasi "${key}" telah dihapus.`);
    loadConfigurations();
    renderConfigTable();
}

// Reset Semua Konfigurasi ke Default
async function resetAllConfigs() {
    if (!confirm('Apakah Anda yakin ingin mengembalikan semua konfigurasi ke kondisi awal (Default)?')) return;

    webConfigs = {
        site_title: 'CompanySpace',
        guest_heading: 'Form Registrasi Tamu',
        guest_subheading: 'Silakan isi data diri Anda. Admin akan memberikan akses setelah data diverifikasi.'
    };

    localStorage.removeItem('site_config');

    try {
        await supabaseClient.from('site_config').delete().neq('key', '');
    } catch (e) {
        console.log('Reset konfigurasi lokal.');
    }

    alert('Semua konfigurasi berhasil di-reset!');
    loadConfigurations();
    loadConfigToForm();
}

// FITUR REALTIME DATABASE
function subscribeRealtimeGuests() {
    supabaseClient
        .channel('public:guests')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'guests' }, () => {
            fetchGuests();
        })
        .subscribe();
}

// Inisialisasi awal
loadConfigurations();
checkInitialAuth();
subscribeRealtimeGuests();