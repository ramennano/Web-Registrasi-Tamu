// ==========================================
// KONFIGURASI SUPABASE
// ==========================================
const SUPABASE_URL = 'https://gyortxfcoifxzrwfogzr.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5b3J0eGZjb2lmeHpyd2ZvZ3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNzE2NzEsImV4cCI6MjEwNTc0NzY3MX0.dO07GyxM9WYRMHYOE70-nJQI_TONr7SXK7loXLRdkHU'; 

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// KAMUS BAHASA DUA ARAH (i18n: ID / EN)
// ==========================================
let currentLang = 'id';

const translations = {
    id: {
        nav_guest: "Dashboard Tamu",
        nav_login: "Login Admin",
        nav_logout: "Logout",
        hero_title: "Selamat Datang di Portal Buku Tamu Digital",
        hero_subtitle: "Silakan mendaftarkan kunjungan Anda atau periksa status persetujuan pendaftaran Anda.",
        btn_get_started: "Get Started / Register Tamu",
        btn_check_status_hero: "Cek Status Persetujuan",
        title_register: "Form Registrasi Tamu",
        desc_register: "Lengkapi data diri Anda untuk mengajukan izin kunjungan.",
        label_name: "Nama Lengkap",
        label_id_type: "Jenis ID (Identitas)",
        label_id_number: "Nomor ID / Identitas",
        label_company: "Asal Instansi / Perusahaan",
        opt_select_company: "-- Pilih Perusahaan Terdaftar --",
        opt_manual_company: "+ Input Manual Nama Perusahaan",
        label_manual_company: "Masukkan Nama Instansi / Perusahaan (Manual)",
        label_purpose: "Keperluan Kunjungan",
        btn_submit_reg: "Kirim Registrasi",
        title_check_status: "Cek Status Persetujuan",
        desc_check_status: "Masukkan Nomor Registrasi / ID Tamu Anda untuk melihat status izin akses.",
        label_reg_no: "Nomor Registrasi / ID Tamu",
        btn_search_status: "Periksa Status",
        title_admin_login: "Login Administrator",
        desc_admin_login: "Gunakan akun admin untuk mengelola akses kunjungan tamu.",
        label_username: "Username",
        label_password: "Password",
        btn_login: "Login",
        title_admin_dashboard: "Dashboard Admin & Panel Kontrol"
    },
    en: {
        nav_guest: "Guest Dashboard",
        nav_login: "Admin Login",
        nav_logout: "Logout",
        hero_title: "Welcome to Digital Guestbook Portal",
        hero_subtitle: "Register your visit or check your registration approval status.",
        btn_get_started: "Get Started / Register Guest",
        btn_check_status_hero: "Check Approval Status",
        title_register: "Guest Registration Form",
        desc_register: "Fill in your details to request visit access.",
        label_name: "Full Name",
        label_id_type: "ID Type",
        label_id_number: "ID / Card Number",
        label_company: "Company / Institution",
        opt_select_company: "-- Select Registered Company --",
        opt_manual_company: "+ Manual Company Input",
        label_manual_company: "Enter Company Name (Manual)",
        label_purpose: "Purpose of Visit",
        btn_submit_reg: "Submit Registration",
        title_check_status: "Check Approval Status",
        desc_check_status: "Enter your Registration Number / Guest ID to check access status.",
        label_reg_no: "Registration No / Guest ID",
        btn_search_status: "Check Status",
        title_admin_login: "Administrator Login",
        desc_admin_login: "Use admin account to manage guest visit access.",
        label_username: "Username",
        label_password: "Password",
        btn_login: "Login",
        title_admin_dashboard: "Admin Dashboard & Control Panel"
    }
};

function switchLanguage() {
    currentLang = currentLang === 'id' ? 'en' : 'id';
    document.getElementById('lang-btn').innerHTML = `<i class="fa-solid fa-globe"></i> ${currentLang.toUpperCase()}`;
    
    document.querySelectorAll('[data-key]').forEach(elem => {
        const key = elem.getAttribute('data-key');
        if (translations[currentLang][key]) {
            elem.textContent = translations[currentLang][key];
        }
    });
}

// ==========================================
// NAVIGASI DOKUMEN & HALAMAN
// ==========================================
function showPage(pageId) {
    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');

    if (pageId === 'admin-dashboard') {
        fetchGuests();
        fetchCompanies();
        fetchUsers();
    }
}

function scrollToSection(sectionId) {
    document.getElementById(sectionId).scrollIntoView({ behavior: 'smooth' });
}

function switchAdminTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    event.currentTarget.classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

// ==========================================
// LOGIKA DAFTAR KELOLA PERUSAHAAN (PT)
// ==========================================
async function fetchCompanies() {
    const selectElem = document.getElementById('guest-company-select');
    const listElem = document.getElementById('company-list');

    const { data, error } = await supabaseClient
        .from('companies')
        .select('*')
        .order('nama_company', { ascending: true });

    if (error) {
        console.error('Error fetching companies:', error);
        return;
    }

    // Reset Dropdown Form Tamu
    selectElem.innerHTML = `
        <option value="" disabled selected data-key="opt_select_company">${translations[currentLang].opt_select_company}</option>
    `;
    data.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.nama_company;
        opt.textContent = c.nama_company;
        selectElem.appendChild(opt);
    });

    const manualOpt = document.createElement('option');
    manualOpt.value = 'MANUAL';
    manualOpt.textContent = translations[currentLang].opt_manual_company;
    selectElem.appendChild(manualOpt);

    // Populate List di Admin Panel
    if (listElem) {
        listElem.innerHTML = '';
        data.forEach(c => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${c.nama_company}</span>
                <button onclick="deleteCompany('${c.id}')" class="btn-sm btn-danger"><i class="fa-solid fa-trash"></i> Hapus</button>
            `;
            listElem.appendChild(li);
        });
    }
}

function toggleManualCompany(val) {
    const manualGroup = document.getElementById('manual-company-group');
    if (val === 'MANUAL') {
        manualGroup.style.display = 'block';
        document.getElementById('guest-company-manual').required = true;
    } else {
        manualGroup.style.display = 'none';
        document.getElementById('guest-company-manual').required = false;
    }
}

// Tambah Perusahaan baru di Admin
document.getElementById('add-company-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newName = document.getElementById('new-company-name').value;
    const msgDiv = document.getElementById('company-message');

    const { error } = await supabaseClient
        .from('companies')
        .insert([{ nama_company: newName }]);

    if (error) {
        msgDiv.className = 'message error';
        msgDiv.textContent = 'Gagal menambahkan PT: ' + error.message;
    } else {
        msgDiv.className = 'message success';
        msgDiv.textContent = 'Berhasil menambahkan PT ke daftar disetujui!';
        document.getElementById('add-company-form').reset();
        fetchCompanies();
    }
});

async function deleteCompany(id) {
    if (confirm('Hapus PT ini dari daftar?')) {
        await supabaseClient.from('companies').delete().eq('id', id);
        fetchCompanies();
    }
}

// ==========================================
// REGISTRASI TAMU
// ==========================================
document.getElementById('guest-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('guest-name').value;
    const idType = document.getElementById('guest-id-type').value;
    const idNumber = document.getElementById('guest-id-number').value;
    const companySelect = document.getElementById('guest-company-select').value;
    const companyManual = document.getElementById('guest-company-manual').value;
    const purpose = document.getElementById('guest-purpose').value;
    const messageDiv = document.getElementById('guest-message');

    const finalCompany = companySelect === 'MANUAL' ? companyManual : companySelect;

    // Generasi Kode Registrasi Unik
    const regNo = 'REG-' + Math.random().toString(36).substr(2, 6).toUpperCase();

    const { error } = await supabaseClient
        .from('guests')
        .insert([{
            registration_no: regNo,
            nama: name,
            jenis_id: idType,
            nomor_id: idNumber,
            instansi: finalCompany,
            keperluan: purpose,
            status: 'Menunggu'
        }]);

    if (error) {
        messageDiv.className = 'message error';
        messageDiv.textContent = 'Gagal mendaftar: ' + error.message;
    } else {
        messageDiv.className = 'message success';
        messageDiv.innerHTML = `
            <strong>Registrasi Berhasil!</strong><br>
            Nomor Registrasi Anda: <u style="font-size:1.1rem;">${regNo}</u><br>
            <i>Simpan nomor ini untuk melakukan Cek Status Persetujuan.</i>
        `;
        document.getElementById('guest-form').reset();
        document.getElementById('manual-company-group').style.display = 'none';
    }
});

// ==========================================
// CEK STATUS APPROVAL TAMU
// ==========================================
document.getElementById('check-status-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const regIdInput = document.getElementById('check-reg-id').value.trim();
    const resultCard = document.getElementById('status-result-card');
    const banner = document.getElementById('status-notification-banner');

    const { data, error } = await supabaseClient
        .from('guests')
        .select('*')
        .or(`registration_no.eq.${regIdInput},id.eq.${regIdInput}`)
        .single();

    if (error || !data) {
        alert('Data registrasi tidak ditemukan. Periksa kembali ID / No. Registrasi Anda.');
        resultCard.style.display = 'none';
        return;
    }

    resultCard.style.display = 'block';
    document.getElementById('res-reg-no').textContent = data.registration_no;
    document.getElementById('res-name').textContent = data.nama;
    document.getElementById('res-company').textContent = data.instansi;
    document.getElementById('res-date').textContent = new Date(data.created_at).toLocaleString('id-ID');

    const badge = document.getElementById('res-status-badge');
    badge.textContent = data.status;

    if (data.status === 'Disetujui') {
        badge.className = 'status-badge status-disetujui';
        banner.className = 'notification-banner approved';
        banner.innerHTML = '<i class="fa-solid fa-circle-check"></i> SELAMAT! Akses kunjungan Anda telah DISETUJUI.';
    } else if (data.status === 'Ditolak') {
        badge.className = 'status-badge status-ditolak';
        banner.className = 'notification-banner rejected';
        banner.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> MOHON MAAF! Akses kunjungan Anda DITOLAK.';
    } else {
        badge.className = 'status-badge status-menunggu';
        banner.className = 'notification-banner pending';
        banner.innerHTML = '<i class="fa-solid fa-clock"></i> PERMINTAAN SEDANG DIPROSES. Menunggu persetujuan Admin.';
    }
});

// ==========================================
// ADMIN LOGIN, LOGOUT & DASHBOARD
// ==========================================
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('admin-username').value;
    const password = document.getElementById('admin-password').value;
    const msg = document.getElementById('login-message');

    const { data, error } = await supabaseClient
        .from('app_users')
        .select('*')
        .eq('username', username)
        .eq('password_hash', password)
        .single();

    if (error || !data) {
        msg.className = 'message error';
        msg.textContent = 'Username atau Password Admin salah!';
    } else {
        localStorage.setItem('adminSession', JSON.stringify(data));
        checkAuthStatus();
    }
});

function checkAuthStatus() {
    const session = localStorage.getItem('adminSession');
    if (session) {
        document.getElementById('nav-login-btn').style.display = 'none';
        document.getElementById('nav-logout-btn').style.display = 'inline-block';
        showPage('admin-dashboard');
    } else {
        document.getElementById('nav-login-btn').style.display = 'inline-block';
        document.getElementById('nav-logout-btn').style.display = 'none';
        showPage('guest-dashboard');
    }
}

function logoutAdmin() {
    localStorage.removeItem('adminSession');
    checkAuthStatus();
}

// Fetch Data Tamu untuk Admin
async function fetchGuests() {
    const tbody = document.getElementById('guests-tbody');
    tbody.innerHTML = '<tr><td colspan="8">Memuat data...</td></tr>';

    const { data, error } = await supabaseClient
        .from('guests')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        tbody.innerHTML = '<tr><td colspan="8">Gagal memuat data</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    data.forEach(g => {
        const tr = document.createElement('tr');
        const statusBadge = `<span class="status-badge status-${g.status.toLowerCase()}">${g.status}</span>`;
        
        tr.innerHTML = `
            <td><strong>${g.registration_no}</strong></td>
            <td>${new Date(g.created_at).toLocaleDateString('id-ID')}</td>
            <td>${g.nama}</td>
            <td>${g.jenis_id}: ${g.nomor_id}</td>
            <td>${g.instansi}</td>
            <td>${g.keperluan}</td>
            <td>${statusBadge}</td>
            <td>
                <button onclick="updateGuestStatus('${g.id}', 'Disetujui')" class="btn-sm btn-approve"><i class="fa-solid fa-check"></i> Setujui</button>
                <button onclick="updateGuestStatus('${g.id}', 'Ditolak')" class="btn-sm btn-reject"><i class="fa-solid fa-xmark"></i> Tolak</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function updateGuestStatus(id, newStatus) {
    await supabaseClient.from('guests').update({ status: newStatus }).eq('id', id);
    fetchGuests();
}

// ==========================================
// KELOLA USER ADMIN & RESET PASSWORD
// ==========================================
async function fetchUsers() {
    const tbody = document.getElementById('users-tbody');
    tbody.innerHTML = '<tr><td colspan="4">Memuat user...</td></tr>';

    const { data, error } = await supabaseClient
        .from('app_users')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return;

    tbody.innerHTML = '';
    data.forEach(u => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${u.username}</strong></td>
            <td>${u.role}</td>
            <td>${new Date(u.created_at).toLocaleDateString('id-ID')}</td>
            <td>
                <button onclick="resetPasswordPrompt('${u.id}', '${u.username}')" class="btn-sm btn-secondary">
                    <i class="fa-solid fa-key"></i> Reset Password
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Tambah Akun Login Baru Tanpa Email Verification
document.getElementById('add-user-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const uname = document.getElementById('new-user-name').value;
    const upass = document.getElementById('new-user-pass').value;
    const msgDiv = document.getElementById('user-message');

    const { error } = await supabaseClient
        .from('app_users')
        .insert([{ username: uname, password_hash: upass, role: 'admin' }]);

    if (error) {
        msgDiv.className = 'message error';
        msgDiv.textContent = 'Gagal menambah user: ' + error.message;
    } else {
        msgDiv.className = 'message success';
        msgDiv.textContent = 'Akun admin baru berhasil dibuat tanpa verifikasi email!';
        document.getElementById('add-user-form').reset();
        fetchUsers();
    }
});

async function resetPasswordPrompt(id, username) {
    const newPass = prompt(`Masukkan password baru untuk user [${username}]:`);
    if (newPass) {
        const { error } = await supabaseClient
            .from('app_users')
            .update({ password_hash: newPass })
            .eq('id', id);

        if (error) {
            alert('Gagal mereset password: ' + error.message);
        } else {
            alert(`Password untuk ${username} berhasil diubah!`);
        }
    }
}

// ==========================================
// HAPUS SEMUA KONFIGURASI DAN RESET SISTEM
// ==========================================
async function resetAllConfigurations() {
    if (confirm('PERINGATAN! Apakah Anda yakin ingin menghapus seluruh data registrasi tamu dan mereset konfigurasi ke awal?')) {
        // 1. Hapus semua Guests
        await supabaseClient.from('guests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        
        // 2. Clear Local Storage Session
        localStorage.clear();
        
        alert('Seluruh konfigurasi & data tamu telah berhasil dihapus/direset.');
        location.reload();
    }
}

// Inisialisasi awal
fetchCompanies();
checkAuthStatus();