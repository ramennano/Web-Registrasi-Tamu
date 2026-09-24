// ==========================================
// KONFIGURASI SUPABASE
// ==========================================
const SUPABASE_URL = 'https://gyortxfcoifxzrwfogzr.supabase.co'; // Sesuaikan URL Supabase Anda
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5b3J0eGZjb2lmeHpyd2ZvZ3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNzE2NzEsImV4cCI6MjEwNTc0NzY3MX0.dO07GyxM9WYRMHYOE70-nJQI_TONr7SXK7loXLRdkHU'; // Sesuaikan Anon Key

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// FUNGSI NAVIGASI
// ==========================================
function showPage(pageId) {
    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');

    if(pageId === 'admin-dashboard') {
        fetchGuests();
    }
}

function switchAdminTab(tabId) {
    document.querySelectorAll('.admin-tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
}

async function checkAuthStatus() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (session) {
        document.getElementById('nav-login-btn').style.display = 'none';
        document.getElementById('nav-logout-btn').style.display = 'inline-block';
        showPage('admin-dashboard');
    } else {
        document.getElementById('nav-login-btn').style.display = 'inline-block';
        document.getElementById('nav-logout-btn').style.display = 'none';
        showPage('guest-page');
    }
}

// ==========================================
// LOGIKA BUKU TAMU
// ==========================================
document.getElementById('guest-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('guest-name').value;
    const company = document.getElementById('guest-company').value;
    const idType = document.getElementById('guest-id-type').value;
    const purpose = document.getElementById('guest-purpose').value;
    const messageDiv = document.getElementById('guest-message');

    const { error } = await supabaseClient
        .from('guests')
        .insert([{ 
            nama: name, 
            instansi: company, 
            jenis_id: idType,
            keperluan: purpose,
            status: 'Menunggu'
        }]);

    if (error) {
        messageDiv.className = 'message error';
        messageDiv.textContent = 'Gagal mendaftar: ' + error.message;
    } else {
        messageDiv.className = 'message success';
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
        messageDiv.textContent = 'Email atau password salah!';
    } else {
        messageDiv.style.display = 'none';
        document.getElementById('login-form').reset();
        checkAuthStatus();
    }
});

async function logoutAdmin() {
    await supabaseClient.auth.signOut();
    checkAuthStatus();
}

// ==========================================
// LOGIKA DASHBOARD ADMIN
// ==========================================
async function fetchGuests() {
    const tbody = document.getElementById('guests-tbody');
    tbody.innerHTML = '<tr><td colspan="9">Memuat data...</td></tr>';

    const { data, error } = await supabaseClient
        .from('guests')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching data:', error);
        tbody.innerHTML = '<tr><td colspan="9">Gagal memuat data</td></tr>';
        return;
    }

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9">Belum ada data kunjungan.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    
    data.forEach(guest => {
        const tr = document.createElement('tr');
        const regDate = new Date(guest.created_at).toLocaleString('id-ID');
        const jamMasuk = guest.jam_masuk ? new Date(guest.jam_masuk).toLocaleTimeString('id-ID') : '-';
        const jamKeluar = guest.jam_keluar ? new Date(guest.jam_keluar).toLocaleTimeString('id-ID') : '-';
        
        let statusBadge = '<span class="status-badge status-menunggu">Menunggu</span>';
        if (guest.status === 'Diberikan Akses') {
            statusBadge = '<span class="status-badge status-diberikan">Akses Diberikan</span>';
        } else if (guest.status === 'Selesai') {
            statusBadge = '<span class="status-badge status-selelasi">Selesai</span>';
        }

        let actionBtn = '';
        if (guest.status === 'Menunggu') {
            actionBtn = `<button onclick="grantAccess('${guest.id}')" class="btn-success">Approve & Masuk</button>`;
        } else if (guest.status === 'Diberikan Akses' && !guest.jam_keluar) {
            actionBtn = `<button onclick="setCheckOut('${guest.id}')" class="btn-warning">Catat Keluar</button>`;
        } else {
            actionBtn = '<i>Kunjungan Selesai</i>';
        }

        tr.innerHTML = `
            <td>${regDate}</td>
            <td>${guest.nama}</td>
            <td>${guest.instansi}</td>
            <td>${guest.jenis_id}</td>
            <td>${guest.keperluan}</td>
            <td>${jamMasuk}</td>
            <td>${jamKeluar}</td>
            <td>${statusBadge}</td>
            <td>${actionBtn}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Approve / Beri Akses & Catat Jam Masuk
async function grantAccess(id) {
    const now = new Date().toISOString();
    const { error } = await supabaseClient
        .from('guests')
        .update({ 
            status: 'Diberikan Akses',
            jam_masuk: now 
        })
        .eq('id', id);

    if (error) {
        alert('Gagal mengupdate akses: ' + error.message);
    } else {
        fetchGuests();
    }
}

// Catat Jam Keluar Tamu
async function setCheckOut(id) {
    const now = new Date().toISOString();
    const { error } = await supabaseClient
        .from('guests')
        .update({ 
            status: 'Selesai',
            jam_keluar: now 
        })
        .eq('id', id);

    if (error) {
        alert('Gagal mencatat jam keluar: ' + error.message);
    } else {
        fetchGuests();
    }
}

// ==========================================
// LOGIKA TAMBAH AKUN ADMIN BARU
// ==========================================
document.getElementById('add-admin-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('new-admin-email').value;
    const password = document.getElementById('new-admin-password').value;
    const messageDiv = document.getElementById('add-admin-message');

    const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: password
    });

    if (error) {
        messageDiv.className = 'message error';
        messageDiv.textContent = 'Gagal menambah admin: ' + error.message;
    } else {
        messageDiv.className = 'message success';
        messageDiv.textContent = 'Akun admin berhasil dibuat! (Pengguna dapat langsung login atau verifikasi email jika diaktifkan).';
        document.getElementById('add-admin-form').reset();
    }
});

// ==========================================
// LOGIKA RESET & HAPUS KONFIGURASI WEB
// ==========================================
async function deleteAllGuestsData() {
    if (!confirm('Apakah Anda yakin ingin MENGHAPUS SEMUA DATA TAMU? Tindakan ini tidak dapat dibatalkan!')) {
        return;
    }

    const { error } = await supabaseClient
        .from('guests')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Menghapus seluruh baris

    if (error) {
        alert('Gagal menghapus data: ' + error.message);
    } else {
        alert('Seluruh data tamu berhasil dihapus!');
        fetchGuests();
    }
}

function resetWebConfig() {
    if (!confirm('Apakah Anda yakin ingin mereset konfigurasi & cache lokal web ini?')) {
        return;
    }

    // Clear Local Storage & Session Storage
    localStorage.clear();
    sessionStorage.clear();
    
    alert('Konfigurasi web berhasil direset.');
    window.location.reload();
}

// Inisialisasi saat pertama kali halaman dimuat
checkAuthStatus();