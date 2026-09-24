// ==========================================
// KONFIGURASI SUPABASE (GANTI SESUAI PROYEK ANDA)
// ==========================================
const SUPABASE_URL = 'ISI_URL_SUPABASE_ANDA';
const SUPABASE_ANON_KEY = 'ISI_ANON_KEY_SUPABASE_ANDA';

// Inisialisasi Klien Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// FUNGSI NAVIGASI HALAMAN & TAB
// ==========================================
function showPage(pageId) {
    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');

    if (pageId === 'admin-dashboard') {
        fetchGuests();
        fetchApprovedCompanies();
        fetchGuestAccounts();
    } else if (pageId === 'guest-page') {
        loadCompanyDropdown();
    }
}

function switchAdminTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    event.target.classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

// Cek Status Auth Admin
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
// LOGIKA BUKU TAMU (GUEST)
// ==========================================
async function loadCompanyDropdown() {
    const select = document.getElementById('guest-company-select');
    
    const { data, error } = await supabaseClient
        .from('approved_companies')
        .select('nama_pt')
        .order('nama_pt', { ascending: true });

    if (error) {
        console.error('Gagal memuat PT:', error);
        return;
    }

    // Reset opsi selain manual input
    select.innerHTML = '<option value="">-- Pilih PT / Instansi --</option>';
    data.forEach(item => {
        const option = document.createElement('option');
        option.value = item.nama_pt;
        option.textContent = item.nama_pt;
        select.appendChild(option);
    });

    const manualOption = document.createElement('option');
    manualOption.value = 'MANUAL_INPUT';
    manualOption.textContent = '+ Lainnya (Ketik Manual)';
    select.appendChild(manualOption);
}

function toggleManualCompanyInput() {
    const selectValue = document.getElementById('guest-company-select').value;
    const manualGroup = document.getElementById('manual-company-group');
    const manualInput = document.getElementById('guest-company-manual');

    if (selectValue === 'MANUAL_INPUT') {
        manualGroup.style.display = 'block';
        manualInput.required = true;
    } else {
        manualGroup.style.display = 'none';
        manualInput.required = false;
        manualInput.value = '';
    }
}

document.getElementById('guest-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('guest-name').value;
    const idType = document.getElementById('guest-id-type').value;
    const idNumber = document.getElementById('guest-id-number').value;
    const selectedCompany = document.getElementById('guest-company-select').value;
    const manualCompany = document.getElementById('guest-company-manual').value;
    const purpose = document.getElementById('guest-purpose').value;
    const messageDiv = document.getElementById('guest-message');

    const finalCompany = selectedCompany === 'MANUAL_INPUT' ? manualCompany : selectedCompany;

    const { error } = await supabaseClient
        .from('guests')
        .insert([{ 
            nama: name, 
            jenis_id: idType,
            nomor_id: idNumber,
            instansi: finalCompany, 
            keperluan: purpose 
        }]);

    if (error) {
        messageDiv.className = 'message error';
        messageDiv.textContent = 'Gagal mendaftar: ' + error.message;
    } else {
        messageDiv.className = 'message success';
        messageDiv.textContent = 'Registrasi tamu berhasil! Menunggu konfirmasi admin.';
        document.getElementById('guest-form').reset();
        toggleManualCompanyInput();
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
        messageDiv.style.display = 'block';
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
// DASHBOARD: DAFTAR TAMU & APPROVAL
// ==========================================
async function fetchGuests() {
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
        
        let statusBadge = `<span class="status-badge status-menunggu">Menunggu</span>`;
        if (guest.status === 'Diberikan Akses') {
            statusBadge = `<span class="status-badge status-diberikan">Diberikan Akses</span>`;
        } else if (guest.status === 'Ditolak') {
            statusBadge = `<span class="status-badge status-ditolak">Ditolak</span>`;
        }

        let actionBtns = `
            <button onclick="updateGuestStatus('${guest.id}', 'Diberikan Akses')" class="btn-success">Setujui</button>
            <button onclick="updateGuestStatus('${guest.id}', 'Ditolak')" class="btn-danger">Tolak</button>
        `;

        if (guest.status !== 'Menunggu') {
            actionBtns = `<i>Akses ${guest.status}</i>`;
        }

        tr.innerHTML = `
            <td>${date}</td>
            <td><strong>${guest.nama}</strong></td>
            <td>${guest.jenis_id || '-'}: ${guest.nomor_id || '-'}</td>
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
        alert('Gagal memperbarui status: ' + error.message);
    } else {
        fetchGuests();
    }
}

// ==========================================
// DASHBOARD: KELOLA PT DISETUJUI
// ==========================================
async function fetchApprovedCompanies() {
    const tbody = document.getElementById('companies-tbody');
    tbody.innerHTML = '<tr><td colspan="3">Memuat data...</td></tr>';

    const { data, error } = await supabaseClient
        .from('approved_companies')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        tbody.innerHTML = '<tr><td colspan="3">Gagal memuat daftar PT</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    data.forEach(company => {
        const tr = document.createElement('tr');
        const date = new Date(company.created_at).toLocaleDateString('id-ID');
        tr.innerHTML = `
            <td><strong>${company.nama_pt}</strong></td>
            <td>${date}</td>
            <td><button onclick="deleteCompany('${company.id}')" class="btn-danger">Hapus</button></td>
        `;
        tbody.appendChild(tr);
    });
}

document.getElementById('add-company-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const companyName = document.getElementById('new-company-name').value;

    const { error } = await supabaseClient
        .from('approved_companies')
        .insert([{ nama_pt: companyName }]);

    if (error) {
        alert('Gagal menambah PT: ' + error.message);
    } else {
        document.getElementById('new-company-name').value = '';
        fetchApprovedCompanies();
    }
});

async function deleteCompany(id) {
    if(!confirm('Yakin ingin menghapus PT ini?')) return;

    const { error } = await supabaseClient
        .from('approved_companies')
        .delete()
        .eq('id', id);

    if (error) {
        alert('Gagal menghapus PT: ' + error.message);
    } else {
        fetchApprovedCompanies();
    }
}

// ==========================================
// DASHBOARD: KELOLA AKUN GUEST / EMAIL
// ==========================================
async function fetchGuestAccounts() {
    const tbody = document.getElementById('guest-accounts-tbody');
    tbody.innerHTML = '<tr><td colspan="3">Memuat data...</td></tr>';

    const { data, error } = await supabaseClient
        .from('guest_accounts')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        tbody.innerHTML = '<tr><td colspan="3">Gagal memuat akun tamu</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    data.forEach(account => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${account.email}</td>
            <td><span class="status-badge status-diberikan">${account.status}</span></td>
            <td><button onclick="deleteGuestAccount('${account.id}')" class="btn-danger">Hapus</button></td>
        `;
        tbody.appendChild(tr);
    });
}

document.getElementById('add-guest-account-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('new-guest-email').value;

    const { error } = await supabaseClient
        .from('guest_accounts')
        .insert([{ email: email, status: 'Approved' }]);

    if (error) {
        alert('Gagal menambahkan email: ' + error.message);
    } else {
        document.getElementById('new-guest-email').value = '';
        fetchGuestAccounts();
    }
});

async function deleteGuestAccount(id) {
    if(!confirm('Yakin ingin menghapus akun tamu ini?')) return;

    const { error } = await supabaseClient
        .from('guest_accounts')
        .delete()
        .eq('id', id);

    if (error) {
        alert('Gagal menghapus akun: ' + error.message);
    } else {
        fetchGuestAccounts();
    }
}

// Inisialisasi saat pertama kali dimuat
checkAuthStatus();