// ==========================================
// KONFIGURASI SUPABASE (GANTI SAMA DENGAN MILIK ANDA)
// ==========================================
const SUPABASE_URL = 'https://gyortxfcoifxzrwfogzr.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5b3J0eGZjb2lmeHpyd2ZvZ3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNzE2NzEsImV4cCI6MjEwNTc0NzY3MX0.dO07GyxM9WYRMHYOE70-nJQI_TONr7SXK7loXLRdkHU';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// KAMUS MULTI-BAHASA (ID & EN)
// ==========================================
const translations = {
    id: {
        navGuest: "Dashboard Tamu",
        navAdmin: "Login Admin",
        navLogout: "Logout",
        heroTitle: "Selamat Datang di Portal Tamu Perusahaan",
        heroDesc: "Daftarkan kunjungan Anda atau periksa status persetujuan akses dengan cepat dan mudah.",
        btnGetStarted: "Get Started",
        btnCheckStatus: "Cek Status Akses",
        formRegTitle: "Form Registrasi Tamu",
        lblFullName: "Nama Lengkap",
        lblIdType: "Jenis ID Identitas",
        lblIdNumber: "Nomor ID Identitas",
        lblCompany: "Asal Instansi / Perusahaan",
        lblManualCompany: "Nama Instansi / Perusahaan (Manual)",
        lblPurpose: "Keperluan Kunjungan",
        btnSubmitReg: "Kirim Registrasi",
        checkStatusTitle: "Cek Status Approval Tamu",
        checkStatusDesc: "Masukkan Nomor Registrasi / ID Tamu Anda.",
        btnCheck: "Periksa",
        adminLoginTitle: "Login Administrator",
        adminLoginDesc: "Gunakan Username dan Password untuk masuk.",
        lblUsername: "Username",
        lblPassword: "Password",
        btnLogin: "Login",
        btnForgotPass: "Lupa / Reset Password?",
        dashTitle: "Dashboard Panel Admin",
        dashDesc: "Kelola persetujuan akses tamu, instansi, akun admin, dan tampilan website.",
        tabGuestList: "Daftar Tamu & Approval",
        tabCompanies: "Kelola Instansi / PT",
        tabAdmins: "Kelola Akun Admin",
        tabSettings: "Pengaturan Website",
        tableGuestTitle: "Daftar Registrasi Tamu",
        addCompanyTitle: "Tambah PT / Instansi yang Disetujui",
        btnAddCompany: "Tambah PT",
        addAdminTitle: "Tambah Akun Admin Baru (Tanpa Email)",
        btnCreateAdmin: "Buat Akun Admin",
        settingsTitle: "Pengaturan Tampilan Logo & Wallpaper Website",
        lblLogoUrl: "URL Logo Perusahaan",
        lblWallpaperUrl: "URL Wallpaper / Latar Belakang Website",
        btnSaveSettings: "Simpan Pengaturan Tampilan",
        modalResetTitle: "Reset Password Admin",
        lblNewPass: "Password Baru",
        btnReset: "Reset Password"
    },
    en: {
        navGuest: "Guest Dashboard",
        navAdmin: "Admin Login",
        navLogout: "Logout",
        heroTitle: "Welcome to Company Guest Portal",
        heroDesc: "Register your visit or check your access approval status quickly and easily.",
        btnGetStarted: "Get Started",
        btnCheckStatus: "Check Access Status",
        formRegTitle: "Guest Registration Form",
        lblFullName: "Full Name",
        lblIdType: "Identity Type",
        lblIdNumber: "Identity Number",
        lblCompany: "Company / Institution",
        lblManualCompany: "Company / Institution Name (Manual)",
        lblPurpose: "Purpose of Visit",
        btnSubmitReg: "Submit Registration",
        checkStatusTitle: "Check Guest Approval Status",
        checkStatusDesc: "Enter your Registration Number / Guest ID.",
        btnCheck: "Check Status",
        adminLoginTitle: "Administrator Login",
        adminLoginDesc: "Use your Username and Password to log in.",
        lblUsername: "Username",
        lblPassword: "Password",
        btnLogin: "Login",
        btnForgotPass: "Forgot / Reset Password?",
        dashTitle: "Admin Panel Dashboard",
        dashDesc: "Manage guest access approvals, companies, admin accounts, and web display.",
        tabGuestList: "Guest List & Approval",
        tabCompanies: "Manage Companies",
        tabAdmins: "Manage Admin Accounts",
        tabSettings: "Website Settings",
        tableGuestTitle: "Guest Registration List",
        addCompanyTitle: "Add Approved Company / Institution",
        btnAddCompany: "Add Company",
        addAdminTitle: "Add New Admin Account (No Email Needed)",
        btnCreateAdmin: "Create Admin Account",
        settingsTitle: "Logo & Website Wallpaper Settings",
        lblLogoUrl: "Company Logo URL",
        lblWallpaperUrl: "Website Background Wallpaper URL",
        btnSaveSettings: "Save Display Settings",
        modalResetTitle: "Reset Admin Password",
        lblNewPass: "New Password",
        btnReset: "Reset Password"
    }
};

let currentLang = 'id';
let currentAdminUser = null;

// ==========================================
// INISIALISASI HALAMAN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    loadApprovedCompanies();
    checkSession();
});

function setLanguage(lang) {
    currentLang = lang;
    document.getElementById('lang-id-btn').classList.toggle('active', lang === 'id');
    document.getElementById('lang-en-btn').classList.toggle('active', lang === 'en');

    document.querySelectorAll('[data-lang]').forEach(el => {
        const key = el.getAttribute('data-lang');
        if (translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });
}

// Navigasi Tab Utama
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));

    document.getElementById(tabId).classList.add('active');

    if (tabId === 'guest-dash') {
        document.querySelector('.nav-btn[onclick="switchTab(\'guest-dash\')"]').classList.add('active');
    } else if (tabId === 'admin-login-sec') {
        document.getElementById('nav-login-btn').classList.add('active');
    }
}

// Navigasi Sub-Tab Admin
function switchAdminTab(tabId) {
    document.querySelectorAll('.admin-tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.admin-tab-btn').forEach(el => el.classList.remove('active'));

    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');

    if (tabId === 'tab-guests') fetchAdminGuests();
    if (tabId === 'tab-companies') fetchAdminCompanies();
    if (tabId === 'tab-users') fetchAdminUsers();
}

// ==========================================
// LOAD PENGATURAN LOGO & WALLPAPER
// ==========================================
async function loadSettings() {
    const { data, error } = await supabaseClient.from('app_settings').select('*');
    if (!error && data) {
        data.forEach(item => {
            if (item.key === 'company_logo' && item.value) {
                document.getElementById('app-logo').src = item.value;
                document.getElementById('setting-logo-url').value = item.value;
            }
            if (item.key === 'wallpaper_url' && item.value) {
                document.documentElement.style.setProperty('--wallpaper-url', `url('${item.value}')`);
                document.getElementById('setting-wallpaper-url').value = item.value;
            }
        });
    }
}

// Toggle manual company input
function toggleManualCompany(val) {
    const manualGroup = document.getElementById('manual-company-group');
    const manualInput = document.getElementById('reg-company-manual');
    if (val === 'MANUAL_INPUT') {
        manualGroup.style.display = 'block';
        manualInput.setAttribute('required', 'true');
    } else {
        manualGroup.style.display = 'none';
        manualInput.removeAttribute('required');
    }
}

// Load Approved Companies into Form Dropdown
async function loadApprovedCompanies() {
    const selectEl = document.getElementById('reg-company-select');
    const { data } = await supabaseClient.from('companies').select('*').order('nama_pt', { ascending: true });

    selectEl.innerHTML = `<option value="">-- ${currentLang === 'id' ? 'Pilih PT / Instansi' : 'Select Company'} --</option>`;
    if (data) {
        data.forEach(comp => {
            const opt = document.createElement('option');
            opt.value = comp.nama_pt;
            opt.textContent = comp.nama_pt;
            selectEl.appendChild(opt);
        });
    }
    const manualOpt = document.createElement('option');
    manualOpt.value = 'MANUAL_INPUT';
    manualOpt.textContent = '+ ' + (currentLang === 'id' ? 'Input Manual Nama PT / Instansi' : 'Manual Input Company');
    selectEl.appendChild(manualOpt);
}

// ==========================================
// REGISTRASI TAMU
// ==========================================
document.getElementById('guest-register-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const nama = document.getElementById('reg-name').value;
    const jenis_id = document.getElementById('reg-id-type').value;
    const nomor_id = document.getElementById('reg-id-num').value;
    const selectCompany = document.getElementById('reg-company-select').value;
    const manualCompany = document.getElementById('reg-company-manual').value;
    const keperluan = document.getElementById('reg-purpose').value;

    const instansi_pt = selectCompany === 'MANUAL_INPUT' ? manualCompany : selectCompany;
    const reg_number = 'REG-' + Math.floor(100000 + Math.random() * 900000);

    const { error } = await supabaseClient.from('guests').insert([{
        reg_number,
        nama,
        jenis_id,
        nomor_id,
        instansi_pt,
        keperluan,
        status: 'Menunggu Akses'
    }]);

    const alertBox = document.getElementById('reg-alert');
    alertBox.classList.remove('hidden');

    if (error) {
        alertBox.className = 'alert alert-error';
        alertBox.textContent = currentLang === 'id' ? 'Gagal mendaftar. Silakan coba lagi.' : 'Registration failed. Try again.';
    } else {
        alertBox.className = 'alert alert-success';
        alertBox.innerHTML = `<strong>${currentLang === 'id' ? 'Registrasi Berhasil!' : 'Registration Successful!'}</strong><br>` +
            `${currentLang === 'id' ? 'Nomor Registrasi Anda' : 'Your Registration ID'}: <strong style="font-size:1.1rem; color:#2563eb;">${reg_number}</strong><br>` +
            `<small>${currentLang === 'id' ? 'Gunakan nomor di atas untuk cek status approval.' : 'Use this ID to check approval status.'}</small>`;
        document.getElementById('guest-register-form').reset();
        document.getElementById('manual-company-group').style.display = 'none';
    }
});

// ==========================================
// CEK STATUS APPROVAL TAMU
// ==========================================
document.getElementById('check-status-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const regIdInput = document.getElementById('search-reg-id').value.trim();

    const { data, error } = await supabaseClient
        .from('guests')
        .select('*')
        .or(`reg_number.eq.${regIdInput},id.eq.${regIdInput}`)
        .maybeSingle();

    const cardResult = document.getElementById('status-result-card');
    cardResult.classList.remove('hidden');

    if (error || !data) {
        document.getElementById('res-reg-num').textContent = regIdInput;
        document.getElementById('res-status-badge').className = 'badge badge-danger';
        document.getElementById('res-status-badge').textContent = currentLang === 'id' ? 'Tidak Ditemukan' : 'Not Found';
        document.getElementById('res-nama').textContent = '-';
        document.getElementById('res-instansi').textContent = '-';
        document.getElementById('res-jenis-id').textContent = '-';
        document.getElementById('res-no-id').textContent = '-';
        document.getElementById('res-date').textContent = '-';
        document.getElementById('res-notification').className = 'status-notif-box alert-error';
        document.getElementById('res-notification').textContent = currentLang === 'id' 
            ? 'Nomor Registrasi / ID tidak ditemukan di dalam sistem.' 
            : 'Registration ID not found in system.';
        return;
    }

    document.getElementById('res-reg-num').textContent = data.reg_number;
    document.getElementById('res-nama').textContent = data.nama;
    document.getElementById('res-instansi').textContent = data.instansi_pt;
    document.getElementById('res-jenis-id').textContent = data.jenis_id;
    document.getElementById('res-no-id').textContent = data.nomor_id;
    document.getElementById('res-date').textContent = new Date(data.created_at).toLocaleString('id-ID');

    const badge = document.getElementById('res-status-badge');
    const notif = document.getElementById('res-notification');

    if (data.status === 'Diberikan Akses') {
        badge.className = 'badge badge-success';
        badge.textContent = currentLang === 'id' ? 'AKSES DISETUJUI' : 'ACCESS APPROVED';
        notif.className = 'status-notif-box alert-success';
        notif.innerHTML = '🎉 ' + (currentLang === 'id' 
            ? 'Selamat! Akses Anda telah disetujui. Silakan tunjukkan nomor registrasi ke Resepsionis.' 
            : 'Congratulations! Your access is approved. Please present your registration ID to Reception.');
    } else if (data.status === 'Akses Ditolak') {
        badge.className = 'badge badge-danger';
        badge.textContent = currentLang === 'id' ? 'AKSES DITOLAK' : 'ACCESS REJECTED';
        notif.className = 'status-notif-box alert-error';
        notif.textContent = currentLang === 'id' 
            ? 'Mohon maaf, permohonan akses Anda belum/tidak disetujui oleh Administrator.' 
            : 'Sorry, your access request was rejected by Administrator.';
    } else {
        badge.className = 'badge badge-warning';
        badge.textContent = currentLang === 'id' ? 'MENUNGGU APPROVAL' : 'PENDING APPROVAL';
        notif.className = 'status-notif-box alert-warning';
        notif.textContent = currentLang === 'id' 
            ? 'Permohonan Anda sedang diverifikasi oleh Tim Administrator.' 
            : 'Your request is currently being reviewed by Admin.';
    }
});

// ==========================================
// ADMIN LOGIN, LOGOUT & SESSION
// ==========================================
document.getElementById('admin-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = document.getElementById('admin-user').value.trim();
    const pass = document.getElementById('admin-pass').value.trim();
    const alertBox = document.getElementById('login-alert');

    const { data, error } = await supabaseClient
        .from('admin_users')
        .select('*')
        .eq('username', user)
        .eq('password', pass)
        .maybeSingle();

    if (error || !data) {
        alertBox.classList.remove('hidden');
        alertBox.textContent = currentLang === 'id' ? 'Username atau Password salah!' : 'Invalid Username or Password!';
    } else {
        alertBox.classList.add('hidden');
        currentAdminUser = data.username;
        localStorage.setItem('admin_session', data.username);
        updateAuthUI(true);
        switchTab('admin-dashboard-sec');
        switchAdminTab('tab-guests');
    }
});

function checkSession() {
    const session = localStorage.getItem('admin_session');
    if (session) {
        currentAdminUser = session;
        updateAuthUI(true);
    } else {
        updateAuthUI(false);
    }
}

function logoutAdmin() {
    localStorage.removeItem('admin_session');
    currentAdminUser = null;
    updateAuthUI(false);
    switchTab('guest-dash');
}

function updateAuthUI(isLoggedIn) {
    document.getElementById('nav-login-btn').style.display = isLoggedIn ? 'none' : 'inline-block';
    document.getElementById('nav-logout-btn').style.display = isLoggedIn ? 'inline-block' : 'none';
}

// ==========================================
// LOGIKA DASHBOARD ADMIN
// ==========================================

// Fetch Guests
async function fetchAdminGuests() {
    const tbody = document.getElementById('guest-table-body');
    tbody.innerHTML = '<tr><td colspan="7">Memuat data...</td></tr>';

    const { data, error } = await supabaseClient.from('guests').select('*').order('created_at', { ascending: false });

    if (error || !data) {
        tbody.innerHTML = '<tr><td colspan="7">Gagal memuat data</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    data.forEach(g => {
        const tr = document.createElement('tr');
        let badgeClass = g.status === 'Diberikan Akses' ? 'badge-success' : (g.status === 'Akses Ditolak' ? 'badge-danger' : 'badge-warning');
        
        tr.innerHTML = `
            <td><strong>${g.reg_number}</strong></td>
            <td>${g.nama}</td>
            <td>${g.jenis_id}: ${g.nomor_id}</td>
            <td>${g.instansi_pt}</td>
            <td>${g.keperluan}</td>
            <td><span class="badge ${badgeClass}">${g.status}</span></td>
            <td>
                <button onclick="updateGuestStatus('${g.id}', 'Diberikan Akses')" class="btn-success" title="Setujui"><i class="fa-solid fa-check"></i></button>
                <button onclick="updateGuestStatus('${g.id}', 'Akses Ditolak')" class="btn-danger" style="border:none; padding:0.4rem 0.8rem; border-radius:4px; cursor:pointer;" title="Tolak"><i class="fa-solid fa-xmark"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function updateGuestStatus(id, newStatus) {
    await supabaseClient.from('guests').update({ status: newStatus }).eq('id', id);
    fetchAdminGuests();
}

// Fetch Companies
async function fetchAdminCompanies() {
    const tbody = document.getElementById('company-table-body');
    tbody.innerHTML = '<tr><td colspan="3">Memuat data...</td></tr>';

    const { data } = await supabaseClient.from('companies').select('*').order('created_at', { ascending: false });

    tbody.innerHTML = '';
    if (data) {
        data.forEach(c => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${c.nama_pt}</td>
                <td>${new Date(c.created_at).toLocaleDateString()}</td>
                <td><button onclick="deleteCompany('${c.id}')" class="btn-danger" style="border:none; padding:0.3rem 0.6rem; border-radius:4px; cursor:pointer;"><i class="fa-solid fa-trash"></i> Hapus</button></td>
            `;
            tbody.appendChild(tr);
        });
    }
}

document.getElementById('add-company-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nama_pt = document.getElementById('new-company-name').value.trim();
    if (nama_pt) {
        await supabaseClient.from('companies').insert([{ nama_pt }]);
        document.getElementById('new-company-name').value = '';
        fetchAdminCompanies();
        loadApprovedCompanies();
    }
});

async function deleteCompany(id) {
    if (confirm('Hapus PT ini dari daftar yang disetujui?')) {
        await supabaseClient.from('companies').delete().eq('id', id);
        fetchAdminCompanies();
        loadApprovedCompanies();
    }
}

// Fetch Admin Users
async function fetchAdminUsers() {
    const tbody = document.getElementById('admin-table-body');
    tbody.innerHTML = '<tr><td colspan="3">Memuat data...</td></tr>';

    const { data } = await supabaseClient.from('admin_users').select('id, username, created_at').order('created_at', { ascending: false });

    tbody.innerHTML = '';
    if (data) {
        data.forEach(u => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${u.username}</strong></td>
                <td>${new Date(u.created_at).toLocaleDateString()}</td>
                <td>
                    ${u.username !== 'admin' ? `<button onclick="deleteAdmin('${u.id}')" class="btn-danger" style="border:none; padding:0.3rem 0.6rem; border-radius:4px; cursor:pointer;"><i class="fa-solid fa-trash"></i> Hapus</button>` : '<i>Main Admin</i>'}
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
}

document.getElementById('add-admin-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('new-admin-user').value.trim();
    const password = document.getElementById('new-admin-pass').value.trim();

    const { error } = await supabaseClient.from('admin_users').insert([{ username, password }]);
    if (error) {
        alert('Gagal menambah admin. Username mungkin sudah digunakan.');
    } else {
        alert('Akun Admin berhasil ditambahkan!');
        document.getElementById('add-admin-form').reset();
        fetchAdminUsers();
    }
});

async function deleteAdmin(id) {
    if (confirm('Hapus akun admin ini?')) {
        await supabaseClient.from('admin_users').delete().eq('id', id);
        fetchAdminUsers();
    }
}

// Reset Password Modal Logic
function openResetPasswordModal() {
    document.getElementById('reset-modal').classList.remove('hidden');
}

function closeResetPasswordModal() {
    document.getElementById('reset-modal').classList.add('hidden');
}

document.getElementById('reset-pass-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('reset-user').value.trim();
    const newPassword = document.getElementById('reset-new-pass').value.trim();

    const { data } = await supabaseClient.from('admin_users').select('*').eq('username', username).maybeSingle();

    if (!data) {
        alert('Username admin tidak ditemukan!');
    } else {
        await supabaseClient.from('admin_users').update({ password: newPassword }).eq('username', username);
        alert('Password berhasil diperbarui! Silakan login dengan password baru.');
        closeResetPasswordModal();
    }
});

// Update Website Settings (Logo & Wallpaper)
document.getElementById('settings-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const logoUrl = document.getElementById('setting-logo-url').value.trim();
    const wallpaperUrl = document.getElementById('setting-wallpaper-url').value.trim();

    await supabaseClient.from('app_settings').upsert([
        { key: 'company_logo', value: logoUrl },
        { key: 'wallpaper_url', value: wallpaperUrl }
    ]);

    document.getElementById('app-logo').src = logoUrl;
    document.documentElement.style.setProperty('--wallpaper-url', `url('${wallpaperUrl}')`);
    alert('Pengaturan logo dan wallpaper berhasil disimpan!');
});