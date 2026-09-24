// ==========================================
// KONFIGURASI SUPABASE
// ==========================================
const SUPABASE_URL = 'https://gyortxfcoifxzrwfogzr.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5b3J0eGZjb2lmeHpyd2ZvZ3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNzE2NzEsImV4cCI6MjEwNTc0NzY3MX0.dO07GyxM9WYRMHYOE70-nJQI_TONr7SXK7loXLRdkHU'; 

// Inisialisasi klien Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// FUNGSI NAVIGASI HALAMAN
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

// Cek status login saat halaman dimuat
async function checkAuthStatus() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (session) {
        document.getElementById('nav-login-btn').style.display = 'none';
        document.getElementById('nav-dashboard-btn').style.display = 'inline-block';
        document.getElementById('nav-logout-btn').style.display = 'inline-block';
    } else {
        document.getElementById('nav-login-btn').style.display = 'inline-block';
        document.getElementById('nav-dashboard-btn').style.display = 'none';
        document.getElementById('nav-logout-btn').style.display = 'none';
    }
}

// ==========================================
// LOGIKA TAMU (GUEST REGISTRASI)
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
            jam_masuk: new Date().toISOString(),
            status: 'Menunggu'
        }]);

    if (error) {
        messageDiv.className = 'message error';
        messageDiv.style.display = 'block';
        messageDiv.textContent = 'Gagal mendaftar: ' + error.message;
    } else {
        messageDiv.className = 'message success';
        messageDiv.style.display = 'block';
        messageDiv.textContent = 'Registrasi berhasil! Silakan tunggu konfirmasi dari Admin.';
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
        await checkAuthStatus();
        showPage('admin-dashboard');
    }
});

async function logoutAdmin() {
    await supabaseClient.auth.signOut();
    await checkAuthStatus();
    showPage('guest-page');
}

// ==========================================
// LOGIKA DASHBOARD ADMIN & APPROVAL
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

    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center;">Belum ada data tamu.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    
    data.forEach(guest => {
        const tr = document.createElement('tr');
        
        const regTime = new Date(guest.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });
        const inTime = guest.jam_masuk ? new Date(guest.jam_masuk).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';
        const outTime = guest.jam_keluar ? new Date(guest.jam_keluar).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';
        
        let statusBadge = '';
        let actionBtn = '';

        if (guest.status === 'Disetujui' || guest.status === 'Diberikan Akses') {
            statusBadge = '<span class="status-badge status-diberikan">Disetujui</span>';
            actionBtn = `<button onclick="checkoutGuest('${guest.id}')" class="btn-secondary">Jam Keluar</button>`;
        } else if (guest.status === 'Selesai') {
            statusBadge = '<span class="status-badge status-selesai">Selesai</span>';
            actionBtn = `<i>Selesai</i>`;
        } else {
            statusBadge = '<span class="status-badge status-menunggu">Menunggu</span>';
            actionBtn = `<button onclick="grantAccess('${guest.id}')" class="btn-success">Approve</button>`;
        }

        tr.innerHTML = `
            <td>${regTime}</td>
            <td><strong>${guest.nama}</strong></td>
            <td>${guest.instansi}</td>
            <td>${guest.jenis_id || '-'}</td>
            <td>${guest.keperluan}</td>
            <td>${inTime}</td>
            <td>${outTime}</td>
            <td>${statusBadge}</td>
            <td>${actionBtn}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Admin: Approve / Berikan Akses
async function grantAccess(id) {
    const now = new Date().toISOString();
    const { error } = await supabaseClient
        .from('guests')
        .update({ 
            status: 'Disetujui',
            jam_masuk: now
        })
        .eq('id', id);

    if (error) {
        alert('Gagal menyetujui akses: ' + error.message);
    } else {
        fetchGuests();
    }
}

// Admin: Tanda Jam Keluar (Checkout)
async function checkoutGuest(id) {
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
// TAMBAH AKUN LOGIN ADMIN (TANPA REGISTER EMAIL)
// ==========================================
function openAddAdminModal() {
    document.getElementById('add-admin-modal').style.display = 'block';
}

function closeAddAdminModal() {
    document.getElementById('add-admin-modal').style.display = 'none';
    document.getElementById('add-admin-message').style.display = 'none';
    document.getElementById('add-admin-form').reset();
}

document.getElementById('add-admin-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('new-admin-email').value;
    const password = document.getElementById('new-admin-password').value;
    const messageDiv = document.getElementById('add-admin-message');

    // Mendaftarkan akun admin baru tanpa memverifikasi email
    const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: password
    });

    if (error) {
        messageDiv.className = 'message error';
        messageDiv.style.display = 'block';
        messageDiv.textContent = 'Gagal menambah akun: ' + error.message;
    } else {
        messageDiv.className = 'message success';
        messageDiv.style.display = 'block';
        messageDiv.textContent = 'Akun admin berhasil dibuat! Pengguna dapat langsung menggunakan email & password ini untuk login.';
        document.getElementById('add-admin-form').reset();
    }
});

// ==========================================
// HAPUS SEMUA KONTEN & DATA (RESET KONFIGURASI)
// ==========================================
async function resetAllConfigAndData() {
    const confirmReset = confirm('APAKAH ANDA YAKIN?\n\nTindakan ini akan menghapus SELURUH data registrasi tamu yang tersimpan di database.');
    if (!confirmReset) return;

    // Menghapus semua baris dari tabel guests
    const { error } = await supabaseClient
        .from('guests')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Menghapus seluruh data

    if (error) {
        alert('Gagal mereset data: ' + error.message);
    } else {
        alert('Seluruh data tamu berhasil dihapus!');
        fetchGuests();
    }
}

// Inisialisasi status saat halaman dimuat
checkAuthStatus();