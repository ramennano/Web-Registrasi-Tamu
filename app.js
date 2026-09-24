// ==========================================
// KONFIGURASI SUPABASE (KOSONG / DIBERSIHKAN)
// Isikan dengan kredensial Supabase Anda sendiri
// ==========================================
const SUPABASE_URL = 'https://gyortxfcoifxzrwfogzr.supabase.co'; // Masukkan URL Supabase Anda
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5b3J0eGZjb2lmeHpyd2ZvZ3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNzE2NzEsImV4cCI6MjEwNTc0NzY3MX0.dO07GyxM9WYRMHYOE70-nJQI_TONr7SXK7loXLRdkHU'; // Masukkan Anon Key Supabase Anda

let supabaseClient = null;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    console.warn('Supabase URL dan Anon Key belum dikonfigurasi!');
}

// ==========================================
// NAVIGASI HALAMAN & TAB
// ==========================================
function showPage(pageId) {
    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');

    if (pageId === 'admin-dashboard') {
        fetchGuests();
        fetchApprovedPTs();
    } else if (pageId === 'guest-page') {
        loadCompanyOptions();
    }
}

function switchAdminTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));

    event.target.classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

// Cek status autentikasi admin
async function checkAuthStatus() {
    if (!supabaseClient) return;
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
// KELOLA DAFTAR PT / INSTANSI (FORM TAMU)
// ==========================================
async function loadCompanyOptions() {
    const select = document.getElementById('guest-company-select');
    select.innerHTML = '<option value="">-- Pilih Instansi/Perusahaan --</option>';

    if (!supabaseClient) return;

    const { data, error } = await supabaseClient
        .from('approved_companies')
        .select('*')
        .order('nama_pt', { ascending: true });

    if (!error && data) {
        data.forEach(item => {
            const opt = document.createElement('option');
            opt.value = item.nama_pt;
            opt.textContent = item.nama_pt;
            select.appendChild(opt);
        });
    }

    // Tambah opsi manual
    const manualOpt = document.createElement('option');
    manualOpt.value = 'Lainnya';
    manualOpt.textContent = '-- Lainnya / Input Manual --';
    select.appendChild(manualOpt);
}

function toggleManualCompany(value) {
    const manualGroup = document.getElementById('manual-company-group');
    const manualInput = document.getElementById('guest-company-manual');
    if (value === 'Lainnya') {
        manualGroup.style.display = 'block';
        manualInput.required = true;
    } else {
        manualGroup.style.display = 'none';
        manualInput.required = false;
    }
}

// ==========================================
// REGISTRASI TAMU (TANPA LOGIN / EMAIL)
// ==========================================
document.getElementById('guest-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!supabaseClient) return alert('Supabase belum dikonfigurasi!');

    const name = document.getElementById('guest-name').value;
    const idType = document.getElementById('guest-id-type').value;
    const idNum = document.getElementById('guest-id-number').value;
    const companySelect = document.getElementById('guest-company-select').value;
    const companyManual = document.getElementById('guest-company-manual').value;
    const purpose = document.getElementById('guest-purpose').value;
    const messageDiv = document.getElementById('guest-message');

    const finalCompany = companySelect === 'Lainnya' ? companyManual : companySelect;

    const { error } = await supabaseClient
        .from('guests')
        .insert([{
            nama: name,
            jenis_id: idType,
            no_id: idNum,
            instansi: finalCompany,
            instansi_manual: companySelect === 'Lainnya' ? companyManual : null,
            keperluan: purpose,
            status: 'Menunggu'
        }]);

    if (error) {
        messageDiv.className = 'message error';
        messageDiv.textContent = 'Gagal mendaftar: ' + error.message;
    } else {
        messageDiv.className = 'message success';
        messageDiv.textContent = 'Permohonan berhasil dikirim! Silakan tunggu konfirmasi persetujuan dari Admin.';
        document.getElementById('guest-form').reset();
        toggleManualCompany('');
    }
});

// ==========================================
// LOGIN TAMU (PENGGUNAAN AKUN LOGIN)
// ==========================================
document.getElementById('guest-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!supabaseClient) return alert('Supabase belum dikonfigurasi!');

    const username = document.getElementById('guest-login-username').value;
    const password = document.getElementById('guest-login-password').value;
    const messageDiv = document.getElementById('guest-login-message');

    const { data, error } = await supabaseClient
        .from('guests')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

    if (error || !data) {
        messageDiv.className = 'message error';
        messageDiv.textContent = 'Username atau Password tamu salah!';
    } else {
        messageDiv.className = 'message success';
        messageDiv.textContent = `Selamat datang ${data.nama}! Status Akses Anda: ${data.status}.`;
    }
});

// ==========================================
// LOGIKA ADMIN LOGIN & LOGOUT
// ==========================================
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!supabaseClient) return alert('Supabase belum dikonfigurasi!');

    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    const messageDiv = document.getElementById('login-message');

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
        messageDiv.className = 'message error';
        messageDiv.textContent = 'Email atau password Admin salah!';
    } else {
        messageDiv.style.display = 'none';
        document.getElementById('login-form').reset();
        checkAuthStatus();
    }
});

async function logoutAdmin() {
    if (supabaseClient) await supabaseClient.auth.signOut();
    checkAuthStatus();
}

// ==========================================
// ADMIN DASHBOARD: PERSETUJUAN TAMU
// ==========================================
async function fetchGuests() {
    if (!supabaseClient) return;
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

    tbody.innerHTML = '';
    
    data.forEach(guest => {
        const tr = document.createElement('tr');
        const date = new Date(guest.created_at).toLocaleString('id-ID');
        
        let statusBadge = '<span class="status-badge status-menunggu">Menunggu</span>';
        if (guest.status === 'Diberikan Akses') {
            statusBadge = '<span class="status-badge status-diberikan">Diberikan Akses</span>';
        } else if (guest.status === 'Ditolak') {
            statusBadge = '<span class="status-badge status-ditolak">Ditolak</span>';
        }

        const actionBtns = `
            <button onclick="updateGuestStatus('${guest.id}', 'Diberikan Akses')" class="btn-success">Approve</button>
            <button onclick="updateGuestStatus('${guest.id}', 'Ditolak')" class="btn-danger">Tolak</button>
            <button onclick="deleteGuest('${guest.id}')" class="btn-danger" style="background:#6b7280;">Hapus</button>
        `;

        tr.innerHTML = `
            <td>${date}</td>
            <td><strong>${guest.nama}</strong><br><small>${guest.jenis_id}: ${guest.no_id || '-'}</small></td>
            <td>${guest.instansi}</td>
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
        alert('Gagal mengupdate status: ' + error.message);
    } else {
        fetchGuests();
    }
}

async function deleteGuest(id) {
    if (!confirm('Yakin ingin menghapus data tamu ini?')) return;
    const { error } = await supabaseClient.from('guests').delete().eq('id', id);
    if (!error) fetchGuests();
}

// ==========================================
// ADMIN DASHBOARD: BUAT AKUN LOGIN TAMU
// ==========================================
document.getElementById('create-guest-account-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!supabaseClient) return;

    const name = document.getElementById('acc-guest-name').value;
    const idType = document.getElementById('acc-guest-id-type').value;
    const idNum = document.getElementById('acc-guest-id-number').value;
    const company = document.getElementById('acc-guest-company').value;
    const username = document.getElementById('acc-guest-username').value;
    const password = document.getElementById('acc-guest-password').value;
    const msg = document.getElementById('acc-message');

    const { error } = await supabaseClient
        .from('guests')
        .insert([{
            nama: name,
            jenis_id: idType,
            no_id: idNum,
            instansi: company,
            keperluan: 'Akun Login Tamu Terdaftar',
            status: 'Diberikan Akses',
            username: username,
            password: password
        }]);

    if (error) {
        msg.className = 'message error';
        msg.textContent = 'Gagal membuat akun tamu: ' + error.message;
    } else {
        msg.className = 'message success';
        msg.textContent = 'Akun login tamu berhasil dibuat & disetujui!';
        document.getElementById('create-guest-account-form').reset();
        fetchGuests();
    }
});

// ==========================================
// ADMIN DASHBOARD: KELOLA MASTER PT
// ==========================================
async function fetchApprovedPTs() {
    if (!supabaseClient) return;
    const tbody = document.getElementById('pt-tbody');
    tbody.innerHTML = '<tr><td colspan="3">Memuat data...</td></tr>';

    const { data, error } = await supabaseClient
        .from('approved_companies')
        .select('*')
        .order('nama_pt', { ascending: true });

    if (error) {
        tbody.innerHTML = '<tr><td colspan="3">Gagal memuat PT</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    data.forEach(pt => {
        const tr = document.createElement('tr');
        const date = new Date(pt.created_at).toLocaleDateString('id-ID');
        tr.innerHTML = `
            <td><strong>${pt.nama_pt}</strong></td>
            <td>${date}</td>
            <td><button onclick="deletePT('${pt.id}')" class="btn-danger">Hapus</button></td>
        `;
        tbody.appendChild(tr);
    });
}

document.getElementById('add-pt-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!supabaseClient) return;

    const name = document.getElementById('new-pt-name').value;
    const msg = document.getElementById('pt-message');

    const { error } = await supabaseClient
        .from('approved_companies')
        .insert([{ nama_pt: name }]);

    if (error) {
        msg.className = 'message error';
        msg.textContent = 'Gagal menambah PT: ' + error.message;
    } else {
        msg.className = 'message success';
        msg.textContent = 'Nama PT berhasil ditambahkan ke daftar yang disetujui!';
        document.getElementById('add-pt-form').reset();
        fetchApprovedPTs();
    }
});

async function deletePT(id) {
    if (!confirm('Yakin ingin menghapus PT ini dari daftar disetujui?')) return;
    const { error } = await supabaseClient.from('approved_companies').delete().eq('id', id);
    if (!error) fetchApprovedPTs();
}

// Inisialisasi awal
checkAuthStatus();
loadCompanyOptions();