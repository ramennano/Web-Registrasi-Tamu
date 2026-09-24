// ==========================================
// KONFIGURASI SUPABASE
// ==========================================
const SUPABASE_URL = 'https://gyortxfcoifxzrwfogzr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5b3J0eGZjb2lmeHpyd2ZvZ3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNzE2NzEsImV4cCI6MjEwNTc0NzY3MX0.dO07GyxM9WYRMHYOE70-nJQI_TONr7SXK7loXLRdkHU';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// State Admin Session
let currentAdminUser = null;
let currentLang = 'id';

// ==========================================
// KAMUS MULTI BAHASA (ID & EN)
// ==========================================
const i18n = {
    id: {
        nav_guest: "Dashboard Tamu",
        nav_login: "Login Admin",
        nav_logout: "Logout",
        hero_title: "Selamat Datang di Portal Tamu",
        hero_subtitle: "Silakan daftarkan diri Anda atau periksa status persetujuan kunjungan Anda di sini.",
        btn_get_started: "Get Started / Daftar Tamu",
        reg_title: "Formulir Registrasi Tamu",
        label_name: "Nama Lengkap",
        label_id_type: "Jenis ID",
        label_id_number: "Nomor ID",
        label_company: "Asal Instansi/Perusahaan",
        label_purpose: "Keperluan Kunjungan",
        btn_register: "Kirim Registrasi",
        check_title: "Cek Status Persetujuan Tamu",
        check_desc: "Masukkan Nomor Registrasi / ID Tamu yang Anda dapatkan saat pendaftaran:",
        label_reg_num: "Nomor Registrasi / ID Tamu",
        btn_check: "Periksa Status",
        status_result_title: "Hasil Pemeriksaan",
        admin_login_title: "Login Administrator",
        label_username: "Username",
        label_password: "Password",
        btn_login: "Login",
        btn_forgot_password: "Lupa / Reset Password?",
        reset_pass_title: "Reset Password Admin",
        label_new_pass: "Password Baru",
        btn_submit_reset: "Update Password",
        admin_dash_title: "Dashboard Kelola Tamu & Konfigurasi",
        tab_guests: "Daftar Tamu",
        tab_users: "Tambah Akun Admin",
        tab_settings: "Tampilan & Wallpaper",
        add_admin_title: "Tambah Akun Login Admin (Tanpa Email)",
        btn_add_admin: "Buat Akun Admin",
        setting_appearance_title: "Ubah Logo & Wallpaper Website",
        label_upload_logo: "Upload Logo Perusahaan (Local File)",
        label_upload_bg: "Upload Wallpaper Website (Local File)",
        btn_save_branding: "Simpan Perubahan Tampilan",
        danger_zone_title: "Reset Konfigurasi Web",
        danger_zone_desc: "Menghapus seluruh pengaturan logo, wallpaper, serta riwayat konfigurasi lokal web.",
        btn_reset_config: "Hapus Semua Konfigurasi Web"
    },
    en: {
        nav_guest: "Guest Dashboard",
        nav_login: "Admin Login",
        nav_logout: "Logout",
        hero_title: "Welcome to Guest Portal",
        hero_subtitle: "Please register yourself or check your visit approval status here.",
        btn_get_started: "Get Started / Register Guest",
        reg_title: "Guest Registration Form",
        label_name: "Full Name",
        label_id_type: "ID Type",
        label_id_number: "ID Number",
        label_company: "Company / Institution",
        label_purpose: "Purpose of Visit",
        btn_register: "Submit Registration",
        check_title: "Check Guest Approval Status",
        check_desc: "Enter the Registration Number / Guest ID obtained during registration:",
        label_reg_num: "Registration Number / Guest ID",
        btn_check: "Check Status",
        status_result_title: "Inspection Result",
        admin_login_title: "Administrator Login",
        label_username: "Username",
        label_password: "Password",
        btn_login: "Login",
        btn_forgot_password: "Forgot / Reset Password?",
        reset_pass_title: "Reset Admin Password",
        label_new_pass: "New Password",
        btn_submit_reset: "Update Password",
        admin_dash_title: "Manage Guests & Configuration Dashboard",
        tab_guests: "Guest List",
        tab_users: "Add Admin Account",
        tab_settings: "Appearance & Wallpaper",
        add_admin_title: "Add Admin Login Account (No Email)",
        btn_add_admin: "Create Admin Account",
        setting_appearance_title: "Change Website Logo & Wallpaper",
        label_upload_logo: "Upload Company Logo (Local File)",
        label_upload_bg: "Upload Website Wallpaper (Local File)",
        btn_save_branding: "Save Appearance Changes",
        danger_zone_title: "Reset Web Configuration",
        danger_zone_desc: "Clears all logo, wallpaper settings, and local web configurations.",
        btn_reset_config: "Reset All Web Configurations"
    }
};

// Ubah Bahasa UI
function changeLanguage(lang) {
    currentLang = lang;
    document.querySelectorAll('[data-i18n]').forEach(elem => {
        const key = elem.getAttribute('data-i18n');
        if (i18n[lang][key]) {
            elem.textContent = i18n[lang][key];
        }
    });
}

// Navigasi Halaman
function showPage(pageId) {
    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');

    if (pageId === 'admin-dashboard') {
        fetchGuestListAdmin();
    }
}

function scrollToRegister() {
    document.getElementById('form-register-section').scrollIntoView({ behavior: 'smooth' });
}

function switchAdminTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.admin-tab-content').forEach(tab => tab.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

// ==========================================
// REGISTRASI & CEK STATUS TAMU
// ==========================================
document.getElementById('guest-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msgBox = document.getElementById('guest-reg-msg');
    
    // Generate No Registrasi Acak (REG-XXXXXX)
    const regNum = 'REG-' + Math.floor(100000 + Math.random() * 900000);
    
    const guestData = {
        no_registrasi: regNum,
        nama: document.getElementById('guest-name').value,
        jenis_id: document.getElementById('guest-id-type').value,
        no_id: document.getElementById('guest-id-num').value,
        instansi: document.getElementById('guest-company').value,
        keperluan: document.getElementById('guest-purpose').value,
        status: 'Menunggu'
    };

    const { error } = await supabaseClient.from('guests').insert([guestData]);

    if (error) {
        msgBox.className = 'message-box error';
        msgBox.textContent = 'Gagal melakukan registrasi: ' + error.message;
    } else {
        msgBox.className = 'message-box success';
        msgBox.innerHTML = `Registrasi Berhasil! Simpan Nomor Registrasi Anda: <strong>${regNum}</strong>`;
        document.getElementById('guest-form').reset();
    }
});

// Cek Status Approval Tamu
document.getElementById('check-status-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const regNumInput = document.getElementById('check-reg-num').value.trim();
    const statusCard = document.getElementById('status-result');
    const badgeContainer = document.getElementById('status-badge-container');

    const { data, error } = await supabaseClient
        .from('guests')
        .select('*')
        .eq('no_registrasi', regNumInput)
        .single();

    if (error || !data) {
        alert('Nomor Registrasi / ID Tamu tidak ditemukan!');
        statusCard.style.display = 'none';
        return;
    }

    // Tampilkan Detail
    document.getElementById('res-reg-num').textContent = data.no_registrasi;
    document.getElementById('res-name').textContent = data.nama;
    document.getElementById('res-company').textContent = data.instansi;
    document.getElementById('res-purpose').textContent = data.keperluan;

    let badgeClass = 'badge-menunggu';
    if (data.status === 'Diberikan Akses') badgeClass = 'badge-diberikan';
    if (data.status === 'Ditolak') badgeClass = 'badge-ditolak';

    badgeContainer.innerHTML = `<span class="status-badge ${badgeClass}">${data.status}</span>`;
    statusCard.style.display = 'block';
});

// ==========================================
// ADMIN LOGIN & AKUN MANUAL
// ==========================================
document.getElementById('admin-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const u = document.getElementById('login-username').value;
    const p = document.getElementById('login-password').value;
    const msgBox = document.getElementById('login-msg');

    const { data, error } = await supabaseClient
        .from('admin_users')
        .select('*')
        .eq('username', u)
        .eq('password', p)
        .single();

    if (error || !data) {
        msgBox.className = 'message-box error';
        msgBox.textContent = 'Username atau Password salah!';
    } else {
        currentAdminUser = data;
        document.getElementById('btn-nav-login').style.display = 'none';
        document.getElementById('btn-nav-logout').style.display = 'inline-block';
        document.getElementById('admin-login-form').reset();
        msgBox.style.display = 'none';
        showPage('admin-dashboard');
    }
});

function logoutAdmin() {
    currentAdminUser = null;
    document.getElementById('btn-nav-login').style.display = 'inline-block';
    document.getElementById('btn-nav-logout').style.display = 'none';
    showPage('guest-dashboard');
}

// Reset Password Admin
function toggleResetPassword() {
    const p = document.getElementById('reset-password-panel');
    p.style.display = p.style.display === 'none' ? 'block' : 'none';
}

document.getElementById('reset-pass-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('reset-username').value;
    const newPass = document.getElementById('reset-new-password').value;
    const msgBox = document.getElementById('reset-msg');

    const { data, error } = await supabaseClient
        .from('admin_users')
        .update({ password: newPass })
        .eq('username', username)
        .select();

    if (error || data.length === 0) {
        msgBox.className = 'message-box error';
        msgBox.textContent = 'Username tidak ditemukan / gagal update password!';
    } else {
        msgBox.className = 'message-box success';
        msgBox.textContent = 'Password berhasil direset! Silakan login.';
        document.getElementById('reset-pass-form').reset();
    }
});

// Tambah Admin Baru
document.getElementById('add-admin-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('new-admin-username').value;
    const password = document.getElementById('new-admin-password').value;
    const msgBox = document.getElementById('add-admin-msg');

    const { error } = await supabaseClient
        .from('admin_users')
        .insert([{ username, password }]);

    if (error) {
        msgBox.className = 'message-box error';
        msgBox.textContent = 'Gagal menambah admin: ' + error.message;
    } else {
        msgBox.className = 'message-box success';
        msgBox.textContent = 'Akun admin baru berhasil dibuat!';
        document.getElementById('add-admin-form').reset();
    }
});

// ==========================================
// KELOLA STATUS TAMU OLEH ADMIN
// ==========================================
async function fetchGuestListAdmin() {
    const tbody = document.getElementById('guest-table-body');
    tbody.innerHTML = '<tr><td colspan="8">Memuat data...</td></tr>';

    const { data, error } = await supabaseClient
        .from('guests')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        tbody.innerHTML = '<tr><td colspan="8">Gagal memuat data tamu</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    data.forEach(g => {
        const dateStr = new Date(g.created_at).toLocaleString('id-ID');
        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td><strong>${g.no_registrasi}</strong></td>
            <td>${dateStr}</td>
            <td>${g.nama}</td>
            <td>${g.jenis_id}: ${g.no_id}</td>
            <td>${g.instansi}</td>
            <td>${g.keperluan}</td>
            <td><span class="status-badge badge-${g.status.toLowerCase().replace(' ', '')}">${g.status}</span></td>
            <td>
                <button onclick="updateStatus('${g.id}', 'Diberikan Akses')" class="btn-primary" style="padding:4px 8px; font-size:0.75rem;">Setuju</button>
                <button onclick="updateStatus('${g.id}', 'Ditolak')" class="btn-danger" style="padding:4px 8px; font-size:0.75rem;">Tolak</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function updateStatus(id, newStatus) {
    await supabaseClient.from('guests').update({ status: newStatus }).eq('id', id);
    fetchGuestListAdmin();
}

// ==========================================
// UPLOAD LOGO, WALLPAPER & RESET CONFIG
// ==========================================
function saveBrandingFiles() {
    const logoFile = document.getElementById('upload-logo-file').files[0];
    const wallpaperFile = document.getElementById('upload-wallpaper-file').files[0];
    const msgBox = document.getElementById('branding-msg');

    if (logoFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            localStorage.setItem('web_logo', e.target.result);
            document.getElementById('app-logo').src = e.target.result;
        };
        reader.readAsDataURL(logoFile);
    }

    if (wallpaperFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            localStorage.setItem('web_wallpaper', e.target.result);
            document.body.style.backgroundImage = `url('${e.target.result}')`;
        };
        reader.readAsDataURL(wallpaperFile);
    }

    msgBox.className = 'message-box success';
    msgBox.textContent = 'Tampilan logo dan wallpaper berhasil diperbarui!';
}

function loadBrandingFromStorage() {
    const savedLogo = localStorage.getItem('web_logo');
    const savedWallpaper = localStorage.getItem('web_wallpaper');

    if (savedLogo) {
        document.getElementById('app-logo').src = savedLogo;
    }
    if (savedWallpaper) {
        document.body.style.backgroundImage = `url('${savedWallpaper}')`;
    }
}

// Menghapus/Reset Semua Konfigurasi Web
function resetWebConfiguration() {
    if (confirm('Apakah Anda yakin ingin menghapus seluruh konfigurasi lokal web (logo, wallpaper, riwayat)?')) {
        localStorage.clear();
        document.getElementById('app-logo').src = 'https://via.placeholder.com/150x50?text=Logo+Perusahaan';
        document.body.style.backgroundImage = 'none';
        alert('Seluruh konfigurasi lokal berhasil dihapus!');
    }
}

// Inisialisasi awal
loadBrandingFromStorage();