// ==========================================
// KONFIGURASI SUPABASE
// ==========================================
const SUPABASE_URL = 'https://gyortxfcoifxzrwfogzr.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5b3J0eGZjb2lmeHpyd2ZvZ3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNzE2NzEsImV4cCI6MjEwNTc0NzY3MX0.dO07GyxM9WYRMHYOE70-nJQI_TONr7SXK7loXLRdkHU';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// KAMUS MULTI BAHASA (ID / EN)
// ==========================================
const translations = {
    id: {
        nav_home: "Beranda",
        nav_check_status: "Cek Status Approval",
        nav_admin_login: "Login Admin",
        nav_logout: "Logout",
        hero_title: "Selamat Datang di Portal Tamu",
        hero_subtitle: "Silakan daftarkan kunjungan Anda atau periksa status persetujuan yang telah didaftarkan.",
        btn_get_started: "Get Started",
        btn_check_status_hero: "Cek Status Tamu",
        reg_title: "Form Registrasi Kunjungan",
        lbl_fullname: "Nama Lengkap *",
        lbl_id_type: "Jenis ID *",
        lbl_id_number: "Nomor ID *",
        lbl_company: "Asal Instansi/Perusahaan *",
        lbl_manual_company: "Nama Instansi/Perusahaan (Manual) *",
        lbl_purpose: "Keperluan / Tujuan Kunjungan *",
        btn_submit_registration: "Kirim Registrasi Tamu",
        reg_success_title: "Registrasi Berhasil!",
        reg_success_desc: "Simpan Nomor Registrasi berikut untuk pemeriksaan status approval:",
        btn_copy_reg: "Salin Nomor ID",
        status_check_title: "Cek Status Approval Tamu",
        status_check_subtitle: "Masukkan Nomor Registrasi / ID Tamu yang Anda dapatkan saat mendaftar.",
        btn_search: "Periksa"
    },
    en: {
        nav_home: "Home",
        nav_check_status: "Check Approval Status",
        nav_admin_login: "Admin Login",
        nav_logout: "Logout",
        hero_title: "Welcome to Guest Portal",
        hero_subtitle: "Please register your visit or check the approval status of your registration.",
        btn_get_started: "Get Started",
        btn_check_status_hero: "Check Guest Status",
        reg_title: "Visit Registration Form",
        lbl_fullname: "Full Name *",
        lbl_id_type: "ID Type *",
        lbl_id_number: "ID Number *",
        lbl_company: "Company / Institution *",
        lbl_manual_company: "Company Name (Manual) *",
        lbl_purpose: "Purpose of Visit *",
        btn_submit_registration: "Submit Guest Registration",
        reg_success_title: "Registration Successful!",
        reg_success_desc: "Keep this Registration Number to check your approval status:",
        btn_copy_reg: "Copy ID Number",
        status_check_title: "Check Guest Approval Status",
        status_check_subtitle: "Enter the Registration Number / Guest ID you received when registering.",
        btn_search: "Search"
    }
};

let currentLang = 'id';

function changeLanguage(lang) {
    currentLang = lang;
    document.querySelectorAll('[data-i18n]').forEach(elem => {
        const key = elem.getAttribute('data-i18n');
        if (translations[lang][key]) {
            elem.textContent = translations[lang][key];
        }
    });
}

// ==========================================
// INISIALISASI BRANDING & APLIKASI
// ==========================================
async function initApp() {
    // Load App Settings dari Supabase
    const { data, error } = await supabaseClient
        .from('app_settings')
        .select('*')
        .eq('id', 1)
        .single();

    if (!error && data) {
        // Set Wallpaper
        document.body.style.backgroundImage = `url('${data.wallpaper_url}')`;
        // Set Logo
        document.getElementById('nav-logo').src = data.company_logo;

        // Populate Form Branding Admin
        document.getElementById('setting-logo-url').value = data.company_logo;
        document.getElementById('setting-wallpaper-url').value = data.wallpaper_url;
        document.getElementById('setting-companies').value = data.approved_companies ? data.approved_companies.join(', ') : '';

        // Populate Dropdown Perusahaan Tamu
        const companySelect = document.getElementById('guest-company-select');
        companySelect.innerHTML = '<option value="">-- Pilih Instansi/Perusahaan --</option>';
        if (data.approved_companies) {
            data.approved_companies.forEach(company => {
                companySelect.innerHTML += `<option value="${company}">${company}</option>`;
            });
        }
        companySelect.innerHTML += '<option value="Lainnya">Lainnya (Input Manual)</option>';
    }

    checkAdminSession();
}

// Helper SHA-256 Hashing untuk Password
async function hashPassword(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Navigasi Halaman
function showPage(pageId) {
    document.querySelectorAll('.page-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');

    if (pageId === 'admin-dashboard-page') {
        fetchAdminGuests();
    }
}

function scrollToForm() {
    showPage('guest-hero');
    document.getElementById('register-section').scrollIntoView({ behavior: 'smooth' });
}

function toggleManualCompany(val) {
    const manualGroup = document.getElementById('manual-company-group');
    if (val === 'Lainnya') {
        manualGroup.style.display = 'block';
        document.getElementById('guest-company-manual').required = true;
    } else {
        manualGroup.style.display = 'none';
        document.getElementById('guest-company-manual').required = false;
    }
}

// ==========================================
// REGISTRASI TAMU
// ==========================================
document.getElementById('guest-registration-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const nama = document.getElementById('guest-name').value;
    const jenisId = document.getElementById('guest-id-type').value;
    const nomorId = document.getElementById('guest-id-number').value;
    const selectCompany = document.getElementById('guest-company-select').value;
    const manualCompany = document.getElementById('guest-company-manual').value;
    const keperluan = document.getElementById('guest-purpose').value;

    const instansi = selectCompany === 'Lainnya' ? manualCompany : selectCompany;

    // Generate Registration Number (REG-YYYYMMDD-xxxx)
    const dateStr = new Date().toISOString().slice(0,10).replace(/-/g,"");
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const regNo = `REG-${dateStr}-${randomNum}`;

    const { error } = await supabaseClient
        .from('guests')
        .insert([{
            registration_no: regNo,
            nama: nama,
            jenis_id: jenisId,
            nomor_id: nomorId,
            instansi: instansi,
            keperluan: keperluan,
            status: 'Menunggu Akses'
        }]);

    if (error) {
        alert('Gagal mendaftar: ' + error.message);
    } else {
        document.getElementById('display-reg-no').textContent = regNo;
        document.getElementById('registration-success-card').style.display = 'block';
        document.getElementById('guest-registration-form').reset();
    }
});

function copyRegNo() {
    const regNo = document.getElementById('display-reg-no').textContent;
    navigator.clipboard.writeText(regNo);
    alert('Nomor Registrasi disalin ke clipboard!');
}

// ==========================================
// CEK STATUS APPROVAL TAMU
// ==========================================
document.getElementById('check-status-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const regNoInput = document.getElementById('search-reg-no').value.trim();

    const { data, error } = await supabaseClient
        .from('guests')
        .select('*')
        .eq('registration_no', regNoInput)
        .single();

    const banner = document.getElementById('status-result-banner');
    const badge = document.getElementById('banner-status-badge');
    const msg = document.getElementById('banner-status-message');

    if (error || !data) {
        banner.style.display = 'block';
        badge.className = 'badge badge-danger';
        badge.textContent = 'Tidak Ditemukan';
        document.getElementById('banner-guest-name').textContent = 'Data Tamu Tidak Ditemukan';
        document.getElementById('banner-reg-no').textContent = regNoInput;
        document.getElementById('banner-instansi').textContent = '-';
        document.getElementById('banner-keperluan').textContent = '-';
        msg.className = 'banner-message alert-danger';
        msg.textContent = 'Nomor Registrasi tidak terdaftar dalam sistem.';
        return;
    }

    banner.style.display = 'block';
    document.getElementById('banner-guest-name').textContent = data.nama;
    document.getElementById('banner-reg-no').textContent = data.registration_no;
    document.getElementById('banner-instansi').textContent = data.instansi;
    document.getElementById('banner-keperluan').textContent = data.keperluan;

    if (data.status === 'Diberikan Akses') {
        badge.className = 'badge badge-success';
        badge.textContent = 'DIBERIKAN AKSES';
        msg.className = 'banner-message badge-success';
        msg.innerHTML = '<i class="fa-solid fa-circle-check"></i> Akses Disetujui! Silakan tunjukkan nomor registrasi ini kepada Petugas Resepsionis / Security.';
    } else if (data.status === 'Ditolak') {
        badge.className = 'badge badge-danger';
        badge.textContent = 'DITOLAK';
        msg.className = 'banner-message alert-danger';
        msg.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Mohon maaf, permohonan akses Anda ditolak.';
    } else {
        badge.className = 'badge badge-warning';
        badge.textContent = 'MENUNGGU AKSES';
        msg.className = 'banner-message badge-warning';
        msg.innerHTML = '<i class="fa-solid fa-clock"></i> Permohonan Anda sedang dalam proses peninjauan oleh Administrator.';
    }
});

// ==========================================
// AUTENTIKASI ADMIN
// ==========================================
document.getElementById('admin-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const errorMsg = document.getElementById('login-error-msg');

    const hashed = await hashPassword(password);

    const { data, error } = await supabaseClient
        .from('admin_users')
        .select('*')
        .eq('username', username)
        .eq('password_hash', hashed)
        .single();

    if (error || !data) {
        errorMsg.style.display = 'block';
        errorMsg.textContent = 'Username atau Password salah!';
    } else {
        errorMsg.style.display = 'none';
        sessionStorage.setItem('admin_session', JSON.stringify(data));
        checkAdminSession();
        showPage('admin-dashboard-page');
    }
});

function checkAdminSession() {
    const session = sessionStorage.getItem('admin_session');
    if (session) {
        document.getElementById('nav-login-btn').style.display = 'none';
        document.getElementById('nav-logout-btn').style.display = 'inline-block';
    } else {
        document.getElementById('nav-login-btn').style.display = 'inline-block';
        document.getElementById('nav-logout-btn').style.display = 'none';
    }
}

function logoutAdmin() {
    sessionStorage.removeItem('admin_session');
    checkAdminSession();
    showPage('guest-hero');
}

// ==========================================
// MANAGEMENT ADMIN & STATUS APPROVAL
// ==========================================
async function fetchAdminGuests() {
    const tbody = document.getElementById('admin-guests-tbody');
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
    data.forEach(guest => {
        const date = new Date(guest.created_at).toLocaleString('id-ID');
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td>${date}</td>
            <td><strong>${guest.registration_no}</strong></td>
            <td>${guest.nama}</td>
            <td>${guest.jenis_id}: ${guest.nomor_id}</td>
            <td>${guest.instansi}</td>
            <td>${guest.keperluan}</td>
            <td><span class="badge ${guest.status === 'Diberikan Akses' ? 'badge-success' : (guest.status === 'Ditolak' ? 'badge-danger' : 'badge-warning')}">${guest.status}</span></td>
            <td>
                <button onclick="updateGuestStatus('${guest.id}', 'Diberikan Akses')" class="btn-primary btn-sm"><i class="fa-solid fa-check"></i> Setujui</button>
                <button onclick="updateGuestStatus('${guest.id}', 'Ditolak')" class="btn-danger btn-sm"><i class="fa-solid fa-xmark"></i> Tolak</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function updateGuestStatus(id, newStatus) {
    const { error } = await supabaseClient
        .from('guests')
        .update({ status: newStatus })
        .eq('id', id);

    if (!error) fetchAdminGuests();
}

// BRANDING UPDATE
document.getElementById('branding-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const logoUrl = document.getElementById('setting-logo-url').value;
    const wallpaperUrl = document.getElementById('setting-wallpaper-url').value;
    const companiesStr = document.getElementById('setting-companies').value;
    const companiesArray = companiesStr.split(',').map(s => s.trim()).filter(s => s.length > 0);

    const { error } = await supabaseClient
        .from('app_settings')
        .update({
            company_logo: logoUrl,
            wallpaper_url: wallpaperUrl,
            approved_companies: companiesArray
        })
        .eq('id', 1);

    if (!error) {
        alert('Branding dan pengaturan berhasil diperbarui!');
        initApp();
    } else {
        alert('Gagal update branding: ' + error.message);
    }
});

// MODAL CONTROLS & ADD ADMIN / RESET PASSWORD
function showAddAdminModal() { document.getElementById('modal-add-admin').style.display = 'flex'; }
function showResetPasswordModal() { document.getElementById('modal-reset-password').style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

document.getElementById('add-admin-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('new-admin-name').value;
    const username = document.getElementById('new-admin-username').value;
    const password = document.getElementById('new-admin-password').value;
    const hashed = await hashPassword(password);

    const { error } = await supabaseClient
        .from('admin_users')
        .insert([{ nama_lengkap: name, username: username, password_hash: hashed }]);

    if (!error) {
        alert('Akun admin baru berhasil ditambahkan!');
        closeModal('modal-add-admin');
        document.getElementById('add-admin-form').reset();
    } else {
        alert('Gagal menambahkan admin: ' + error.message);
    }
});

document.getElementById('reset-password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('reset-username').value;
    const newPassword = document.getElementById('reset-new-password').value;
    const hashed = await hashPassword(newPassword);

    const { error } = await supabaseClient
        .from('admin_users')
        .update({ password_hash: hashed })
        .eq('username', username);

    if (!error) {
        alert('Password admin berhasil di-reset!');
        closeModal('modal-reset-password');
        document.getElementById('reset-password-form').reset();
    } else {
        alert('Gagal reset password: ' + error.message);
    }
});

// Inisialisasi awal
initApp();