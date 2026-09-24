// ==========================================
// KONFIGURASI SUPABASE
// ==========================================
const SUPABASE_URL = 'https://gyortxfcoifxzrwfogzr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5b3J0eGZjb2lmeHpyd2ZvZ3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNzE2NzEsImV4cCI6MjEwNTc0NzY3MX0.dO07GyxM9WYRMHYOE70-nJQI_TONr7SXK7loXLRdkHU';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// BILINGUAL DICTIONARY (ID & EN)
// ==========================================
let currentLang = 'id';
const i18n = {
    id: {
        navHome: "Beranda",
        navLogin: "Login Admin",
        navLogout: "Logout",
        welcomeTitle: "Selamat Datang di Portal Tamu",
        welcomeSub: "Silakan daftarkan kunjungan Anda atau periksa status persetujuan akses yang telah diajukan.",
        btnGetStarted: "Get Started (Registrasi Tamu)",
        btnCheckStatus: "Cek Status Approval",
        regTitle: "Formulir Pendaftaran Tamu",
        labelFullName: "Nama Lengkap",
        labelIdType: "Jenis ID Card",
        labelIdNum: "Nomor Identitas (ID)",
        labelCompanyType: "Asal Instansi/Perusahaan",
        selectCompany: "-- Pilih PT Terdaftar --",
        optionManual: "+ Input Manual Nama Perusahaan",
        labelManualCompany: "Masukkan Nama Instansi/PT Manual",
        labelPurpose: "Keperluan Kunjungan",
        btnRegisterSubmit: "Kirim Pendaftaran",
        btnBack: "Kembali",
        regSuccessTitle: "Registrasi Berhasil!",
        regSuccessSub: "Simpan Nomor Registrasi berikut untuk mengecek status approval Anda:",
        checkTitle: "Cek Status Approval Tamu",
        btnSearch: "Periksa Status",
        tabGuests: "Daftar Tamu",
        tabUsers: "Manajemen Akun",
        tabCompanies: "Kelola Nama PT",
        tabBranding: "Ubah Tampilan/Logo",
        guestListTitle: "Persetujuan Registrasi Tamu",
        loginTitle: "Login Administrator",
        btnLoginSubmit: "Masuk"
    },
    en: {
        navHome: "Home",
        navLogin: "Admin Login",
        navLogout: "Logout",
        welcomeTitle: "Welcome to Guest Portal",
        welcomeSub: "Please register your visit or check your access approval status.",
        btnGetStarted: "Get Started (Guest Registration)",
        btnCheckStatus: "Check Approval Status",
        regTitle: "Guest Registration Form",
        labelFullName: "Full Name",
        labelIdType: "ID Card Type",
        labelIdNum: "ID Number",
        labelCompanyType: "Company / Institution",
        selectCompany: "-- Select Registered Company --",
        optionManual: "+ Enter Company Name Manually",
        labelManualCompany: "Enter Manual Company Name",
        labelPurpose: "Purpose of Visit",
        btnRegisterSubmit: "Submit Registration",
        btnBack: "Back",
        regSuccessTitle: "Registration Successful!",
        regSuccessSub: "Save the following Registration Number to check your status:",
        checkTitle: "Check Guest Approval Status",
        btnSearch: "Search Status",
        tabGuests: "Guest List",
        tabUsers: "Account Management",
        tabCompanies: "Manage Companies",
        tabBranding: "Custom Branding/Logo",
        guestListTitle: "Guest Registration Approvals",
        loginTitle: "Administrator Login",
        btnLoginSubmit: "Sign In"
    }
};

function switchLanguage(lang) {
    currentLang = lang;
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`lang-${lang}`).classList.add('active');

    document.querySelectorAll('[data-i18n]').forEach(elem => {
        const key = elem.getAttribute('data-i18n');
        if (i18n[lang][key]) {
            elem.textContent = i18n[lang][key];
        }
    });
}

// ==========================================
// STATE MANAGEMENT & NAVIGATION
// ==========================================
let currentUser = null; // Stored user login session

function showSection(sectionId) {
    document.querySelectorAll('.page-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');

    if (sectionId === 'register-section') {
        loadApprovedCompanies();
    }
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(tb => tb.classList.remove('active'));

    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');

    if (tabId === 'tab-users') fetchAdminUsers();
    if (tabId === 'tab-companies') fetchCompanies();
}

// ==========================================
// LOGIKA REGISTRASI TAMU
// ==========================================
async function loadApprovedCompanies() {
    const select = document.getElementById('reg-company-select');
    select.innerHTML = `<option value="">${i18n[currentLang].selectCompany}</option>`;

    const { data, error } = await supabaseClient.from('approved_companies').select('*').order('nama_pt');
    if (!error && data) {
        data.forEach(pt => {
            const opt = document.createElement('option');
            opt.value = pt.nama_pt;
            opt.textContent = pt.nama_pt;
            select.appendChild(opt);
        });
    }

    const optManual = document.createElement('option');
    optManual.value = "MANUAL";
    optManual.textContent = i18n[currentLang].optionManual;
    select.appendChild(optManual);
}

function toggleManualCompany(val) {
    const group = document.getElementById('manual-company-group');
    group.style.display = (val === 'MANUAL') ? 'block' : 'none';
}

function generateRegNumber() {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `REG-${dateStr}-${randomNum}`;
}

document.getElementById('guest-register-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('reg-name').value;
    const idType = document.getElementById('reg-id-type').value;
    const idNum = document.getElementById('reg-id-num').value;
    const companySelect = document.getElementById('reg-company-select').value;
    const companyManual = document.getElementById('reg-company-manual').value;
    const purpose = document.getElementById('reg-purpose').value;

    let finalCompany = companySelect;
    let compType = 'terdaftar';

    if (companySelect === 'MANUAL') {
        finalCompany = companyManual;
        compType = 'manual';
    }

    if (!finalCompany) {
        alert('Silakan tentukan asal instansi/perusahaan!');
        return;
    }

    const regNum = generateRegNumber();

    const { error } = await supabaseClient.from('guests').insert([{
        reg_number: regNum,
        nama: name,
        jenis_id: idType,
        no_id: idNum,
        instansi_type: compType,
        instansi_nama: finalCompany,
        keperluan: purpose,
        status: 'Menunggu Akses'
    }]);

    if (error) {
        alert('Gagal mendaftar: ' + error.message);
    } else {
        document.getElementById('guest-register-form').reset();
        document.getElementById('manual-company-group').style.display = 'none';
        document.getElementById('display-reg-num').textContent = regNum;
        document.getElementById('reg-success-box').style.display = 'block';
    }
});

// ==========================================
// LOGIKA CEK STATUS APPROVAL TAMU
// ==========================================
async function checkGuestStatus() {
    const regInput = document.getElementById('search-reg-id').value.trim();
    if (!regInput) {
        alert('Masukkan Nomor Registrasi!');
        return;
    }

    const { data, error } = await supabaseClient
        .from('guests')
        .select('*')
        .eq('reg_number', regInput)
        .single();

    const card = document.getElementById('status-result-card');

    if (error || !data) {
        alert('Data registrasi tidak ditemukan! Periksa kembali nomor registrasi Anda.');
        card.style.display = 'none';
        return;
    }

    card.style.display = 'block';
    document.getElementById('res-reg-id').textContent = data.reg_number;
    document.getElementById('res-nama').textContent = data.nama;
    document.getElementById('res-id-type').textContent = data.jenis_id;
    document.getElementById('res-id-num').textContent = data.no_id;
    document.getElementById('res-instansi').textContent = data.instansi_nama;
    document.getElementById('res-purpose').textContent = data.keperluan;
    document.getElementById('res-date').textContent = new Date(data.created_at).toLocaleString('id-ID');

    const badge = document.getElementById('res-status-badge');
    const banner = document.getElementById('res-notif-banner');

    badge.className = 'status-pill';
    if (data.status === 'Disetujui') {
        badge.classList.add('status-disetujui');
        badge.textContent = 'DISETUJUI / DIBERI AKSES';
        banner.className = 'status-banner alert-box success';
        banner.textContent = '🎉 SELAMAT! Permintaan akses Anda telah DISETUI. Silakan menunjukkan bukti ini ke Resepsionis/SATPAM.';
    } else if (data.status === 'Ditolak') {
        badge.classList.add('status-ditolak');
        badge.textContent = 'DITOLAK';
        banner.className = 'status-banner alert-box error';
        banner.textContent = '❌ Mohon maaf, permintaan kunjungan Anda ditolak oleh Admin.';
    } else {
        badge.classList.add('status-menunggu');
        badge.textContent = 'MENUNGGU APPROVAL';
        banner.className = 'status-banner alert-box';
        banner.style.background = '#fef3c7';
        banner.style.color = '#92400e';
        banner.textContent = '⏳ Permintaan kunjungan Anda sedang diproses oleh Admin. Silakan cek berkala.';
    }
}

// ==========================================
// LOGIKA AUTENTIKASI ADMIN / SUPER ADMIN
// ==========================================
function openLoginModal() {
    document.getElementById('login-modal').style.display = 'flex';
}

function closeLoginModal() {
    document.getElementById('login-modal').style.display = 'none';
}

document.getElementById('login-admin-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const userInp = document.getElementById('login-username').value.trim();
    const passInp = document.getElementById('login-password').value.trim();
    const errBox = document.getElementById('login-error-msg');

    const { data, error } = await supabaseClient
        .from('admin_users')
        .select('*')
        .eq('username', userInp)
        .eq('password', passInp)
        .single();

    if (error || !data) {
        errBox.style.display = 'block';
        errBox.textContent = 'Username atau Password salah!';
    } else {
        currentUser = data;
        errBox.style.display = 'none';
        closeLoginModal();
        document.getElementById('login-admin-form').reset();
        
        // Update Nav UI
        document.getElementById('btn-login-modal').style.display = 'none';
        document.getElementById('btn-logout').style.display = 'inline-block';
        document.getElementById('user-role-badge').textContent = data.role.toUpperCase();

        // Show/Hide Super Admin Features
        const superBtns = document.querySelectorAll('.superadmin-only');
        superBtns.forEach(el => {
            el.style.display = (data.role === 'super_admin') ? 'inline-block' : 'none';
        });

        showSection('admin-dashboard-section');
        fetchDashboardGuests();
    }
});

function logoutAdmin() {
    currentUser = null;
    document.getElementById('btn-login-modal').style.display = 'inline-block';
    document.getElementById('btn-logout').style.display = 'none';
    showSection('landing-section');
}

// ==========================================
// LOGIKA DASHBOARD ADMIN (APPROVAL)
// ==========================================
async function fetchDashboardGuests() {
    const tbody = document.getElementById('admin-guest-tbody');
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
    data.forEach(item => {
        const tr = document.createElement('tr');
        
        let statusPill = `<span class="status-pill status-menunggu">Menunggu</span>`;
        if (item.status === 'Disetujui') statusPill = `<span class="status-pill status-disetujui">Disetujui</span>`;
        if (item.status === 'Ditolak') statusPill = `<span class="status-pill status-ditolak">Ditolak</span>`;

        let actions = `
            <button onclick="updateGuestStatus('${item.id}', 'Disetujui')" class="btn-submit" style="padding:4px 8px; font-size:0.8rem;">Approve</button>
            <button onclick="updateGuestStatus('${item.id}', 'Ditolak')" class="btn-danger" style="padding:4px 8px; font-size:0.8rem;">Tolak</button>
        `;

        tr.innerHTML = `
            <td><strong>${item.reg_number}</strong><br><small>${new Date(item.created_at).toLocaleString('id-ID')}</small></td>
            <td>${item.nama}<br><small>${item.jenis_id}: ${item.no_id}</small></td>
            <td>${item.instansi_nama} (${item.instansi_type})</td>
            <td>${item.keperluan}</td>
            <td>${statusPill}</td>
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

    if (!error) {
        fetchDashboardGuests();
    } else {
        alert('Gagal memperbarui status: ' + error.message);
    }
}

// ==========================================
// LOGIKA SUPER ADMIN (MANAJEMEN AKUN & RESET PASSWORD)
// ==========================================
async function fetchAdminUsers() {
    const tbody = document.getElementById('users-tbody');
    tbody.innerHTML = '<tr><td colspan="4">Memuat user...</td></tr>';

    const { data } = await supabaseClient.from('admin_users').select('*').order('created_at');
    tbody.innerHTML = '';

    if (data) {
        data.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${user.username}</td>
                <td>${user.nama_lengkap}</td>
                <td><span class="role-badge">${user.role}</span></td>
                <td>
                    <button onclick="resetPassword('${user.id}')" class="btn-nav">Reset Password</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
}

document.getElementById('add-user-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const u = document.getElementById('new-username').value.trim();
    const f = document.getElementById('new-fullname').value.trim();
    const p = document.getElementById('new-password').value.trim();
    const r = document.getElementById('new-role').value;

    const { error } = await supabaseClient.from('admin_users').insert([{
        username: u, nama_lengkap: f, password: p, role: r
    }]);

    if (error) {
        alert('Gagal menambah akun: ' + error.message);
    } else {
        alert('Akun baru berhasil dibuat!');
        document.getElementById('add-user-form').reset();
        fetchAdminUsers();
    }
});

async function resetPassword(userId) {
    const newPass = prompt('Masukkan password baru untuk akun ini:');
    if (!newPass) return;

    const { error } = await supabaseClient.from('admin_users').update({ password: newPass }).eq('id', userId);
    if (!error) {
        alert('Password berhasil di-reset!');
    } else {
        alert('Gagal mereset password.');
    }
}

// ==========================================
// LOGIKA SUPER ADMIN (KELOLA NAMA PT)
// ==========================================
async function fetchCompanies() {
    const tbody = document.getElementById('companies-tbody');
    tbody.innerHTML = '<tr><td colspan="2">Memuat data PT...</td></tr>';

    const { data } = await supabaseClient.from('approved_companies').select('*').order('nama_pt');
    tbody.innerHTML = '';

    if (data) {
        data.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.nama_pt}</td>
                <td><button onclick="deleteCompany('${item.id}')" class="btn-danger" style="padding: 2px 8px;">Hapus</button></td>
            `;
            tbody.appendChild(tr);
        });
    }
}

document.getElementById('add-company-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('new-company-name').value.trim();

    const { error } = await supabaseClient.from('approved_companies').insert([{ nama_pt: name }]);
    if (!error) {
        document.getElementById('add-company-form').reset();
        fetchCompanies();
    } else {
        alert('Gagal menambah PT: ' + error.message);
    }
});

async function deleteCompany(id) {
    if (!confirm('Yakin ingin menghapus PT ini?')) return;
    await supabaseClient.from('approved_companies').delete().eq('id', id);
    fetchCompanies();
}

// ==========================================
// LOGIKA SUPER ADMIN (KUSTOMISASI BRANDING LOGO & WALLPAPER)
// ==========================================
document.getElementById('upload-logo').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function (evt) {
        const base64Img = evt.target.result;
        applyLogo(base64Img);
        saveConfig('logo_url', base64Img);
    };
    reader.readAsDataURL(file);
});

document.getElementById('upload-wallpaper').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function (evt) {
        const base64Bg = evt.target.result;
        applyWallpaper(base64Bg);
        saveConfig('wallpaper_url', base64Bg);
    };
    reader.readAsDataURL(file);
});

function applyLogo(url) {
    const img = document.getElementById('nav-logo');
    if (url) {
        img.src = url;
        img.style.display = 'block';
    } else {
        img.style.display = 'none';
    }
}

function applyWallpaper(url) {
    if (url) {
        document.documentElement.style.setProperty('--bg-wallpaper-url', `url('${url}')`);
    } else {
        document.documentElement.style.setProperty('--bg-wallpaper-url', 'none');
    }
}

async function saveConfig(key, val) {
    await supabaseClient.from('site_config').upsert({ key: key, value: val, updated_at: new Date() });
}

async function loadSiteConfig() {
    const { data } = await supabaseClient.from('site_config').select('*');
    if (data) {
        data.forEach(item => {
            if (item.key === 'logo_url' && item.value) applyLogo(item.value);
            if (item.key === 'wallpaper_url' && item.value) applyWallpaper(item.value);
        });
    }
}

async function resetBrandingConfig() {
    if (!confirm('Yakin ingin meriset logo dan wallpaper kembali ke default?')) return;
    await saveConfig('logo_url', '');
    await saveConfig('wallpaper_url', '');
    applyLogo('');
    applyWallpaper('');
    alert('Tampilan berhasil direset!');
}

// Inisialisasi Aplikasi Saat Load
loadSiteConfig();