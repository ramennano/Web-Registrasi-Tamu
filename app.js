// ==========================================
// KONFIGURASI SUPABASE (MASUKKAN URL & KEY ANDA DI SINI)
// ==========================================
const SUPABASE_URL = 'https://gyortxfcoifxzrwfogzr.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5b3J0eGZjb2lmeHpyd2ZvZ3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNzE2NzEsImV4cCI6MjEwNTc0NzY3MX0.dO07GyxM9WYRMHYOE70-nJQI_TONr7SXK7loXLRdkHU'; 

// Inisialisasi Klien Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// State Session Sederhana untuk Admin
let currentAdminUser = localStorage.getItem('admin_user') || null;

// ==========================================
// FUNGSI NAVIGASI HALAMAN
// ==========================================
function showPage(pageId) {
    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');

    // Memuat data sesuai halaman
    if (pageId === 'admin-dashboard') {
        fetchGuests();
    } else if (pageId === 'admin-manage-page') {
        fetchAdmins();
    }
}

// Cek Status Akses/Session Admin
function checkAuthStatus() {
    if (currentAdminUser) {
        document.getElementById('nav-login-btn').style.display = 'none';
        document.getElementById('nav-dash-btn').style.display = 'inline-block';
        document.getElementById('nav-manage-admin-btn').style.display = 'inline-block';
        document.getElementById('nav-logout-btn').style.display = 'inline-block';
    } else {
        document.getElementById('nav-login-btn').style.display = 'inline-block';
        document.getElementById('nav-dash-btn').style.display = 'none';
        document.getElementById('nav-manage-admin-btn').style.display = 'none';
        document.getElementById('nav-logout-btn').style.display = 'none';
    }
}

// Modal Toggle
function toggleModal(modalId, show) {
    document.getElementById(modalId).style.display = show ? 'block' : 'none';
}

// ==========================================
// REGISTRASI TAMU MANDIRI (PUBLIC)
// ==========================================
document.getElementById('guest-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nama = document.getElementById('guest-name').value;
    const jenis_id = document.getElementById('guest-id-type').value;
    const instansi = document.getElementById('guest-company').value;
    const keperluan = document.getElementById('guest-purpose').value;
    const messageDiv = document.getElementById('guest-message');

    const { error } = await supabaseClient
        .from('guests')
        .insert([{ 
            nama, 
            jenis_id, 
            instansi, 
            keperluan, 
            jam_masuk: new Date().toISOString(),
            status: 'Menunggu' 
        }]);

    if (error) {
        messageDiv.className = 'message error';
        messageDiv.textContent = 'Gagal mengirim pendaftaran: ' + error.message;
    } else {
        messageDiv.className = 'message success';
        messageDiv.textContent = 'Registrasi berhasil dikirim! Silakan tunggu konfirmasi dari Admin.';
        document.getElementById('guest-form').reset();
    }
});

// ==========================================
// LOGIN ADMIN (MENGGUNAKAN TABEL ADMIN_USERS)
// ==========================================
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const usernameInput = document.getElementById('admin-username').value.trim();
    const passwordInput = document.getElementById('admin-password').value.trim();
    const messageDiv = document.getElementById('login-message');

    const { data, error } = await supabaseClient
        .from('admin_users')
        .select('*')
        .eq('username', usernameInput)
        .eq('password', passwordInput)
        .single();

    if (error || !data) {
        messageDiv.style.display = 'block';
        messageDiv.textContent = 'Username atau Password salah!';
    } else {
        messageDiv.style.display = 'none';
        currentAdminUser = data.username;
        localStorage.setItem('admin_user', data.username);
        document.getElementById('login-form').reset();
        checkAuthStatus();
        showPage('admin-dashboard');
    }
});

function logoutAdmin() {
    currentAdminUser = null;
    localStorage.removeItem('admin_user');
    checkAuthStatus();
    showPage('guest-page');
}

// ==========================================
// MANAJEMEN AKUN ADMIN BARU (TANPA EMAIL)
// ==========================================
document.getElementById('create-admin-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('new-admin-username').value.trim();
    const password = document.getElementById('new-admin-password').value.trim();
    const messageDiv = document.getElementById('create-admin-message');

    const { error } = await supabaseClient
        .from('admin_users')
        .insert([{ username, password }]);

    if (error) {
        messageDiv.className = 'message error';
        messageDiv.textContent = 'Gagal menambah admin (Username mungkin sudah ada): ' + error.message;
    } else {
        messageDiv.className = 'message success';
        messageDiv.textContent = `Akun admin '${username}' berhasil dibuat!`;
        document.getElementById('create-admin-form').reset();
        fetchAdmins();
    }
});

async function fetchAdmins() {
    const tbody = document.getElementById('admin-list-tbody');
    tbody.innerHTML = '<tr><td colspan="4">Memuat data admin...</td></tr>';

    const { data, error } = await supabaseClient
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        tbody.innerHTML = '<tr><td colspan="4">Gagal memuat data admin</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    data.forEach(admin => {
        const tr = document.createElement('tr');
        const created = new Date(admin.created_at).toLocaleDateString('id-ID');
        tr.innerHTML = `
            <td>${admin.id}</td>
            <td><b>${admin.username}</b></td>
            <td>${created}</td>
            <td>
                <button onclick="deleteAdmin('${admin.id}')" class="btn-delete">Hapus</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function deleteAdmin(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus akun admin ini?')) return;
    
    const { error } = await supabaseClient
        .from('admin_users')
        .delete()
        .eq('id', id);

    if (error) {
        alert('Gagal menghapus admin: ' + error.message);
    } else {
        fetchAdmins();
    }
}

// ==========================================
// PENAMBAHAN TAMU MANUAL OLEH ADMIN
// ==========================================
document.getElementById('manual-guest-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const nama = document.getElementById('manual-name').value;
    const jenis_id = document.getElementById('manual-id-type').value;
    const instansi = document.getElementById('manual-company').value;
    const keperluan = document.getElementById('manual-purpose').value;
    const timeIn = document.getElementById('manual-time-in').value;
    const timeOut = document.getElementById('manual-time-out').value;

    const payload = {
        nama,
        jenis_id,
        instansi,
        keperluan,
        jam_masuk: timeIn ? new Date(timeIn).toISOString() : new Date().toISOString(),
        jam_keluar: timeOut ? new Date(timeOut).toISOString() : null,
        status: 'Disetujui'
    };

    const { error } = await supabaseClient.from('guests').insert([payload]);

    if (error) {
        alert('Gagal menambah tamu: ' + error.message);
    } else {
        toggleModal('modal-add-guest', false);
        document.getElementById('manual-guest-form').reset();
        fetchGuests();
    }
});

// ==========================================
// DASHBOARD & AKSI APPROVAL TAMU
// ==========================================
async function fetchGuests() {
    const tbody = document.getElementById('guests-tbody');
    tbody.innerHTML = '<tr><td colspan="9">Memuat data...</td></tr>';

    const { data, error } = await supabaseClient
        .from('guests')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        tbody.innerHTML = '<tr><td colspan="9">Gagal memuat data tamu</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    
    data.forEach(guest => {
        const tr = document.createElement('tr');
        const regDate = new Date(guest.created_at).toLocaleString('id-ID');
        const timeIn = guest.jam_masuk ? new Date(guest.jam_masuk).toLocaleTimeString('id-ID') : '-';
        const timeOut = guest.jam_keluar ? new Date(guest.jam_keluar).toLocaleTimeString('id-ID') : '-';
        
        let statusClass = 'status-menunggu';
        if (guest.status === 'Disetujui') statusClass = 'status-disetujui';
        if (guest.status === 'Ditolak') statusClass = 'status-ditolak';
        if (guest.status === 'Selesai') statusClass = 'status-selesai';

        let actionBtns = '';
        if (guest.status === 'Menunggu') {
            actionBtns = `
                <button onclick="updateGuestStatus('${guest.id}', 'Disetujui')" class="btn-approve">Approve</button>
                <button onclick="updateGuestStatus('${guest.id}', 'Ditolak')" class="btn-reject">Tolak</button>
            `;
        } else if (guest.status === 'Disetujui') {
            actionBtns = `
                <button onclick="checkoutGuest('${guest.id}')" class="btn-checkout">Check-Out</button>
            `;
        } else {
            actionBtns = `<i>${guest.status}</i>`;
        }

        tr.innerHTML = `
            <td>${regDate}</td>
            <td><b>${guest.nama}</b></td>
            <td>${guest.jenis_id || 'KTP'}</td>
            <td>${guest.instansi}</td>
            <td>${guest.keperluan}</td>
            <td>${timeIn}</td>
            <td>${timeOut}</td>
            <td><span class="status-badge ${statusClass}">${guest.status}</span></td>
            <td>${actionBtns}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Ubah Status Approval Tamu
async function updateGuestStatus(id, newStatus) {
    const updateData = { status: newStatus };
    if (newStatus === 'Disetujui') {
        updateData.jam_masuk = new Date().toISOString();
    }

    const { error } = await supabaseClient
        .from('guests')
        .update(updateData)
        .eq('id', id);

    if (error) {
        alert('Gagal mengupdate status: ' + error.message);
    } else {
        fetchGuests();
    }
}

// Selesaikan Kunjungan / Jam Keluar (Check-out)
async function checkoutGuest(id) {
    const { error } = await supabaseClient
        .from('guests')
        .update({ 
            status: 'Selesai',
            jam_keluar: new Date().toISOString()
        })
        .eq('id', id);

    if (error) {
        alert('Gagal meloloskan check-out: ' + error.message);
    } else {
        fetchGuests();
    }
}

// Inisialisasi awal saat halaman dibuka
checkAuthStatus();