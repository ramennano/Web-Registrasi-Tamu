// ==========================================
// KONFIGURASI SUPABASE (GANTI DENGAN KREDENSIAL ANDA)
// ==========================================
const SUPABASE_URL = 'https://gyortxfcoifxzrwfogzr.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5b3J0eGZjb2lmeHpyd2ZvZ3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNzE2NzEsImV4cCI6MjEwNTc0NzY3MX0.dO07GyxM9WYRMHYOE70-nJQI_TONr7SXK7loXLRdkHU'; 

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Status Login Session Sederhana (Disimpan di localStorage)
let currentUser = JSON.parse(localStorage.getItem('admin_session')) || null;

// ==========================================
// NAVIGASI HALAMAN & TAB
// ==========================================
function showPage(pageId) {
    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');

    if (pageId === 'guest-page') {
        loadApprovedCompanies();
    } else if (pageId === 'admin-dashboard') {
        if (!currentUser) {
            showPage('login-page');
            return;
        }
        fetchGuests();
        fetchCompanies();
    }
}

function switchAdminTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));

    event.target.classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

function checkAuthStatus() {
    if (currentUser) {
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
// KELOLA FORM REGISTRASI TAMU
// ==========================================
function toggleCompanyInput() {
    const isManual = document.querySelector('input[name="company-option"]:checked').value === 'manual';
    document.getElementById('company-select-box').style.display = isManual ? 'none' : 'block';
    document.getElementById('company-manual-box').style.display = isManual ? 'block' : 'none';
}

async function loadApprovedCompanies() {
    const select = document.getElementById('guest-company-select');
    select.innerHTML = '<option value="">-- Pilih PT / Instansi --</option>';

    const { data, error } = await supabaseClient
        .from('approved_companies')
        .select('*')
        .order('nama_pt', { ascending: true });

    if (error) {
        console.error('Gagal memuat PT:', error);
        return;
    }

    data.forEach(pt => {
        const option = document.createElement('option');
        option.value = pt.nama_pt;
        option.textContent = pt.nama_pt;
        select.appendChild(option);
    });
}

document.getElementById('guest-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('guest-name').value;
    const idType = document.getElementById('guest-id-type').value;
    const idNumber = document.getElementById('guest-id-number').value;
    const isManual = document.querySelector('input[name="company-option"]:checked').value === 'manual';
    
    let company = '';
    if (isManual) {
        company = document.getElementById('guest-company-manual').value.trim();
    } else {
        company = document.getElementById('guest-company-select').value;
    }

    const purpose = document.getElementById('guest-purpose').value;
    const messageDiv = document.getElementById('guest-message');

    if (!company) {
        alert('Silakan pilih atau masukkan nama PT/Instansi terlebih dahulu.');
        return;
    }

    const { error } = await supabaseClient
        .from('guests')
        .insert([{
            nama: name,
            jenis_id: idType,
            nomor_id: idNumber,
            instansi: company,
            is_manual: isManual,
            keperluan: purpose,
            status: 'Menunggu Akses'
        }]);

    if (error) {
        messageDiv.className = 'message error';
        messageDiv.textContent = 'Gagal mendaftar: ' + error.message;
    } else {
        messageDiv.className = 'message success';
        messageDiv.textContent = 'Registrasi berhasil dikirim! Silakan tunggu konfirmasi dari Admin.';
        document.getElementById('guest-form').reset();
        toggleCompanyInput();
    }
});

// ==========================================
// LOGIN & LOGOUT ADMIN (USER & PASSWORD)
// ==========================================
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const usernameInput = document.getElementById('admin-username').value.trim();
    const passwordInput = document.getElementById('admin-password').value.trim();
    const messageDiv = document.getElementById('login-message');

    // Cek akun di tabel user_accounts
    const { data, error } = await supabaseClient
        .from('user_accounts')
        .select('*')
        .eq('username', usernameInput)
        .eq('password', passwordInput)
        .single();

    if (error || !data) {
        messageDiv.style.display = 'block';
        messageDiv.textContent = 'Username atau password salah!';
    } else {
        messageDiv.style.display = 'none';
        currentUser = { username: data.username, role: data.role };
        localStorage.setItem('admin_session', JSON.stringify(currentUser));
        document.getElementById('login-form').reset();
        checkAuthStatus();
    }
});

function logoutAdmin() {
    currentUser = null;
    localStorage.removeItem('admin_session');
    checkAuthStatus();
}

// ==========================================
// DASHBOARD - FITUR APPROVE / REJECT TAMU
// ==========================================
async function fetchGuests() {
    const tbody = document.getElementById('guests-tbody');
    tbody.innerHTML = '<tr><td colspan="7">Memuat data...</td></tr>';

    const { data, error } = await supabaseClient
        .from('guests')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        tbody.innerHTML = '<tr><td colspan="7">Gagal memuat data tamu</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    
    data.forEach(guest => {
        const tr = document.createElement('tr');
        const date = new Date(guest.created_at).toLocaleString('id-ID');
        
        let statusBadge = '';
        if (guest.status === 'Diberikan Akses') {
            statusBadge = '<span class="status-badge status-diberikan">Diberikan Akses</span>';
        } else if (guest.status === 'Ditolak') {
            statusBadge = '<span class="status-badge status-ditolak">Ditolak</span>';
        } else {
            statusBadge = '<span class="status-badge status-menunggu">Menunggu</span>';
        }

        let actionBtns = `
            <div class="action-buttons">
                <button onclick="updateGuestStatus('${guest.id}', 'Diberikan Akses')" class="btn-success">Approve</button>
                <button onclick="updateGuestStatus('${guest.id}', 'Ditolak')" class="btn-danger">Reject</button>
            </div>
        `;

        const instansiDisplay = guest.is_manual 
            ? `${guest.instansi} <small style="color:orange;">(Manual)</small>` 
            : `${guest.instansi} <small style="color:green;">(Verifikasi)</small>`;

        tr.innerHTML = `
            <td>${date}</td>
            <td><b>${guest.nama}</b></td>
            <td>${guest.jenis_id}: ${guest.nomor_id}</td>
            <td>${instansiDisplay}</td>
            <td>${guest.keperluan}</td>
            <td>${statusBadge}</td>
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
        fetchGuests();
    }
}

// ==========================================
// DASHBOARD - KELOLA PT DISETUJUI
// ==========================================
async function fetchCompanies() {
    const tbody = document.getElementById('companies-tbody');
    tbody.innerHTML = '<tr><td colspan="4">Memuat data...</td></tr>';

    const { data, error } = await supabaseClient
        .from('approved_companies')
        .select('*')
        .order('id', { ascending: true });

    if (error) {
        tbody.innerHTML = '<tr><td colspan="4">Gagal memuat data PT</td></tr>';
        return;
    }

    tbody.innerHTML = '';

    data.forEach(pt => {
        const tr = document.createElement('tr');
        const date = new Date(pt.created_at).toLocaleDateString('id-ID');

        tr.innerHTML = `
            <td>${pt.id}</td>
            <td><b>${pt.nama_pt}</b></td>
            <td>${date}</td>
            <td>
                <button onclick="deleteCompany(${pt.id})" class="btn-danger">Hapus</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

document.getElementById('add-company-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newPtName = document.getElementById('new-company-name').value.trim();

    const { error } = await supabaseClient
        .from('approved_companies')
        .insert([{ nama_pt: newPtName }]);

    if (error) {
        alert('Gagal menambah PT: ' + error.message);
    } else {
        document.getElementById('new-company-name').value = '';
        fetchCompanies();
        loadApprovedCompanies();
    }
});

async function deleteCompany(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus PT ini dari daftar yang disetujui?')) return;

    const { error } = await supabaseClient
        .from('approved_companies')
        .delete()
        .eq('id', id);

    if (error) {
        alert('Gagal menghapus PT: ' + error.message);
    } else {
        fetchCompanies();
        loadApprovedCompanies();
    }
}

// ==========================================
// DASHBOARD - TAMBAH AKUN LOGIN BARU
// ==========================================
document.getElementById('create-user-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('new-username').value.trim();
    const password = document.getElementById('new-password').value.trim();
    const messageDiv = document.getElementById('create-user-message');

    const { error } = await supabaseClient
        .from('user_accounts')
        .insert([{ username, password, role: 'admin' }]);

    if (error) {
        messageDiv.className = 'message error';
        messageDiv.textContent = 'Gagal membuat akun (mungkin username sudah dipakai): ' + error.message;
    } else {
        messageDiv.className = 'message success';
        messageDiv.textContent = `Akun login "${username}" berhasil dibuat!`;
        document.getElementById('create-user-form').reset();
    }
});

// Inisialisasi awal saat halaman dimuat
checkAuthStatus();