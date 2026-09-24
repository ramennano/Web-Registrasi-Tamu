// ==========================================
// KONFIGURASI SUPABASE (OPSIONAL / SINKRONISASI LOKAL)
// Hapus konfigurasi hardcoded lama. Ganti dengan nilai milik Anda bila menggunakan cloud Supabase.
// ==========================================
const SUPABASE_URL = 'https://gyortxfcoifxzrwfogzr.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5b3J0eGZjb2lmeHpyd2ZvZ3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNzE2NzEsImV4cCI6MjEwNTc0NzY3MX0.dO07GyxM9WYRMHYOE70-nJQI_TONr7SXK7loXLRdkHU';

let supabaseClient = null;
if (typeof supabase !== 'undefined' && SUPABASE_URL !== 'YOUR_SUPABASE_URL_HERE') {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Master Key untuk Reset Password (Dapat diubah)
const MASTER_SECURITY_KEY = "MASTER123";

// ==========================================
// MOCK DATASTORE (LOKAL JIKA SUPABASE OFF)
// ==========================================
let currentLang = 'id';
let currentAdminUser = null;

let localGuests = JSON.parse(localStorage.getItem('guests_db')) || [
    {
        id: 'GST-1001',
        nama: 'Budi Santoso',
        jenis_id: 'KTP',
        nomor_id: '3171012304950001',
        instansi: 'PT Teknologi Bangsa',
        keperluan: 'Audit Sistem',
        status: 'Diberikan Akses',
        created_at: new Date().toISOString()
    }
];

let localCompanies = JSON.parse(localStorage.getItem('companies_db')) || [
    'PT Bangun Bangsa',
    'PT Teknologi Nusantara',
    'CV Maju Bersama'
];

let localAdmins = JSON.parse(localStorage.getItem('admins_db')) || [
    { username: 'admin', password: 'admin123', nama: 'Admin Bawaan' }
];

function saveLocalData() {
    localStorage.setItem('guests_db', JSON.stringify(localGuests));
    localStorage.setItem('companies_db', JSON.stringify(localCompanies));
    localStorage.setItem('admins_db', JSON.stringify(localAdmins));
}

// ==========================================
// DICTIONARY MULTIBAHASA (ID & EN)
// ==========================================
const i18n = {
    id: {
        navHome: "Beranda",
        navCheckStatus: "Cek Status Tamu",
        navAdminLogin: "Login Admin",
        navLogout: "Logout",
        heroTitle: "Selamat Datang di Portal Tamu Perusahaan",
        heroSubtitle: "Silakan daftarkan kunjungan Anda untuk mendapatkan izin akses kunjungan.",
        btnGetStarted: "Get Started / Mulai Registrasi",
        regFormTitle: "Form Registrasi Tamu",
        regFormDesc: "Isi data diri Anda dengan lengkap. Kode ID Tamu akan diberikan setelah Anda mengirimkan form.",
        lblFullName: "Nama Lengkap",
        lblIdType: "Jenis ID Pengenal",
        lblIdNumber: "Nomor ID / Identitas",
        lblCompany: "Asal Instansi / Perusahaan",
        optSelectCompany: "-- Pilih Perusahaan Terdaftar --",
        optOtherCompany: "-- Input Manual / Lainnya --",
        lblManualCompany: "Nama Instansi/PT Manual",
        lblPurpose: "Keperluan Kunjungan",
        btnSubmitReg: "Kirim Permintaan Akses",
        statusPageTitle: "Cek Status & Dashboard Tamu",
        statusPageDesc: "Masukkan ID Tamu Anda yang didapatkan saat pendaftaran untuk mengecek persetujuan akses.",
        btnCheckStatus: "Cek Status",
        lblGuestId: "ID Tamu",
        lblStatus: "Status Persetujuan",
        adminLoginTitle: "Login Administrator",
        adminLoginDesc: "Login menggunakan Username/ID Admin dan Password.",
        lblUsername: "Username / ID Admin",
        lblPassword: "Password",
        btnLogin: "Login Admin",
        linkForgotPassword: "Lupa Password / Reset Password?",
        resetTitle: "Reset Password Admin",
        resetDesc: "Masukkan Username Admin dan Kunci Keamanan / Master Key untuk menyetel ulang password Anda.",
        lblMasterKey: "Master Key / Security Code",
        lblNewPassword: "Password Baru",
        btnResetPassword: "Setel Ulang Password",
        btnBackToLogin: "Kembali ke Login",
        adminDashTitle: "Dashboard Administrasi",
        tabGuestApproval: "Persetujuan Tamu",
        tabAddAdmin: "Tambah Akun Admin",
        tabManagePT: "Kelola PT Terdaftar",
        guestListTitle: "Daftar Permintaan Akses Tamu",
        thTime: "Waktu",
        thName: "Nama",
        thIdType: "Jenis ID",
        thCompany: "Instansi/PT",
        thPurpose: "Keperluan",
        thStatus: "Status",
        thAction: "Aksi",
        addAdminTitle: "Buat Akun Login Admin Baru (Tanpa Registrasi Email)",
        btnAddAdmin: "Buat Akun Admin",
        managePtTitle: "Kelola Daftar Perusahaan (PT) yang Disetujui",
        lblPtName: "Nama PT / Instansi Baru",
        btnAddPt: "Tambah PT ke Daftar",
        statusPending: "Menunggu Persetujuan",
        statusApproved: "Diberikan Akses",
        statusRejected: "Akses Ditolak",
        notifApproved: "AKSES DISETUJUI! Anda diperbolehkan masuk ke area perusahaan.",
        notifPending: "MENUNGGU PERSATUAN. Permintaan akses Anda sedang ditinjau admin.",
        notifRejected: "AKSES DITOLAK. Maaf, kunjungan Anda belum diizinkan."
    },
    en: {
        navHome: "Home",
        navCheckStatus: "Check Guest Status",
        navAdminLogin: "Admin Login",
        navLogout: "Logout",
        heroTitle: "Welcome to Corporate Guest Portal",
        heroSubtitle: "Please register your visit to obtain entrance approval.",
        btnGetStarted: "Get Started / Register Now",
        regFormTitle: "Guest Registration Form",
        regFormDesc: "Fill in your complete details. A Guest ID code will be provided after submitting.",
        lblFullName: "Full Name",
        lblIdType: "ID Type",
        lblIdNumber: "ID / Identity Number",
        lblCompany: "Company / Institution",
        optSelectCompany: "-- Select Approved Company --",
        optOtherCompany: "-- Manual Input / Other --",
        lblManualCompany: "Manual Company Name",
        lblPurpose: "Purpose of Visit",
        btnSubmitReg: "Submit Access Request",
        statusPageTitle: "Check Status & Guest Dashboard",
        statusPageDesc: "Enter your Guest ID obtained during registration to check approval status.",
        btnCheckStatus: "Check Status",
        lblGuestId: "Guest ID",
        lblStatus: "Approval Status",
        adminLoginTitle: "Administrator Login",
        adminLoginDesc: "Log in using Admin Username/ID and Password.",
        lblUsername: "Username / Admin ID",
        lblPassword: "Password",
        btnLogin: "Admin Login",
        linkForgotPassword: "Forgot / Reset Password?",
        resetTitle: "Reset Admin Password",
        resetDesc: "Enter Admin Username and Master Key to reset your password.",
        lblMasterKey: "Master Key / Security Code",
        lblNewPassword: "New Password",
        btnResetPassword: "Reset Password",
        btnBackToLogin: "Back to Login",
        adminDashTitle: "Admin Dashboard",
        tabGuestApproval: "Guest Approval",
        tabAddAdmin: "Add Admin Account",
        tabManagePT: "Manage Approved PTs",
        guestListTitle: "Guest Access Request List",
        thTime: "Time",
        thName: "Name",
        thIdType: "ID Type",
        thCompany: "Company",
        thPurpose: "Purpose",
        thStatus: "Status",
        thAction: "Action",
        addAdminTitle: "Create New Admin Account (No Email Registration Required)",
        btnAddAdmin: "Create Admin Account",
        managePtTitle: "Manage Approved Companies (PT)",
        lblPtName: "New Company / PT Name",
        btnAddPt: "Add PT to List",
        statusPending: "Pending Approval",
        statusApproved: "Access Granted",
        statusRejected: "Access Denied",
        notifApproved: "ACCESS GRANTED! You are allowed to enter the premises.",
        notifPending: "PENDING APPROVAL. Your access request is currently under review.",
        notifRejected: "ACCESS DENIED. Sorry, your visit has not been approved."
    }
};

// Fungsi Ganti Bahasa
function changeLanguage(lang) {
    currentLang = lang;
    document.getElementById('lang-id-btn').classList.toggle('active-lang', lang === 'id');
    document.getElementById('lang-en-btn').classList.toggle('active-lang', lang === 'en');

    document.querySelectorAll('[data-i18n]').forEach(elem => {
        const key = elem.getAttribute('data-i18n');
        if (i18n[lang][key]) {
            elem.textContent = i18n[lang][key];
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

    if (pageId === 'admin-dashboard') {
        fetchGuestsAdmin();
        renderCompanyList();
    }
}

function switchAdminTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    event.target.classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

// Tampilkan / sembunyikan input manual PT
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

// Populate Dropdown PT
function populateCompanyDropdown() {
    const select = document.getElementById('guest-company-select');
    // Hapus opsi yang lama kecuali yang paling atas dan MANUAL
    select.innerHTML = `
        <option value="" disabled selected data-i18n="optSelectCompany">${i18n[currentLang].optSelectCompany}</option>
        <option value="MANUAL" data-i18n="optOtherCompany">${i18n[currentLang].optOtherCompany}</option>
    `;

    localCompanies.forEach(company => {
        const opt = document.createElement('option');
        opt.value = company;
        opt.textContent = company;
        select.insertBefore(opt, select.lastElementChild);
    });
}

// ==========================================
// LOGIKA TAMU (REGISTRASI & STATUS)
// ==========================================
document.getElementById('guest-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const name = document.getElementById('guest-name').value;
    const idType = document.getElementById('guest-id-type').value;
    const idNumber = document.getElementById('guest-id-number').value;
    const companySelect = document.getElementById('guest-company-select').value;
    const companyManual = document.getElementById('guest-company-manual').value;
    const purpose = document.getElementById('guest-purpose').value;
    
    const finalCompany = (companySelect === 'MANUAL') ? companyManual : companySelect;
    const newGuestId = 'GST-' + Math.floor(100000 + Math.random() * 900000);

    const newGuest = {
        id: newGuestId,
        nama: name,
        jenis_id: idType,
        nomor_id: idNumber,
        instansi: finalCompany,
        keperluan: purpose,
        status: 'Menunggu Persetujuan',
        created_at: new Date().toISOString()
    };

    localGuests.unshift(newGuest);
    saveLocalData();

    const msg = document.getElementById('guest-message');
    msg.className = 'message success';
    msg.innerHTML = `Registrasi Berhasil! Simpan ID Tamu Anda: <strong>${newGuestId}</strong>`;
    
    document.getElementById('guest-form').reset();
    document.getElementById('manual-company-group').style.display = 'none';
});

function checkGuestStatus() {
    const searchId = document.getElementById('search-guest-id').value.trim();
    const guestCard = document.getElementById('guest-status-result');
    const banner = document.getElementById('approval-notification-banner');

    const guest = localGuests.find(g => g.id.toUpperCase() === searchId.toUpperCase());

    if (!guest) {
        alert('ID Tamu tidak ditemukan!');
        guestCard.style.display = 'none';
        return;
    }

    guestCard.style.display = 'block';
    document.getElementById('res-guest-id').textContent = guest.id;
    document.getElementById('res-guest-name').textContent = guest.nama;
    document.getElementById('res-guest-company').textContent = guest.instansi;
    document.getElementById('res-guest-purpose').textContent = guest.keperluan;
    document.getElementById('res-guest-status').textContent = guest.status;

    if (guest.status === 'Diberikan Akses') {
        banner.className = 'notification-banner approved';
        banner.textContent = i18n[currentLang].notifApproved;
    } else if (guest.status === 'Akses Ditolak') {
        banner.className = 'notification-banner rejected';
        banner.textContent = i18n[currentLang].notifRejected;
    } else {
        banner.className = 'notification-banner pending';
        banner.textContent = i18n[currentLang].notifPending;
    }
}

// ==========================================
// LOGIKA ADMIN & MANAJEMEN AKUN
// ==========================================
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const user = document.getElementById('admin-username').value.trim();
    const pass = document.getElementById('admin-password').value.trim();
    const msg = document.getElementById('login-message');

    const found = localAdmins.find(a => a.username === user && a.password === pass);

    if (found) {
        currentAdminUser = found;
        msg.style.display = 'none';
        document.getElementById('nav-login-btn').style.display = 'none';
        document.getElementById('nav-logout-btn').style.display = 'inline-block';
        document.getElementById('login-form').reset();
        showPage('admin-dashboard');
    } else {
        msg.style.display = 'block';
        msg.textContent = 'Username atau Password Admin salah!';
    }
});

function logoutAdmin() {
    currentAdminUser = null;
    document.getElementById('nav-login-btn').style.display = 'inline-block';
    document.getElementById('nav-logout-btn').style.display = 'none';
    showPage('guest-landing');
}

// Fitur Reset Password
document.getElementById('reset-password-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('reset-username').value.trim();
    const masterKey = document.getElementById('reset-master-key').value.trim();
    const newPass = document.getElementById('reset-new-password').value.trim();
    const msg = document.getElementById('reset-message');

    if (masterKey !== MASTER_SECURITY_KEY) {
        msg.className = 'message error';
        msg.textContent = 'Master Key / Security Code salah!';
        return;
    }

    const adminIndex = localAdmins.findIndex(a => a.username === username);
    if (adminIndex === -1) {
        msg.className = 'message error';
        msg.textContent = 'Username Admin tidak ditemukan!';
        return;
    }

    localAdmins[adminIndex].password = newPass;
    saveLocalData();

    msg.className = 'message success';
    msg.textContent = 'Password berhasil direset! Silakan kembali ke halaman login.';
    document.getElementById('reset-password-form').reset();
});

// Fitur Tambah Admin Baru (Tanpa Registrasi Email)
document.getElementById('add-admin-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('new-admin-username').value.trim();
    const name = document.getElementById('new-admin-name').value.trim();
    const password = document.getElementById('new-admin-password').value.trim();
    const msg = document.getElementById('add-admin-message');

    if (localAdmins.some(a => a.username === username)) {
        msg.className = 'message error';
        msg.textContent = 'Username admin sudah digunakan!';
        return;
    }

    localAdmins.push({ username, password, nama: name });
    saveLocalData();

    msg.className = 'message success';
    msg.textContent = 'Akun Login Admin baru berhasil dibuat!';
    document.getElementById('add-admin-form').reset();
});

// ==========================================
// KELOLA PERSETUJUAN TAMU & DAFTAR PT
// ==========================================
function fetchGuestsAdmin() {
    const tbody = document.getElementById('guests-tbody');
    tbody.innerHTML = '';

    localGuests.forEach(guest => {
        const tr = document.createElement('tr');
        const date = new Date(guest.created_at).toLocaleString();

        tr.innerHTML = `
            <td><strong>${guest.id}</strong></td>
            <td>${date}</td>
            <td>${guest.nama}</td>
            <td>${guest.jenis_id} (${guest.nomor_id})</td>
            <td>${guest.instansi}</td>
            <td>${guest.keperluan}</td>
            <td><span class="status-badge">${guest.status}</span></td>
            <td>
                <button onclick="updateGuestStatus('${guest.id}', 'Diberikan Akses')" class="btn-approve">Setujui</button>
                <button onclick="updateGuestStatus('${guest.id}', 'Akses Ditolak')" class="btn-reject">Tolak</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function updateGuestStatus(guestId, status) {
    const guest = localGuests.find(g => g.id === guestId);
    if (guest) {
        guest.status = status;
        saveLocalData();
        fetchGuestsAdmin();
    }
}

// Tambah PT Baru
document.getElementById('add-pt-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const ptName = document.getElementById('new-pt-name').value.trim();
    
    if (ptName && !localCompanies.includes(ptName)) {
        localCompanies.push(ptName);
        saveLocalData();
        renderCompanyList();
        populateCompanyDropdown();
        document.getElementById('add-pt-form').reset();
    }
});

function renderCompanyList() {
    const container = document.getElementById('pt-list-container');
    container.innerHTML = '';

    localCompanies.forEach((pt, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${pt}</span>
            <button onclick="deleteCompany(${index})" class="btn-reject">Hapus</button>
        `;
        container.appendChild(li);
    });
}

function deleteCompany(index) {
    localCompanies.splice(index, 1);
    saveLocalData();
    renderCompanyList();
    populateCompanyDropdown();
}

// Inisialisasi awal
saveLocalData();
populateCompanyDropdown();