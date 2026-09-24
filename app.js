// ==========================================
// KONFIGURASI SUPABASE
// ==========================================
const SUPABASE_URL = 'https://gyortxfcoifxzrwfogzr.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5b3J0eGZjb2lmeHpyd2ZvZ3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNzE2NzEsImV4cCI6MjEwNTc0NzY3MX0.dO07GyxM9WYRMHYOE70-nJQI_TONr7SXK7loXLRdkHU';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// State Aplikasi
let currentLang = 'id';
let currentUserRole = null;

// DICTIONARY MULTI-BAHASA (ID / EN)
const translations = {
    id: {
        nav_home: 'Beranda',
        nav_login: 'Login Admin',
        nav_logout: 'Keluar',
        hero_title: 'Selamat Datang di Sistem Buku Tamu',
        hero_subtitle: 'Silakan daftarkan kunjungan Anda atau periksa status persetujuan registrasi secara cepat dan akurat.',
        btn_get_started: 'Get Started / Mulai',
        btn_check_status_quick: 'Cek Status Kunjungan',
        form_title: 'Form Registrasi Tamu',
        label_name: 'Nama Lengkap',
        label_id_type: 'Jenis ID Identitas',
        label_id_number: 'Nomor ID Identitas',
        label_company: 'Asal Instansi / Perusahaan',
        select_company_placeholder: '-- Pilih Instansi Terdaftar --',
        option_manual_input: '+ Input Manual Instansi',
        label_purpose: 'Keperluan Kunjungan',
        btn_register: 'Kirim Registrasi',
        check_title: 'Cek Status Approval Tamu',
        check_desc: 'Masukkan Nomor Registrasi / ID Tamu yang Anda dapatkan saat mendaftar.',
        btn_check: 'Periksa',
        dash_title: 'Dashboard Manajemen Kunjungan',
        tab_guest_list: 'Daftar Tamu',
        tab_companies: 'Kelola Instansi/PT',
        tab_add_user: 'Tambah Akun Admin',
        tab_branding: 'Konfigurasi Tampilan',
        btn_login_submit: 'Masuk',
        link_forgot_pass: 'Lupa Password? Reset Password'
    },
    en: {
        nav_home: 'Home',
        nav_login: 'Admin Login',
        nav_logout: 'Logout',
        hero_title: 'Welcome to Guest Management System',
        hero_subtitle: 'Please register your visit or verify your registration approval status quickly and accurately.',
        btn_get_started: 'Get Started',
        btn_check_status_quick: 'Check Visit Status',
        form_title: 'Guest Registration Form',
        label_name: 'Full Name',
        label_id_type: 'Identity ID Type',
        label_id_number: 'ID Number',
        label_company: 'Company / Institution',
        select_company_placeholder: '-- Select Registered Company --',
        option_manual_input: '+ Manual Company Entry',
        label_purpose: 'Purpose of Visit',
        btn_register: 'Submit Registration',
        check_title: 'Check Guest Approval Status',
        check_desc: 'Enter your Registration Number / Guest ID received during registration.',
        btn_check: 'Check Status',
        dash_title: 'Visit Management Dashboard',
        tab_guest_list: 'Guest List',
        tab_companies: 'Manage Companies',
        tab_add_user: 'Add Admin User',
        tab_branding: 'Branding & Theme',
        btn_login_submit: 'Login',
        link_forgot_pass: 'Forgot Password? Reset Password'
    }
};

// ==========================================
// INISIALISASI & NAVIGASI
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    loadAppSettings();
    loadApprovedCompanies();
    checkAuthSession();
});

function changeLanguage(lang) {
    currentLang = lang;
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });
}

function showPage(pageId) {
    document.querySelectorAll('.page-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}

function scrollToCheckStatus() {
    showPage('guest-portal');
    document.getElementById('check-status-section').scrollIntoView({ behavior: 'smooth' });
}

// ==========================================
// SETTINGS & BRANDING (SUPER ADMIN)
// ==========================================
async function loadAppSettings() {
    const { data, error } = await supabaseClient.from('app_settings').select('*').single();
    if (data) {
        document.getElementById('app-company-name').textContent = data.company_name;
        document.getElementById('set-company-name').value = data.company_name;

        if (data.logo_url) {
            const logoEl = document.getElementById('app-logo');
            logoEl.src = data.logo_url;
            logoEl.style.display = 'block';
        }
        if (data.wallpaper_url) {
            document.body.style.backgroundImage = `url('${data.wallpaper_url}')`;
        }
    }
}

// Preview Upload Gambar Lokal
function previewImage(input, previewId) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.getElementById(previewId);
            img.src = e.target.result;
            img.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

// Simpan Branding
document.getElementById('branding-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const compName = document.getElementById('set-company-name').value;
    const logoImg = document.getElementById('preview-logo').src;
    const wallpaperImg = document.getElementById('preview-wallpaper').src;

    const updates = { company_name: compName };
    if (logoImg && !logoImg.endsWith('#')) updates.logo_url = logoImg;
    if (wallpaperImg && !wallpaperImg.endsWith('#')) updates.wallpaper_url = wallpaperImg;

    const { error } = await supabaseClient.from('app_settings').update(updates).eq('id', 1);

    if (!error) {
        alert('Konfigurasi Tampilan Berhasil Disimpan!');
        loadAppSettings();
    } else {
        alert('Gagal Menyimpan Settings: ' + error.message);
    }
});

// ==========================================
// REGISTRASI TAMU & CEK STATUS
// ==========================================
async function loadApprovedCompanies() {
    const { data } = await supabaseClient.from('approved_companies').select('*');
    const select = document.getElementById('guest-company-select');
    
    // Reset options
    select.innerHTML = `
        <option value="">${translations[currentLang].select_company_placeholder}</option>
        <option value="MANUAL">${translations[currentLang].option_manual_input}</option>
    `;

    if (data) {
        data.forEach(comp => {
            const opt = document.createElement('option');
            opt.value = comp.company_name;
            opt.textContent = comp.company_name;
            select.appendChild(opt);
        });
    }
}

function toggleManualCompany(val) {
    const manualInput = document.getElementById('guest-company-manual');
    if (val === 'MANUAL') {
        manualInput.style.display = 'block';
        manualInput.required = true;
    } else {
        manualInput.style.display = 'none';
        manualInput.required = false;
    }
}

// Submit Registrasi Tamu
document.getElementById('guest-reg-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nama = document.getElementById('guest-nama').value;
    const jenisId = document.getElementById('guest-jenis-id').value;
    const noId = document.getElementById('guest-no-id').value;
    const selectComp = document.getElementById('guest-company-select').value;
    const manualComp = document.getElementById('guest-company-manual').value;
    const instansi = (selectComp === 'MANUAL') ? manualComp : selectComp;
    const keperluan = document.getElementById('guest-keperluan').value;

    // Generate Reg Code Unik (Contoh: REG-84920)
    const regCode = 'REG-' + Math.floor(10000 + Math.random() * 90000);

    const { error } = await supabaseClient.from('guests').insert([{
        reg_code: regCode,
        nama: nama,
        jenis_id: jenisId,
        no_id: noId,
        instansi: instansi,
        keperluan: keperluan,
        status: 'Pending'
    }]);

    const resBox = document.getElementById('reg-result');
    resBox.style.display = 'block';

    if (!error) {
        resBox.className = 'alert-box status-approved';
        resBox.innerHTML = `
            <strong>Registrasi Berhasil!</strong><br>
            Nomor Registrasi Anda: <b style="font-size:1.2rem; color:#2563eb;">${regCode}</b><br>
            <small>Simpan Nomor Registrasi Anda untuk memeriksa status approval.</small>
        `;
        document.getElementById('guest-reg-form').reset();
    } else {
        resBox.className = 'alert-box status-rejected';
        resBox.textContent = 'Gagal Pendaftaran: ' + error.message;
    }
});

// Cek Status Approval Tamu Berdasarkan Reg ID
async function checkGuestStatus() {
    const regCode = document.getElementById('check-reg-id').value.trim();
    const displayCard = document.getElementById('status-display-card');
    displayCard.style.display = 'block';

    if (!regCode) {
        displayCard.innerHTML = '<span style="color:red;">Masukkan Nomor Registrasi ID!</span>';
        return;
    }

    const { data, error } = await supabaseClient
        .from('guests')
        .select('*')
        .eq('reg_code', regCode)
        .single();

    if (error || !data) {
        displayCard.className = 'status-result-card status-rejected';
        displayCard.innerHTML = `<strong>Data Tamu Tidak Ditemukan!</strong><br>Periksa kembali nomor registrasi Anda.`;
        return;
    }

    let statusClass = 'status-pending';
    let statusNotice = 'Menunggu Persetujuan Admin';
    if (data.status === 'Approved') {
        statusClass = 'status-approved';
        statusNotice = '✅ AKSES DISETUJUI / APPROVED';
    } else if (data.status === 'Rejected') {
        statusClass = 'status-rejected';
        statusNotice = '❌ AKSES DITOLAK';
    } else if (data.status === 'Completed') {
        statusClass = 'status-approved';
        statusNotice = 'Kunjungan Selesai';
    }

    displayCard.className = `status-result-card ${statusClass}`;
    displayCard.innerHTML = `
        <h3>${statusNotice}</h3>
        <hr style="margin:10px 0;">
        <p><b>Nomor Reg:</b> ${data.reg_code}</p>
        <p><b>Nama Tamu:</b> ${data.nama}</p>
        <p><b>Instansi:</b> ${data.instansi}</p>
        <p><b>Keperluan:</b> ${data.keperluan}</p>
        <p><b>Waktu Daftar:</b> ${new Date(data.created_at).toLocaleString()}</p>
    `;
}

// ==========================================
// AUTHENTICATION & LOGIN MANAGEMENT
// ==========================================
function openLoginModal() { document.getElementById('login-modal').style.display = 'flex'; }
function closeLoginModal() { document.getElementById('login-modal').style.display = 'none'; }

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (!error) {
        closeLoginModal();
        checkAuthSession();
    } else {
        alert('Login Gagal: ' + error.message);
    }
});

async function checkAuthSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        document.getElementById('nav-login-btn').style.display = 'none';
        document.getElementById('nav-logout-btn').style.display = 'inline-block';

        // Fetch User Role
        const { data: roleData } = await supabaseClient
            .from('user_roles')
            .select('role')
            .eq('id', session.user.id)
            .single();

        currentUserRole = roleData ? roleData.role : 'admin';
        document.getElementById('current-user-role').textContent = `Role: ${currentUserRole.toUpperCase()}`;

        // Sembunyikan/Tampilkan Fitur Super Admin
        document.querySelectorAll('.superadmin-only').forEach(el => {
            el.style.display = (currentUserRole === 'superadmin') ? 'block' : 'none';
        });

        showPage('admin-dashboard');
        fetchGuestsList();
    } else {
        document.getElementById('nav-login-btn').style.display = 'inline-block';
        document.getElementById('nav-logout-btn').style.display = 'none';
        showPage('hero-page');
    }
}

async function logoutAdmin() {
    await supabaseClient.auth.signOut();
    checkAuthSession();
}

function showResetPassword() {
    document.getElementById('reset-password-box').style.display = 'block';
}

async function handleResetPassword() {
    const email = document.getElementById('reset-email-input').value;
    if (!email) return alert('Ketik email Anda!');

    const { error } = await supabaseClient.auth.resetPasswordForEmail(email);
    if (!error) alert('Email tautan reset password telah dikirimkan!');
    else alert('Gagal: ' + error.message);
}

// ==========================================
// DASHBOARD MANAGEMENT
// ==========================================
function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tabId).classList.add('active');

    if (tabId === 'tab-companies') fetchApprovedCompaniesList();
}

async function fetchGuestsList() {
    const tbody = document.getElementById('guests-table-body');
    tbody.innerHTML = '<tr><td colspan="8">Memuat data...</td></tr>';

    const { data, error } = await supabaseClient
        .from('guests')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return tbody.innerHTML = '<tr><td colspan="8">Gagal memuat data</td></tr>';

    tbody.innerHTML = '';
    data.forEach(g => {
        const tr = document.createElement('tr');
        
        let badgeClass = 'badge-pending';
        if (g.status === 'Approved') badgeClass = 'badge-approved';
        if (g.status === 'Completed') badgeClass = 'badge-completed';

        let deleteBtn = (currentUserRole === 'superadmin') 
            ? `<button onclick="deleteGuestRecord('${g.id}')" style="background:#ef4444; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;"><i class="fa-solid fa-trash"></i> Hapus</button>` 
            : '';

        tr.innerHTML = `
            <td><b>${g.reg_code}</b></td>
            <td>${new Date(g.created_at).toLocaleDateString()}</td>
            <td>${g.nama}</td>
            <td>${g.jenis_id} - ${g.no_id}</td>
            <td>${g.instansi}</td>
            <td>${g.keperluan}</td>
            <td><span class="badge ${badgeClass}">${g.status}</span></td>
            <td>
                <button onclick="updateGuestStatus('${g.id}', 'Approved')" style="background:#10b981; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">Setuju</button>
                <button onclick="updateGuestStatus('${g.id}', 'Rejected')" style="background:#f59e0b; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">Tolak</button>
                ${deleteBtn}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Update Status Tamu (Admin & Super Admin)
async function updateGuestStatus(id, newStatus) {
    const { error } = await supabaseClient
        .from('guests')
        .update({ status: newStatus, approved_at: new Date() })
        .eq('id', id);

    if (!error) fetchGuestsList();
}

// Hapus Record Tamu (Fitur Super Admin)
async function deleteGuestRecord(id) {
    if (confirm('Apakah Anda yakin ingin menghapus riwayat tamu ini?')) {
        const { error } = await supabaseClient.from('guests').delete().eq('id', id);
        if (!error) fetchGuestsList();
    }
}

// Tambah Akun Admin Baru (Super Admin)
document.getElementById('create-user-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('new-user-email').value;
    const password = document.getElementById('new-user-pass').value;
    const role = document.getElementById('new-user-role').value;

    const { data, error } = await supabaseClient.auth.signUp({ email, password });

    if (!error && data.user) {
        // Simpan Role ke Database user_roles
        await supabaseClient.from('user_roles').insert([{
            id: data.user.id,
            email: email,
            role: role
        }]);
        alert('Akun Login Berhasil Dibuat!');
        document.getElementById('create-user-form').reset();
    } else {
        alert('Gagal Membuat Akun: ' + error.message);
    }
});

// Kelola Daftar PT
async function fetchApprovedCompaniesList() {
    const list = document.getElementById('approved-companies-list');
    const { data } = await supabaseClient.from('approved_companies').select('*');
    list.innerHTML = '';
    if (data) {
        data.forEach(c => {
            const li = document.createElement('li');
            li.style.cssText = 'display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #ddd;';
            li.innerHTML = `${c.company_name} <button onclick="deleteCompany('${c.id}')" style="color:red; border:none; background:none; cursor:pointer;">Hapus</button>`;
            list.appendChild(li);
        });
    }
}

async function addApprovedCompany() {
    const name = document.getElementById('new-company-name').value;
    if (!name) return;
    await supabaseClient.from('approved_companies').insert([{ company_name: name }]);
    document.getElementById('new-company-name').value = '';
    fetchApprovedCompaniesList();
    loadApprovedCompanies();
}

async function deleteCompany(id) {
    await supabaseClient.from('approved_companies').delete().eq('id', id);
    fetchApprovedCompaniesList();
    loadApprovedCompanies();
}