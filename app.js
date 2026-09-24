// ==========================================
// KONFIGURASI SUPABASE
// ==========================================
const SUPABASE_URL = 'https://gyortxfcoifxzrwfogzr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5b3J0eGZjb2lmeHpyd2ZvZ3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNzE2NzEsImV4cCI6MjEwNTc0NzY3MX0.dO07GyxM9WYRMHYOE70-nJQI_TONr7SXK7loXLRdkHU';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// NAVIGASI HALAMAN & SESI ADMIN
// ==========================================
function getLoggedInUser() {
    return JSON.parse(localStorage.getItem('admin_user'));
}

function showPage(pageId) {
    const user = getLoggedInUser();
    
    // Proteksi Halaman Admin
    if (pageId.startsWith('admin-') && !user) {
        alert('Silakan login terlebih dahulu!');
        showPage('login-page');
        return;
    }

    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.remove('active');
    });

    document.getElementById(pageId).classList.add('active');

    // Trigger pemuatan data sesuai halaman
    if (pageId === 'guest-page') loadApprovedCompaniesDropdown();
    if (pageId === 'admin-dashboard') fetchGuests();
    if (pageId === 'admin-pt-page') fetchApprovedPT();
    if (pageId === 'admin-users-page') fetchAdminUsers();
}

function checkAuthUI() {
    const user = getLoggedInUser();
    const loginBtn = document.getElementById('nav-login-btn');
    const adminNav = document.getElementById('admin-nav-group');
    const userSpan = document.getElementById('active-user-name');

    if (user) {
        loginBtn.style.display = 'none';
        adminNav.style.display = 'inline-block';
        userSpan.textContent = user.username;
    } else {
        loginBtn.style.display = 'inline-block';
        adminNav.style.display = 'none';
    }
}

// ==========================================
// LOGIKA FORM REGISTRASI TAMU
// ==========================================
function toggleCompanyInput() {
    const type = document.querySelector('input[name="company-input-type"]:checked').value;
    const groupSelect = document.getElementById('group-company-select');
    const groupManual = document.getElementById('group-company-manual');

    if (type === 'pilihan') {
        groupSelect.style.display = 'block';
        groupManual.style.display = 'none';
    } else {
        groupSelect.style.display = 'none';
        groupManual.style.display = 'block';
    }
}

async function loadApprovedCompaniesDropdown() {
    const select = document.getElementById('guest-company-select');
    select.innerHTML = '<option value="">-- Pilih Perusahaan Terdaftar --</option>';

    const { data, error } = await supabaseClient
        .from('approved_companies')
        .select('*')
        .order('nama_pt', { ascending: true });

    if (!error && data) {
        data.forEach(pt => {
            const opt = document.createElement('option');
            opt.value = pt.nama_pt;
            opt.textContent = pt.nama_pt;
            select.appendChild(opt);
        });
    }
}

document.getElementById('guest-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('guest-name').value;
    const idType = document.getElementById('guest-id-type').value;
    const idNumber = document.getElementById('guest-id-number').value;
    const companyType = document.querySelector('input[name="company-input-type"]:checked').value;
    
    let companyName = '';
    if (companyType === 'pilihan') {
        companyName = document.getElementById('guest-company-select').value;
        if (!companyName) {
            alert('Silakan pilih PT dari daftar terdaftar!');
            return;
        }
    } else {
        companyName = document.getElementById('guest-company-manual').value;
        if (!companyName.trim()) {
            alert('Silakan isi nama instansi/perusahaan Anda!');
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
            tipe_instansi: companyType,
            instansi: companyName,
            keperluan: purpose,
            status: 'Menunggu'
        }]);

    if (error) {
        messageDiv.className = 'message error';
        messageDiv.textContent = 'Gagal mendaftar: ' + error.message;
    } else {
        messageDiv.className = 'message success';
        messageDiv.textContent = 'Registrasi Berhasil! Silakan tunggu konfirmasi approval admin.';
        document.getElementById('guest-form').reset();
        toggleCompanyInput();
    }
});

// ==========================================
// LOGIKA LOGIN & LOGOUT ADMIN (TANPA EMAIL)
// ==========================================
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const usernameInput = document.getElementById('admin-username').value.trim();
    const passwordInput = document.getElementById('admin-password').value.trim();
    const messageDiv = document.getElementById('login-message');

    // Cek username & password pada tabel admin_users
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
        localStorage.setItem('admin_user', JSON.stringify({
            id: data.id,
            username: data.username,
            nama_lengkap: data.nama_lengkap
        }));
        
        document.getElementById('login-form').reset();
        checkAuthUI();
        showPage('admin-dashboard');
    }
});

function logoutAdmin() {
    localStorage.removeItem('admin_user');
    checkAuthUI();
    showPage('guest-page');
}

// ==========================================
// ADMIN: APPROVAL & DASHBOARD TAMU
// ==========================================
async function fetchGuests() {
    const tbody = document.getElementById('guests-tbody');
    tbody.innerHTML = '<tr><td colspan="6">Memuat data...</td></tr>';

    const { data, error } = await supabaseClient
        .from('guests')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        tbody.innerHTML = '<tr><td colspan="6">Gagal memuat data</td></tr>';
        return;
    }

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">Belum ada data tamu.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    data.forEach(guest => {
        const tr = document.createElement('tr');
        const date = new Date(guest.created_at).toLocaleString('id-ID');

        let statusBadge = '';
        if (guest.status === 'Disetujui') {
            statusBadge = '<span class="status-badge status-disetujui">Disetujui</span>';
        } else if (guest.status === 'Ditolak') {
            statusBadge = '<span class="status-badge status-ditolak">Ditolak</span>';
        } else {
            statusBadge = '<span class="status-badge status-menunggu">Menunggu</span>';
        }

        const actions = `
            <button onclick="updateGuestStatus('${guest.id}', 'Disetujui')" class="btn-success">Approve</button>
            <button onclick="updateGuestStatus('${guest.id}', 'Ditolak')" class="btn-danger">Reject</button>
            <button onclick="deleteGuest('${guest.id}')" style="background:#6b7280; color:white; border:none; padding:0.4rem 0.6rem; border-radius:4px; cursor:pointer;">Hapus</button>
        `;

        tr.innerHTML = `
            <td>${date}</td>
            <td><b>${guest.nama}</b><br><small>${guest.jenis_id}: ${guest.nomor_id}</small></td>
            <td>${guest.instansi} <br><small>(${guest.tipe_instansi})</small></td>
            <td>${guest.keperluan}</td>
            <td>${statusBadge}</td>
            <td>${actions}</td>
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
        alert('Gagal mengupdate status: ' + error.message);
    } else {
        fetchGuests();
    }
}

async function deleteGuest(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus data tamu ini?')) return;
    const { error } = await supabaseClient.from('guests').delete().eq('id', id);
    if (!error) fetchGuests();
}

// ==========================================
// ADMIN: KELOLA NAMA PT DISETUJUI
// ==========================================
async function fetchApprovedPT() {
    const tbody = document.getElementById('pt-tbody');
    tbody.innerHTML = '<tr><td colspan="4">Memuat data...</td></tr>';

    const { data, error } = await supabaseClient
        .from('approved_companies')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        tbody.innerHTML = '<tr><td colspan="4">Gagal memuat data PT</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    data.forEach((pt, index) => {
        const tr = document.createElement('tr');
        const date = new Date(pt.created_at).toLocaleDateString('id-ID');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td><b>${pt.nama_pt}</b></td>
            <td>${date}</td>
            <td><button onclick="deletePT('${pt.id}')" class="btn-danger">Hapus</button></td>
        `;
        tbody.appendChild(tr);
    });
}

document.getElementById('add-pt-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const ptName = document.getElementById('pt-name-input').value.trim();
    const messageDiv = document.getElementById('pt-message');

    const { error } = await supabaseClient
        .from('approved_companies')
        .insert([{ nama_pt: ptName }]);

    if (error) {
        messageDiv.className = 'message error';
        messageDiv.textContent = 'Gagal menambah PT: ' + error.message;
    } else {
        messageDiv.className = 'message success';
        messageDiv.textContent = 'PT Berhasil ditambahkan ke Whitelist!';
        document.getElementById('pt-name-input').value = '';
        fetchApprovedPT();
    }
});

async function deletePT(id) {
    if (!confirm('Hapus PT dari daftar yang disetujui?')) return;
    const { error } = await supabaseClient.from('approved_companies').delete().eq('id', id);
    if (!error) fetchApprovedPT();
}

// ==========================================
// ADMIN: KELOLA AKUN ADMIN BARU
// ==========================================
async function fetchAdminUsers() {
    const tbody = document.getElementById('users-tbody');
    tbody.innerHTML = '<tr><td colspan="4">Memuat data...</td></tr>';

    const { data, error } = await supabaseClient
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        tbody.innerHTML = '<tr><td colspan="4">Gagal memuat data user</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    data.forEach(u => {
        const tr = document.createElement('tr');
        const date = new Date(u.created_at).toLocaleDateString('id-ID');
        const deleteBtn = u.username === 'admin' 
            ? '<i>Default Admin</i>' 
            : `<button onclick="deleteAdminUser('${u.id}')" class="btn-danger">Hapus</button>`;

        tr.innerHTML = `
            <td><b>${u.username}</b></td>
            <td>${u.nama_lengkap}</td>
            <td>${date}</td>
            <td>${deleteBtn}</td>
        `;
        tbody.appendChild(tr);
    });
}

document.getElementById('add-user-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fullname = document.getElementById('new-user-fullname').value.trim();
    const username = document.getElementById('new-user-username').value.trim();
    const password = document.getElementById('new-user-password').value.trim();
    const messageDiv = document.getElementById('user-message');

    const { error } = await supabaseClient
        .from('admin_users')
        .insert([{ nama_lengkap: fullname, username: username, password: password }]);

    if (error) {
        messageDiv.className = 'message error';
        messageDiv.textContent = 'Gagal menambah admin: ' + error.message;
    } else {
        messageDiv.className = 'message success';
        messageDiv.textContent = 'Akun admin baru berhasil didaftarkan!';
        document.getElementById('add-user-form').reset();
        fetchAdminUsers();
    }
});

async function deleteAdminUser(id) {
    if (!confirm('Hapus akun admin ini?')) return;
    const { error } = await supabaseClient.from('admin_users').delete().eq('id', id);
    if (!error) fetchAdminUsers();
}

// ==========================================
// ADMIN: FITUR HAPUS / RESET KONFIGURASI WEB
// ==========================================
async function deleteAllGuests() {
    if (!confirm('PERINGATAN: Seluruh data tamu akan dihapus permanen! Lanjutkan?')) return;

    const { error } = await supabaseClient.from('guests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) {
        alert('Gagal menghapus data: ' + error.message);
    } else {
        alert('Seluruh data tamu berhasil dibersihkan!');
    }
}

async function resetPTData() {
    if (!confirm('PERINGATAN: Seluruh PT kustom akan dihapus dan di-reset ke default! Lanjutkan?')) return;

    await supabaseClient.from('approved_companies').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    // Re-insert default
    await supabaseClient.from('approved_companies').insert([
        { nama_pt: 'PT Bangun Bangsa' },
        { nama_pt: 'PT Maju Bersama' },
        { nama_pt: 'PT Teknologi Nusantara' }
    ]);

    alert('Master Data PT berhasil di-reset!');
}

async function resetSystemTotal() {
    if (!confirm('PERINGATAN KERAS: Ini akan menghapus SELURUH data tamu, mereset PT, dan menghapus admin tambahan! Lanjutkan?')) return;

    // 1. Hapus tamu
    await supabaseClient.from('guests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    // 2. Reset PT
    await supabaseClient.from('approved_companies').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseClient.from('approved_companies').insert([
        { nama_pt: 'PT Bangun Bangsa' },
        { nama_pt: 'PT Maju Bersama' },
        { nama_pt: 'PT Teknologi Nusantara' }
    ]);

    // 3. Hapus admin selain 'admin'
    await supabaseClient.from('admin_users').delete().neq('username', 'admin');

    alert('Sistem Web berhasil di-reset total ke konfigurasi awal!');
}

// Inisialisasi awal
checkAuthUI();
loadApprovedCompaniesDropdown();