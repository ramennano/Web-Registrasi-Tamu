// ==========================================
// KONFIGURASI SUPABASE
// ==========================================
const SUPABASE_URL = 'https://gyortxfcoifxzrwfogzr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5b3J0eGZjb2lmeHpyd2ZvZ3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNzE2NzEsImV4cCI6MjEwNTc0NzY3MX0.dO07GyxM9WYRMHYOE70-nJQI_TONr7SXK7loXLRdkHU';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// State Aplikasi
let currentLang = 'id';
let currentAdminUser = null;

// ==========================================
// DICTIONARY DUA BAHASA (ID & EN)
// ==========================================
const translations = {
    id: {
        navHome: "Beranda",
        navGuest: "Dashboard Tamu",
        navLogin: "Login Admin",
        navLogout: "Logout",
        welcomeTitle: "Selamat Datang di Portal Tamu Perusahaan",
        welcomeDesc: "Silakan daftar kunjungan Anda atau periksa status persetujuan akses yang telah diajukan.",
        btnGetStarted: "Get Started (Registrasi Tamu)",
        btnCheckStatus: "Cek Status Approve Tamu",
        checkStatusTitle: "🔍 Periksa Status Persetujuan Tamu",
        checkStatusSub: "Masukkan Nomor Registrasi / ID Tamu Anda di bawah ini:",
        btnCheck: "Cek Status",
        regFormTitle: "Formulir Registrasi Kunjungan Tamu",
        lblFullName: "Nama Lengkap",
        lblIdType: "Jenis ID",
        lblIdNumber: "Nomor ID / Identitas",
        lblInstansiType: "Kategori Asal Instansi/Perusahaan",
        optApproved: "Pilih dari Daftar PT Disetujui",
        optManual: "Input Manual Nama Perusahaan",
        lblApprovedCompany: "Daftar Perusahaan Disetujui",
        lblManualCompany: "Nama Instansi / Perusahaan (Manual)",
        lblPurpose: "Keperluan / Tujuan Kunjungan",
        btnSubmitReg: "Kirim Pendaftaran Tamu",
        adminLoginTitle: "Login Administrator",
        adminLoginSub: "Masuk dengan Username & Password admin Anda",
        lblUsername: "Username",
        lblPassword: "Password",
        btnLogin: "Login Admin",
        adminDashTitle: "Panel Kontrol Administrator",
        tabGuests: "Daftar Tamu",
        tabCompanies: "Master PT Disetujui",
        tabUsers: "Akun Admin & Password",
        tabBranding: "Logo & Wallpaper",
        titleGuestList: "Daftar Permohonan & Kunjungan Tamu",
        titleAddCompany: "Tambah Nama PT / Instansi yang Disetujui",
        btnAddCompany: "Tambah PT",
        titleCompanyList: "Daftar PT Terdaftar",
        titleAddAdmin: "Tambah Akun Login Admin Baru",
        lblNewUsername: "Username Baru",
        lblNewPassword: "Password Baru",
        btnAddAdmin: "Buat Akun Admin",
        titleResetPass: "Reset Password Akun Admin",
        lblSelectAdmin: "Pilih Akun Admin",
        lblResetPass: "Password Baru",
        btnResetPass: "Reset Password",
        titleBranding: "Pengaturan Logo & Wallpaper Website",
        descBranding: "Unggah gambar dari komputer/perangkat lokal Anda untuk mengubah tampilan website.",
        lblLogoUpload: "Upload Logo Perusahaan",
        lblBgUpload: "Upload Wallpaper Background",
        btnResetBranding: "Reset ke Tampilan Default"
    },
    en: {
        navHome: "Home",
        navGuest: "Guest Dashboard",
        navLogin: "Admin Login",
        navLogout: "Logout",
        welcomeTitle: "Welcome to Company Guest Portal",
        welcomeDesc: "Please register your visit or check your approved access status.",
        btnGetStarted: "Get Started (Guest Registration)",
        btnCheckStatus: "Check Guest Approval Status",
        checkStatusTitle: "🔍 Check Guest Approval Status",
        checkStatusSub: "Enter your Registration Number / Guest ID below:",
        btnCheck: "Check Status",
        regFormTitle: "Guest Visit Registration Form",
        lblFullName: "Full Name",
        lblIdType: "ID Type",
        lblIdNumber: "ID Number",
        lblInstansiType: "Company / Institution Category",
        optApproved: "Select from Approved PT List",
        optManual: "Manual Company Input",
        lblApprovedCompany: "Approved Company List",
        lblManualCompany: "Company / Institution Name (Manual)",
        lblPurpose: "Purpose of Visit",
        btnSubmitReg: "Submit Registration",
        adminLoginTitle: "Administrator Login",
        adminLoginSub: "Log in using your admin Username & Password",
        lblUsername: "Username",
        lblPassword: "Password",
        btnLogin: "Login",
        adminDashTitle: "Administrator Control Panel",
        tabGuests: "Guest List",
        tabCompanies: "Approved PT Master",
        tabUsers: "Admin Accounts & Passwords",
        tabBranding: "Logo & Wallpaper",
        titleGuestList: "Guest Request & Visit List",
        titleAddCompany: "Add Approved Company / PT Name",
        btnAddCompany: "Add PT",
        titleCompanyList: "Registered PT List",
        titleAddAdmin: "Add New Admin Account",
        lblNewUsername: "New Username",
        lblNewPassword: "New Password",
        btnAddAdmin: "Create Admin Account",
        titleResetPass: "Reset Admin Password",
        lblSelectAdmin: "Select Admin Account",
        lblResetPass: "New Password",
        btnResetPass: "Reset Password",
        titleBranding: "Website Logo & Wallpaper Settings",
        descBranding: "Upload images from your local computer to customize the website branding.",
        lblLogoUpload: "Upload Company Logo",
        lblBgUpload: "Upload Wallpaper Background",
        btnResetBranding: "Reset to Default View"
    }
};

// Bahasa Switcher
function setLanguage(lang) {
    currentLang = lang;
    document.getElementById('btn-lang-id').classList.toggle('active', lang === 'id');
    document.getElementById('btn-lang-en').classList.toggle('active', lang === 'en');

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });
}

// ==========================================
// NAVIGASI HALAMAN & TABS
// ==========================================
function showPage(pageId) {
    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');

    if (pageId === 'guest-dashboard') {
        loadApprovedCompanies();
    } else if (pageId === 'admin-dashboard') {
        if (!currentAdminUser) {
            showPage('login-page');
            return;
        }
        loadAdminData();
    }
}

function focusCheckStatus() {
    showPage('guest-dashboard');
    document.getElementById('check-reg-input').focus();
}

function switchAdminTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));

    event.target.classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

// ==========================================
// REGISTRASI & CEK STATUS TAMU
// ==========================================
function toggleInstansiInput() {
    const type = document.getElementById('instansi-type-select').value;
    document.getElementById('approved-company-group').style.display = type === 'approved' ? 'block' : 'none';
    document.getElementById('manual-company-group').style.display = type === 'manual' ? 'block' : 'none';
}

async function loadApprovedCompanies() {
    const select = document.getElementById('guest-company-select');
    const { data, error } = await supabaseClient.from('approved_companies').select('*').order('name');
    
    if (!error && data) {
        select.innerHTML = '<option value="">-- Pilih Perusahaan / PT --</option>';
        data.forEach(c => {
            select.innerHTML += `<option value="${c.name}">${c.name}</option>`;
        });
    }
}

// Registrasi Tamu
document.getElementById('guest-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const messageBox = document.getElementById('guest-form-message');

    const name = document.getElementById('guest-name').value;
    const idType = document.getElementById('guest-id-type').value;
    const idNum = document.getElementById('guest-id-num').value;
    const instansiType = document.getElementById('instansi-type-select').value;
    
    let instansi = instansiType === 'approved' 
        ? document.getElementById('guest-company-select').value 
        : document.getElementById('guest-company-manual').value;

    if (!instansi) {
        alert(currentLang === 'id' ? 'Silakan pilih atau isi instansi perusahaan Anda.' : 'Please select or enter your company name.');
        return;
    }

    const purpose = document.getElementById('guest-purpose').value;
    const regNum = 'REG-' + Math.floor(100000 + Math.random() * 900000);

    const { error } = await supabaseClient.from('guests').insert([{
        reg_number: regNum,
        nama: name,
        jenis_id: idType,
        no_id: idNum,
        instansi_type: instansiType,
        instansi: instansi,
        keperluan: purpose,
        status: 'Menunggu Akses'
    }]);

    if (error) {
        messageBox.className = 'alert-box error';
        messageBox.style.display = 'block';
        messageBox.textContent = currentLang === 'id' ? 'Gagal pendaftaran: ' + error.message : 'Registration failed: ' + error.message;
    } else {
        messageBox.className = 'alert-box success';
        messageBox.style.display = 'block';
        messageBox.innerHTML = currentLang === 'id' 
            ? `<strong>Registrasi Berhasil!</strong><br>Nomor Registrasi Tamu Anda: <b>${regNum}</b><br>Simpan nomor ini untuk mengecek status akses Anda.`
            : `<strong>Registration Successful!</strong><br>Your Registration ID: <b>${regNum}</b><br>Save this ID to check your access status.`;
        
        document.getElementById('guest-form').reset();
        document.getElementById('check-reg-input').value = regNum;
    }
});

// Cek Status Tamu berdasarkan No Registrasi
async function checkGuestStatus() {
    const regInput = document.getElementById('check-reg-input').value.trim();
    const resultBox = document.getElementById('status-result-box');

    if (!regInput) {
        alert(currentLang === 'id' ? 'Masukkan Nomor Registrasi / ID Tamu' : 'Please enter Registration ID');
        return;
    }

    const { data, error } = await supabaseClient
        .from('guests')
        .select('*')
        .eq('reg_number', regInput)
        .single();

    resultBox.style.display = 'block';

    if (error || !data) {
        resultBox.className = 'status-result status-rejected';
        resultBox.innerHTML = currentLang === 'id' 
            ? `❌ <b>Data tidak ditemukan!</b> Silakan periksa kembali Nomor Registrasi / ID Tamu Anda.` 
            : `❌ <b>Record not found!</b> Please check your Registration ID.`;
        return;
    }

    let statusClass = 'status-pending';
    let statusText = data.status;

    if (data.status === 'Diberikan Akses') statusClass = 'status-granted';
    else if (data.status === 'Ditolak') statusClass = 'status-rejected';

    resultBox.className = `status-result ${statusClass}`;
    resultBox.innerHTML = `
        <p><strong>Status Akses:</strong> <span class="badge">${statusText}</span></p>
        <p><strong>No Registrasi:</strong> ${data.reg_number}</p>
        <p><strong>Nama Tamu:</strong> ${data.nama}</p>
        <p><strong>Asal Instansi:</strong> ${data.instansi}</p>
        <p><strong>Keperluan:</strong> ${data.keperluan}</p>
    `;
}

// ==========================================
// MANAJEMEN ADMIN (LOGIN, AKUN & RESET PASS)
// ==========================================
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = document.getElementById('admin-username').value;
    const pass = document.getElementById('admin-password').value;
    const msgBox = document.getElementById('login-message');

    const { data, error } = await supabaseClient
        .from('admin_users')
        .select('*')
        .eq('username', user)
        .eq('password_text', pass)
        .single();

    if (error || !data) {
        msgBox.style.display = 'block';
        msgBox.textContent = currentLang === 'id' ? 'Username atau password admin salah!' : 'Invalid username or password!';
    } else {
        msgBox.style.display = 'none';
        currentAdminUser = data.username;
        document.getElementById('nav-login-btn').style.display = 'none';
        document.getElementById('nav-logout-btn').style.display = 'inline-block';
        document.getElementById('login-form').reset();
        showPage('admin-dashboard');
    }
});

function logoutAdmin() {
    currentAdminUser = null;
    document.getElementById('nav-login-btn').style.display = 'inline-block';
    document.getElementById('nav-logout-btn').style.display = 'none';
    showPage('landing-page');
}

// Load Semua Data Admin Tab
async function loadAdminData() {
    fetchGuestList();
    fetchCompanyList();
    fetchAdminList();
}

// 1. Fetch Tamu
async function fetchGuestList() {
    const tbody = document.getElementById('admin-guests-tbody');
    tbody.innerHTML = '<tr><td colspan="8">Memuat data tamu...</td></tr>';

    const { data } = await supabaseClient.from('guests').select('*').order('created_at', { ascending: false });

    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8">Belum ada pendaftaran tamu.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    data.forEach(g => {
        const date = new Date(g.created_at).toLocaleString('id-ID');
        const tr = document.createElement('tr');
        
        let actionBtns = `
            <button onclick="updateGuestStatus('${g.id}', 'Diberikan Akses')" class="btn-primary" style="padding:0.3rem 0.6rem; font-size:0.8rem;">Setujui</button>
            <button onclick="updateGuestStatus('${g.id}', 'Ditolak')" class="btn-danger" style="padding:0.3rem 0.6rem; font-size:0.8rem;">Tolak</button>
        `;

        tr.innerHTML = `
            <td><b>${g.reg_number}</b></td>
            <td>${date}</td>
            <td>${g.nama}</td>
            <td>${g.jenis_id} - ${g.no_id}</td>
            <td>${g.instansi} (${g.instansi_type})</td>
            <td>${g.keperluan}</td>
            <td><b>${g.status}</b></td>
            <td>${actionBtns}</td>
        `;
        tbody.appendChild(tr);
    });
}

async function updateGuestStatus(id, newStatus) {
    await supabaseClient.from('guests').update({ status: newStatus }).eq('id', id);
    fetchGuestList();
}

// 2. Fetch & Tambah PT
async function fetchCompanyList() {
    const list = document.getElementById('company-list-group');
    const { data } = await supabaseClient.from('approved_companies').select('*').order('name');
    
    list.innerHTML = '';
    if (data) {
        data.forEach(c => {
            list.innerHTML += `
                <li>
                    <span>${c.name}</span>
                    <button onclick="deleteCompany('${c.id}')" class="btn-danger" style="padding:0.25rem 0.5rem; font-size:0.8rem;">Hapus</button>
                </li>
            `;
        });
    }
}

document.getElementById('add-company-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('new-company-name').value;
    await supabaseClient.from('approved_companies').insert([{ name }]);
    document.getElementById('new-company-name').value = '';
    fetchCompanyList();
});

async function deleteCompany(id) {
    await supabaseClient.from('approved_companies').delete().eq('id', id);
    fetchCompanyList();
}

// 3. Tambah & Reset Pass Admin
async function fetchAdminList() {
    const select = document.getElementById('reset-admin-select');
    const { data } = await supabaseClient.from('admin_users').select('*').order('username');
    
    select.innerHTML = '';
    if (data) {
        data.forEach(u => {
            select.innerHTML += `<option value="${u.id}">${u.username}</option>`;
        });
    }
}

document.getElementById('add-admin-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('new-admin-user').value;
    const password_text = document.getElementById('new-admin-pass').value;

    const { error } = await supabaseClient.from('admin_users').insert([{ username, password_text }]);
    if (error) alert('Gagal menambah admin: ' + error.message);
    else {
        alert('Akun Admin berhasil dibuat!');
        document.getElementById('add-admin-form').reset();
        fetchAdminList();
    }
});

document.getElementById('reset-password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('reset-admin-select').value;
    const newPass = document.getElementById('reset-admin-pass').value;

    const { error } = await supabaseClient.from('admin_users').update({ password_text: newPass }).eq('id', id);
    if (error) alert('Gagal reset password: ' + error.message);
    else {
        alert('Password admin berhasil diperbarui!');
        document.getElementById('reset-password-form').reset();
    }
});

// ==========================================
// BRANDING (UPLOAD LOGO & WALLPAPER LOKAL)
// ==========================================
function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
            const base64Img = event.target.result;
            document.getElementById('logo-preview').src = base64Img;
            document.getElementById('logo-preview').style.display = 'block';
            saveBrandingSetting('logo', base64Img);
        };
        reader.readAsDataURL(file);
    }
}

function handleWallpaperUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
            const base64Img = event.target.result;
            document.getElementById('bg-preview').src = base64Img;
            document.getElementById('bg-preview').style.display = 'block';
            saveBrandingSetting('wallpaper', base64Img);
        };
        reader.readAsDataURL(file);
    }
}

async function saveBrandingSetting(type, dataUrl) {
    const payload = type === 'logo' ? { logo_data: dataUrl } : { wallpaper_data: dataUrl };
    await supabaseClient.from('site_settings').update(payload).eq('id', 1);
    applyBranding();
}

async function applyBranding() {
    const { data } = await supabaseClient.from('site_settings').select('*').eq('id', 1).single();
    if (data) {
        if (data.logo_data) {
            const logoImg = document.getElementById('site-logo');
            logoImg.src = data.logo_data;
            logoImg.style.display = 'block';
            document.getElementById('logo-preview').src = data.logo_data;
            document.getElementById('logo-preview').style.display = 'block';
        }
        if (data.wallpaper_data) {
            document.body.style.backgroundImage = `url('${data.wallpaper_data}')`;
            document.getElementById('bg-preview').src = data.wallpaper_data;
            document.getElementById('bg-preview').style.display = 'block';
        }
    }
}

async function resetBranding() {
    await supabaseClient.from('site_settings').update({ logo_data: null, wallpaper_data: null }).eq('id', 1);
    document.getElementById('site-logo').style.display = 'none';
    document.body.style.backgroundImage = 'none';
    document.getElementById('logo-preview').style.display = 'none';
    document.getElementById('bg-preview').style.display = 'none';
    alert('Branding berhasil direset ke bawaan.');
}

// Inisialisasi awal
setLanguage('id');
applyBranding();