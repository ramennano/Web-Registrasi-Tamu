// ==========================================
// KONFIGURASI SUPABASE (ISIKAN URL & ANON KEY ANDA)
// ==========================================
const SUPABASE_URL = 'https://gyortxfcoifxzrwfogzr.supabase.co'; // Masukkan Supabase URL Anda
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5b3J0eGZjb2lmeHpyd2ZvZ3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNzE2NzEsImV4cCI6MjEwNTc0NzY3MX0.dO07GyxM9WYRMHYOE70-nJQI_TONr7SXK7loXLRdkHU'; // Masukkan Supabase Anon Key Anda

// Inisialisasi Klien Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
let guestRealtimeChannel = null;

// ==========================================
// FUNGSI NAVIGASI HALAMAN
// ==========================================
function showPage(pageId) {
    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');

    // Action per halaman
    if (pageId === 'guest-page') {
        loadApprovedCompaniesSelect();
    } else if (pageId === 'admin-dashboard') {
        fetchGuestsAdmin();
    } else if (pageId === 'company-manage-page') {
        fetchApprovedCompaniesAdmin();
    } else if (pageId === 'user-manage-page') {
        fetchUsersAdmin();
    }
}

// Cek Sesi Login Lokal (LocalStorage)
function checkAuthStatus() {
    const savedUser = localStorage.getItem('app_user_session');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        document.getElementById('nav-login-btn').style.display = 'none';
        document.getElementById('admin-nav-group').style.display = 'inline';
    } else {
        currentUser = null;
        document.getElementById('nav-login-btn').style.display = 'inline-block';
        document.getElementById('admin-nav-group').style.display = 'none';
    }
}

// ==========================================
// LOGIKA AKUN & LOGIN (TANPA REGISTRASI EMAIL)
// ==========================================
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const usernameInput = document.getElementById('admin-username').value.trim();
    const passwordInput = document.getElementById('admin-password').value.trim();
    const messageDiv = document.getElementById('login-message');

    // Query ke tabel app_users
    const { data, error } = await supabaseClient
        .from('app_users')
        .select('*')
        .eq('username', usernameInput)
        .eq('password', passwordInput)
        .single();

    if (error || !data) {
        messageDiv.className = 'message error';
        messageDiv.textContent = 'Username atau Password salah!';
        messageDiv.style.display = 'block';
    } else {
        messageDiv.style.display = 'none';
        localStorage.setItem('app_user_session', JSON.stringify(data));
        checkAuthStatus();
        document.getElementById('login-form').reset();
        showPage('admin-dashboard');
    }
});

function logoutAdmin() {
    localStorage.removeItem('app_user_session');
    checkAuthStatus();
    showPage('guest-page');
}

// ==========================================
// LOGIKA DAFTAR PT TERDAFTAR / MANUAL
// ==========================================
function toggleCompanyInput() {
    const selectedOption = document.querySelector('input[name="company_option"]:checked').value;
    const selectContainer = document.getElementById('company-select-container');
    const manualContainer = document.getElementById('company-manual-container');

    if (selectedOption === 'terdaftar') {
        selectContainer.style.display = 'block';
        manualContainer.style.display = 'none';
    } else {
        selectContainer.style.display = 'none';
        manualContainer.style.display = 'block';
    }
}

async function loadApprovedCompaniesSelect() {
    const selectEl = document.getElementById('guest-company-select');
    selectEl.innerHTML = '<option value="">-- Memuat PT... --</option>';

    const { data, error } = await supabaseClient
        .from('approved_companies')
        .select('*')
        .order('nama_pt', { ascending: true });

    if (error) {
        selectEl.innerHTML = '<option value="">Gagal memuat PT</option>';
        return;
    }

    selectEl.innerHTML = '<option value="">-- Pilih Perusahaan --</option>';
    data.forEach(item => {
        const option = document.createElement('option');
        option.value = item.nama_pt;
        option.textContent = item.nama_pt;
        selectEl.appendChild(option);
    });
}

// ==========================================
// LOGIKA BUKU TAMU (REGISTRASI TAMU)
// ==========================================
document.getElementById('guest-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('guest-name').value;
    const idType = document.getElementById('guest-id-type').value;
    const idNumber = document.getElementById('guest-id-number').value;
    const companyOption = document.querySelector('input[name="company_option"]:checked').value;
    
    let companyName = '';
    if (companyOption === 'terdaftar') {
        companyName = document.getElementById('guest-company-select').value;
        if (!companyName) {
            alert('Silakan pilih PT dari daftar terdaftar!');
            return;
        }
    } else {
        companyName = document.getElementById('guest-company-manual').value;
        if (!companyName) {
            alert('Silakan isi nama instansi manual!');
            return;
        }
    }

    const purpose = document.getElementById('guest-purpose').value;
    const messageDiv = document.getElementById('guest-message');

    const { error } = await supabaseClient
        .from('guests')
        .insert([{
            nama: name,
            jenis_id: idType,
            nomor_id: idNumber,
            tipe_instansi: companyOption,
            instansi: companyName,
            keperluan: purpose,
            status: 'Menunggu Akses'
        }]);

    if (error) {
        messageDiv.className = 'message error';
        messageDiv.textContent = 'Gagal mendaftar: ' + error.message;
    } else {
        messageDiv.className = 'message success';
        messageDiv.textContent = 'Registrasi berhasil! Silakan cek menu "Status Tamu" dengan Nomor ID: ' + idNumber;
        document.getElementById('guest-form').reset();
    }
});

// ==========================================
// LOGIKA STATUS TAMU & NOTIFIKASI APPROVE REALTIME
// ==========================================
async function checkGuestStatus() {
    const idNumber = document.getElementById('search-guest-id').value.trim();
    const resultDiv = document.getElementById('guest-status-result');

    if (!idNumber) {
        alert('Masukkan Nomor ID terlebih dahulu!');
        return;
    }

    resultDiv.innerHTML = '<p>Mencari data...</p>';

    const { data, error } = await supabaseClient
        .from('guests')
        .select('*')
        .eq('nomor_id', idNumber)
        .order('created_at', { ascending: false })
        .limit(1);

    if (error || !data || data.length === 0) {
        resultDiv.innerHTML = '<div class="message error" style="display:block;">Data tamu dengan Nomor ID tersebut tidak ditemukan.</div>';
        return;
    }

    const guest = data[0];
    renderGuestStatusUI(guest);

    // Buka Channel Realtime Subscription untuk Notifikasi Langsung pada Dashboard Tamu
    if (guestRealtimeChannel) {
        supabaseClient.removeChannel(guestRealtimeChannel);
    }

    guestRealtimeChannel = supabaseClient
        .channel('guest-status-changes')
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'guests',
                filter: `id=eq.${guest.id}`
            },
            (payload) => {
                const updatedGuest = payload.new;
                renderGuestStatusUI(updatedGuest);

                if (updatedGuest.status === 'Diberikan Akses') {
                    alert('🔔 NOTIFIKASI: Akses Anda telah DISETUJUI oleh Admin!');
                }
            }
        )
        .subscribe();
}

function renderGuestStatusUI(guest) {
    const resultDiv = document.getElementById('guest-status-result');
    let statusClass = 'status-menunggu';
    if (guest.status === 'Diberikan Akses') statusClass = 'status-diberikan';
    if (guest.status === 'Ditolak') statusClass = 'status-ditolak';

    let alertNotif = '';
    if (guest.status === 'Diberikan Akses') {
        alertNotif = `
            <div class="approve-notification">
                🎉 <strong>AKSES DISETUJUI!</strong><br>
                Selamat datang <strong>${guest.nama}</strong>. Silakan tunjukkan halaman ini ke petugas di resepsionis/security.
            </div>
        `;
    }

    resultDiv.innerHTML = `
        ${alertNotif}
        <div class="card">
            <h3>Detail Status Pendaftaran Tamu</h3>
            <p><strong>Nama:</strong> ${guest.nama}</p>
            <p><strong>Identitas:</strong> ${guest.jenis_id} - ${guest.nomor_id}</p>
            <p><strong>Instansi:</strong> ${guest.instansi} (${guest.tipe_instansi})</p>
            <p><strong>Keperluan:</strong> ${guest.keperluan}</p>
            <p><strong>Status Akses:</strong> <span class="status-badge ${statusClass}">${guest.status}</span></p>
        </div>
    `;
}

// ==========================================
// DASHBOARD UTAMA ADMIN
// ==========================================
async function fetchGuestsAdmin() {
    const tbody = document.getElementById('guests-tbody');
    tbody.innerHTML = '<tr><td colspan="7">Memuat data...</td></tr>';

    const { data, error } = await supabaseClient
        .from('guests')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        tbody.innerHTML = '<tr><td colspan="7">Gagal memuat data</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    data.forEach(guest => {
        const tr = document.createElement('tr');
        const date = new Date(guest.created_at).toLocaleString('id-ID');

        let statusClass = 'status-menunggu';
        if (guest.status === 'Diberikan Akses') statusClass = 'status-diberikan';
        if (guest.status === 'Ditolak') statusClass = 'status-ditolak';

        let actionBtns = `
            <button onclick="updateGuestStatus('${guest.id}', 'Diberikan Akses')" class="btn-success">Approve</button>
            <button onclick="updateGuestStatus('${guest.id}', 'Ditolak')" class="btn-danger">Tolak</button>
        `;

        if (guest.status === 'Diberikan Akses') {
            actionBtns = '<span style="color:#10b981; font-weight:600;">✓ Akses Disetujui</span>';
        } else if (guest.status === 'Ditolak') {
            actionBtns = '<span style="color:#ef4444; font-weight:600;">✕ Akses Ditolak</span>';
        }

        tr.innerHTML = `
            <td>${date}</td>
            <td>${guest.nama}</td>
            <td>${guest.jenis_id}<br><small>${guest.nomor_id}</small></td>
            <td>${guest.instansi}</td>
            <td>${guest.keperluan}</td>
            <td><span class="status-badge ${statusClass}">${guest.status}</span></td>
            <td>${actionBtns}</td>
        `;
        tbody.appendChild(tr);
    });
}

async function updateGuestStatus(id, newStatus) {
    const { error } = await supabaseClient
        .from('guests')
        .update({ status: newStatus })
        .eq('id', id);

    if (error) {
        alert('Gagal memperbarui status: ' + error.message);
    } else {
        fetchGuestsAdmin();
    }
}

// ==========================================
// KELOLA PT DISATUJUI ADMIN
// ==========================================
async function fetchApprovedCompaniesAdmin() {
    const tbody = document.getElementById('company-tbody');
    tbody.innerHTML = '<tr><td colspan="3">Memuat PT...</td></tr>';

    const { data, error } = await supabaseClient
        .from('approved_companies')
        .select('*')
        .order('nama_pt', { ascending: true });

    if (error) {
        tbody.innerHTML = '<tr><td colspan="3">Gagal memuat PT</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    data.forEach((pt, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${pt.nama_pt}</td>
            <td><button onclick="deleteCompany('${pt.id}')" class="btn-danger">Hapus</button></td>
        `;
        tbody.appendChild(tr);
    });
}

document.getElementById('add-company-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const companyInput = document.getElementById('new-company-name').value.trim();
    const msgDiv = document.getElementById('company-message');

    const { error } = await supabaseClient
        .from('approved_companies')
        .insert([{ nama_pt: companyInput }]);

    if (error) {
        msgDiv.className = 'message error';
        msgDiv.textContent = 'Gagal menambah PT: ' + error.message;
    } else {
        msgDiv.className = 'message success';
        msgDiv.textContent = 'PT Berhasil ditambahkan!';
        document.getElementById('add-company-form').reset();
        fetchApprovedCompaniesAdmin();
    }
});

async function deleteCompany(id) {
    if (!confirm('Yakin ingin menghapus PT ini dari daftar terdaftar?')) return;

    const { error } = await supabaseClient
        .from('approved_companies')
        .delete()
        .eq('id', id);

    if (error) {
        alert('Gagal menghapus PT: ' + error.message);
    } else {
        fetchApprovedCompaniesAdmin();
    }
}

// ==========================================
// KELOLA AKUN LOGIN & RESET PASSWORD
// ==========================================
async function fetchUsersAdmin() {
    const tbody = document.getElementById('users-tbody');
    tbody.innerHTML = '<tr><td colspan="4">Memuat akun...</td></tr>';

    const { data, error } = await supabaseClient
        .from('app_users')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        tbody.innerHTML = '<tr><td colspan="4">Gagal memuat data akun</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    data.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${user.username}</strong></td>
            <td>${user.nama_lengkap}</td>
            <td>${user.role}</td>
            <td><button onclick="openResetModal('${user.id}', '${user.username}')" class="btn-secondary">Reset Password</button></td>
        `;
        tbody.appendChild(tr);
    });
}

// Tambah Akun Baru
document.getElementById('add-user-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fullname = document.getElementById('new-user-fullname').value;
    const username = document.getElementById('new-user-username').value.trim();
    const password = document.getElementById('new-user-password').value.trim();
    const role = document.getElementById('new-user-role').value;
    const msgDiv = document.getElementById('add-user-message');

    const { error } = await supabaseClient
        .from('app_users')
        .insert([{
            nama_lengkap: fullname,
            username: username,
            password: password,
            role: role
        }]);

    if (error) {
        msgDiv.className = 'message error';
        msgDiv.textContent = 'Gagal membuat akun: ' + error.message;
    } else {
        msgDiv.className = 'message success';
        msgDiv.textContent = 'Akun login baru berhasil ditambahkan!';
        document.getElementById('add-user-form').reset();
        fetchUsersAdmin();
    }
});

// Modal Reset Password
function openResetModal(userId, username) {
    document.getElementById('reset-user-id').value = userId;
    document.getElementById('reset-username-label').textContent = username;
    document.getElementById('reset-new-password').value = '';
    document.getElementById('reset-password-modal').style.display = 'flex';
}

function closeResetModal() {
    document.getElementById('reset-password-modal').style.display = 'none';
}

async function submitResetPassword() {
    const userId = document.getElementById('reset-user-id').value;
    const newPassword = document.getElementById('reset-new-password').value.trim();

    if (!newPassword) {
        alert('Masukkan password baru terlebih dahulu!');
        return;
    }

    const { error } = await supabaseClient
        .from('app_users')
        .update({ password: newPassword })
        .eq('id', userId);

    if (error) {
        alert('Gagal mereset password: ' + error.message);
    } else {
        alert('Password berhasil diperbarui!');
        closeResetModal();
        fetchUsersAdmin();
    }
}

// Inisialisasi saat load
checkAuthStatus();
loadApprovedCompaniesSelect();