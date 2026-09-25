// --- KONEKSI SUPABASE ---
const SUPABASE_URL = 'https://gyortxfcoifxzrwfogzr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5b3J0eGZjb2lmeHpyd2ZvZ3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNzE2NzEsImV4cCI6MjEwNTc0NzY3MX0.dO07GyxM9WYRMHYOE70-nJQI_TONr7SXK7loXLRdkHU';

let supabaseClient = null;
try {
    if (SUPABASE_URL !== 'https://gyortxfcoifxzrwfogzr.supabase.co') {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
} catch (e) {
    console.warn('Menggunakan mode fallback localStorage.');
}

// --- NAVIGASI ---
function showView(viewId) {
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
}

// --- INISIALISASI ---
window.onload = async () => {
    await loadWebSettings();
    await loadApprovedCompaniesDropdown();
    await loadIdTypesDropdown();
    setupEnterKeyListener();
};

// --- TOMBOL ENTER PADA LOGIN (Requirement 5) ---
function setupEnterKeyListener() {
    const userInp = document.getElementById('login-username');
    const passInp = document.getElementById('login-password');

    const handleEnter = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleLogin();
        }
    };

    if (userInp) userInp.addEventListener('keydown', handleEnter);
    if (passInp) passInp.addEventListener('keydown', handleEnter);
}

// --- PENGATURAN WEB (Logo, Wallpaper, Nama PT) ---
async function loadWebSettings() {
    let settings = {};
    if (supabaseClient) {
        const { data } = await supabaseClient.from('web_settings').select('*');
        if (data) data.forEach(i => settings[i.setting_key] = i.setting_value);
    } else {
        settings = {
            company_name: localStorage.getItem('company_name') || 'PT Solusi Teknologi Indonesia',
            logo_url: localStorage.getItem('logo_url') || '',
            wallpaper_url: localStorage.getItem('wallpaper_url') || ''
        };
    }

    if (settings.company_name) {
        document.getElementById('app-company-name').innerText = settings.company_name;
        document.title = settings.company_name;
        const ptInput = document.getElementById('config-pt-name');
        if (ptInput) ptInput.value = settings.company_name;
    }

    const logoImg = document.getElementById('app-logo');
    if (settings.logo_url) {
        logoImg.src = settings.logo_url;
        logoImg.style.display = 'block';
    } else {
        logoImg.style.display = 'none';
    }

    if (settings.wallpaper_url) {
        document.body.style.backgroundImage = `url('${settings.wallpaper_url}')`;
    } else {
        document.body.style.backgroundImage = 'none';
    }
}

// --- WHITELIST PT & JENIS ID ---
async function loadApprovedCompaniesDropdown() {
    let companies = [];
    if (supabaseClient) {
        const { data } = await supabaseClient.from('approved_companies').select('company_name');
        if (data) companies = data.map(d => d.company_name);
    } else {
        companies = JSON.parse(localStorage.getItem('approved_companies')) || ['PT Maju Bersama', 'PT Nusantara Digital'];
    }

    const datalist = document.getElementById('approved-companies-list');
    if (datalist) {
        datalist.innerHTML = '';
        companies.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c;
            datalist.appendChild(opt);
        });
    }

    const display = document.getElementById('company-list-display');
    if (display) {
        display.innerHTML = '';
        companies.forEach(c => {
            display.innerHTML += `<span class="tag">${c}</span>`;
        });
    }
}

async function loadIdTypesDropdown() {
    let idTypes = [];
    if (supabaseClient) {
        const { data } = await supabaseClient.from('id_types').select('type_name');
        if (data) idTypes = data.map(d => d.type_name);
    } else {
        idTypes = JSON.parse(localStorage.getItem('id_types')) || ['KTP', 'SIM', 'Paspor', 'ID Karyawan'];
    }

    const select = document.getElementById('reg-id-type');
    if (select) {
        select.innerHTML = '<option value="" disabled selected>Pilih Jenis ID</option>';
        idTypes.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t;
            opt.innerText = t;
            select.appendChild(opt);
        });
    }

    const display = document.getElementById('id-type-list-display');
    if (display) {
        display.innerHTML = '';
        idTypes.forEach(t => {
            display.innerHTML += `<span class="tag">${t}</span>`;
        });
    }
}

// --- REGISTRASI TAMU ---
async function handleRegister(e) {
    e.preventDefault();
    const guestId = 'GST-' + Math.floor(100000 + Math.random() * 900000);
    
    const guestData = {
        guest_id: guestId,
        fullname: document.getElementById('reg-name').value,
        id_type: document.getElementById('reg-id-type').value,
        id_number: document.getElementById('reg-id-number').value,
        origin_company: document.getElementById('reg-company').value,
        purpose: document.getElementById('reg-purpose').value,
        status: 'Pending',
        created_at: new Date().toISOString()
    };

    if (supabaseClient) {
        const { error } = await supabaseClient.from('guests').insert([guestData]);
        if (error) {
            alert('Gagal registrasi: ' + error.message);
            return;
        }
    } else {
        let guests = JSON.parse(localStorage.getItem('guests')) || [];
        guests.push(guestData);
        localStorage.setItem('guests', JSON.stringify(guests));
    }

    alert(`Registrasi Berhasil!\n\nNomor Registrasi / ID Tamu Anda:\n${guestId}\n\nGunakan ID ini untuk memeriksa status kunjungan.`);
    document.getElementById('form-register').reset();
    showView('view-status');
}

// --- CEK STATUS BERDASARKAN ID TAMU (Requirement 7 & 11) ---
async function checkGuestStatus() {
    const guestIdInput = document.getElementById('check-guest-id').value.trim();
    const resultDiv = document.getElementById('status-result');
    resultDiv.style.display = 'block';

    if (!guestIdInput) {
        resultDiv.className = 'notif rejected';
        resultDiv.innerText = 'Mohon masukkan Nomor Registrasi / ID Tamu.';
        return;
    }

    let guest = null;
    if (supabaseClient) {
        const { data } = await supabaseClient.from('guests').select('*').eq('guest_id', guestIdInput).single();
        if (data) guest = data;
    } else {
        let guests = JSON.parse(localStorage.getItem('guests')) || [];
        guest = guests.find(g => g.guest_id === guestIdInput);
    }

    if (!guest) {
        resultDiv.className = 'notif rejected';
        resultDiv.innerText = 'ID Tamu tidak ditemukan.';
    } else {
        let statusClass = 'pending';
        let statusTextMsg = 'Status Kunjungan: PENDING (Menunggu Persetujuan)';
        
        if (guest.status === 'Approved') {
            statusClass = 'success';
            statusTextMsg = 'AKSES DISETUJUI (APPROVED)! Selamat datang di perusahaan.';
        } else if (guest.status === 'Rejected') {
            statusClass = 'rejected';
            statusTextMsg = 'AKSES DITOLAK (REJECTED).';
        }

        resultDiv.className = `notif ${statusClass}`;
        resultDiv.innerHTML = `
            <strong>${statusTextMsg}</strong><br><br>
            <strong>ID Tamu:</strong> ${guest.guest_id}<br>
            <strong>Nama:</strong> ${guest.fullname}<br>
            <strong>Jenis & No ID:</strong> ${guest.id_type} - ${guest.id_number}<br>
            <strong>Instansi:</strong> ${guest.origin_company}<br>
            <strong>Tujuan:</strong> ${guest.purpose}
        `;
    }
}

// --- LOGIN (Admin & Super Admin) ---
let currentUserRole = null;

async function handleLogin() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();

    if (!username || !password) {
        alert('Masukkan username dan password!');
        return;
    }

    let user = null;
    if (supabaseClient) {
        const { data } = await supabaseClient.from('users').select('*').eq('username', username).eq('password', password).single();
        if (data) user = data;
    } else {
        let users = JSON.parse(localStorage.getItem('users')) || [
            { username: 'superadmin', password: 'superadmin123', role: 'super_admin' },
            { username: 'admin', password: 'admin123', role: 'admin' }
        ];
        user = users.find(u => u.username === username && u.password === password);
    }

    if (user) {
        currentUserRole = user.role;
        document.getElementById('login-username').value = '';
        document.getElementById('login-password').value = '';
        
        if (user.role === 'super_admin') {
            showView('view-superadmin');
            loadGuestsForSuperAdmin();
        } else {
            showView('view-admin');
            loadGuestsForAdmin();
        }
    } else {
        alert('Username atau password salah!');
    }
}

function logout() {
    currentUserRole = null;
    showView('view-home');
}

// --- RESET PASSWORD (Requirement 6) ---
async function handleResetPassword() {
    const username = document.getElementById('reset-username').value.trim();
    const newPassword = document.getElementById('reset-new-password').value.trim();

    if (!username || !newPassword) {
        alert('Semua field wajib diisi!');
        return;
    }

    if (supabaseClient) {
        const { data, error } = await supabaseClient.from('users').update({ password: newPassword }).eq('username', username).select();
        if (error || !data || data.length === 0) {
            alert('Username tidak ditemukan.');
            return;
        }
    } else {
        let users = JSON.parse(localStorage.getItem('users')) || [
            { username: 'superadmin', password: 'superadmin123', role: 'super_admin' },
            { username: 'admin', password: 'admin123', role: 'admin' }
        ];
        let found = users.find(u => u.username === username);
        if (!found) {
            alert('Username tidak ditemukan.');
            return;
        }
        found.password = newPassword;
        localStorage.setItem('users', JSON.stringify(users));
    }

    alert('Password berhasil direset!');
    document.getElementById('reset-username').value = '';
    document.getElementById('reset-new-password').value = '';
    showView('view-status');
}

// --- ADMIN DASHBOARD ---
async function loadGuestsForAdmin() {
    let guests = [];
    if (supabaseClient) {
        const { data } = await supabaseClient.from('guests').select('*').order('created_at', { ascending: false });
        if (data) guests = data;
    } else {
        guests = JSON.parse(localStorage.getItem('guests')) || [];
    }

    const container = document.getElementById('admin-guest-list');
    container.innerHTML = '';

    if (guests.length === 0) {
        container.innerHTML = '<p>Belum ada data tamu.</p>';
        return;
    }

    guests.forEach(g => {
        container.innerHTML += `
            <div class="record-item">
                <strong>ID: ${g.guest_id}</strong> | ${g.fullname} (${g.origin_company})<br>
                ID: ${g.id_type} (${g.id_number}) | Tujuan: ${g.purpose}<br>
                Status: <strong>${g.status}</strong><br>
                <button onclick="updateGuestStatus('${g.guest_id}', 'Approved')" class="btn-secondary" style="width:auto; padding:5px 10px; margin-top:5px;">Approve</button>
                <button onclick="updateGuestStatus('${g.guest_id}', 'Rejected')" class="btn-danger" style="width:auto; padding:5px 10px; margin-top:5px;">Reject</button>
            </div>
        `;
    });
}

async function updateGuestStatus(guestId, status) {
    if (supabaseClient) {
        await supabaseClient.from('guests').update({ status: status }).eq('guest_id', guestId);
    } else {
        let guests = JSON.parse(localStorage.getItem('guests')) || [];
        let g = guests.find(item => item.guest_id === guestId);
        if (g) g.status = status;
        localStorage.setItem('guests', JSON.stringify(guests));
    }
    loadGuestsForAdmin();
}

// --- SUPER ADMIN FUNCTIONS (Requirement 8, 9, 10) ---
async function loadGuestsForSuperAdmin() {
    let guests = [];
    if (supabaseClient) {
        const { data } = await supabaseClient.from('guests').select('*').order('created_at', { ascending: false });
        if (data) guests = data;
    } else {
        guests = JSON.parse(localStorage.getItem('guests')) || [];
    }

    const container = document.getElementById('superadmin-guest-list');
    container.innerHTML = '';

    if (guests.length === 0) {
        container.innerHTML = '<p>Belum ada data tamu.</p>';
        return;
    }

    guests.forEach(g => {
        container.innerHTML += `
            <div class="record-item">
                <strong>ID: ${g.guest_id}</strong> | ${g.fullname} (${g.origin_company})<br>
                Status: <strong>${g.status}</strong> | Waktu: ${new Date(g.created_at).toLocaleString()}<br>
                <button onclick="deleteGuestRecord('${g.guest_id}')" class="btn-danger" style="width:auto; padding:4px 8px; margin-top:5px;">Hapus Tamu</button>
            </div>
        `;
    });
}

async function deleteGuestRecord(guestId) {
    if (confirm('Yakin ingin menghapus data tamu ini (selesai kunjungan / record lama)?')) {
        if (supabaseClient) {
            await supabaseClient.from('guests').delete().eq('guest_id', guestId);
        } else {
            let guests = JSON.parse(localStorage.getItem('guests')) || [];
            guests = guests.filter(g => g.guest_id !== guestId);
            localStorage.setItem('guests', JSON.stringify(guests));
        }
        loadGuestsForSuperAdmin();
    }
}

async function addApprovedCompany() {
    const name = document.getElementById('new-company-name').value.trim();
    if (!name) return;

    if (supabaseClient) {
        await supabaseClient.from('approved_companies').insert([{ company_name: name }]);
    } else {
        let companies = JSON.parse(localStorage.getItem('approved_companies')) || [];
        if (!companies.includes(name)) companies.push(name);
        localStorage.setItem('approved_companies', JSON.stringify(companies));
    }

    document.getElementById('new-company-name').value = '';
    loadApprovedCompaniesDropdown();
    alert('PT berhasil ditambahkan ke whitelist.');
}

async function addIdType() {
    const typeName = document.getElementById('new-id-type').value.trim();
    if (!typeName) return;

    if (supabaseClient) {
        await supabaseClient.from('id_types').insert([{ type_name: typeName }]);
    } else {
        let idTypes = JSON.parse(localStorage.getItem('id_types')) || ['KTP', 'SIM', 'Paspor'];
        if (!idTypes.includes(typeName)) idTypes.push(typeName);
        localStorage.setItem('id_types', JSON.stringify(idTypes));
    }

    document.getElementById('new-id-type').value = '';
    loadIdTypesDropdown();
    alert('Jenis ID berhasil ditambahkan.');
}

// Upload Logo / Wallpaper via Local Location (FileReader Base64)
async function saveConfiguration() {
    const ptName = document.getElementById('config-pt-name').value.trim();
    const logoFile = document.getElementById('config-logo-file').files[0];
    const wallpaperFile = document.getElementById('config-wallpaper-file').files[0];

    if (ptName) {
        if (supabaseClient) {
            await supabaseClient.from('web_settings').update({ setting_value: ptName }).eq('setting_key', 'company_name');
        } else {
            localStorage.setItem('company_name', ptName);
        }
    }

    if (logoFile) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64Logo = e.target.result;
            if (supabaseClient) {
                await supabaseClient.from('web_settings').update({ setting_value: base64Logo }).eq('setting_key', 'logo_url');
            } else {
                localStorage.setItem('logo_url', base64Logo);
            }
            loadWebSettings();
        };
        reader.readAsDataURL(logoFile);
    }

    if (wallpaperFile) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64Wallpaper = e.target.result;
            if (supabaseClient) {
                await supabaseClient.from('web_settings').update({ setting_value: base64Wallpaper }).eq('setting_key', 'wallpaper_url');
            } else {
                localStorage.setItem('wallpaper_url', base64Wallpaper);
            }
            loadWebSettings();
        };
        reader.readAsDataURL(wallpaperFile);
    }

    alert('Konfigurasi web berhasil disimpan!');
    setTimeout(loadWebSettings, 500);
}

async function resetConfiguration() {
    if (confirm('Yakin ingin menghapus dan mereset semua konfigurasi pada web?')) {
        if (supabaseClient) {
            await supabaseClient.from('web_settings').update({ setting_value: 'PT Solusi Teknologi Indonesia' }).eq('setting_key', 'company_name');
            await supabaseClient.from('web_settings').update({ setting_value: '' }).eq('setting_key', 'logo_url');
            await supabaseClient.from('web_settings').update({ setting_value: '' }).eq('setting_key', 'wallpaper_url');
        } else {
            localStorage.removeItem('company_name');
            localStorage.removeItem('logo_url');
            localStorage.removeItem('wallpaper_url');
        }
        loadWebSettings();
        alert('Semua konfigurasi web telah direset ke default.');
    }
}

// --- MULTI-LANGUAGE ---
const dictionary = {
    id: {
        welcome: "Selamat Datang di Portal Tamu",
        subtitle: "Silakan mulai registrasi kunjungan Anda atau cek status kunjungan.",
        getStarted: "Get Started (Registrasi Tamu)",
        gotoStatus: "Cek Status Kunjungan & Login",
        regTitle: "Form Registrasi Tamu",
        lblFullname: "Nama Lengkap",
        lblIdType: "Jenis ID",
        lblIdNumber: "Nomor ID (KTP/SIM/Paspor)",
        lblCompany: "Asal Instansi / Perusahaan",
        lblPurpose: "Tujuan Kunjungan",
        btnSubmitReg: "Kirim Registrasi",
        btnBack: "Kembali",
        statusTitle: "Cek Status Kunjungan",
        statusDesc: "Masukkan Nomor Registrasi / ID Tamu Anda untuk memeriksa status.",
        btnCheckStatus: "Periksa Status",
        loginTitle: "Login Admin & Super Admin",
        btnLogin: "Login",
        linkReset: "Lupa / Reset Password?",
        resetTitle: "Reset Password Akun",
        resetDesc: "Masukkan username Anda dan buat password baru.",
        btnResetSubmit: "Simpan Password Baru"
    },
    en: {
        welcome: "Welcome to Guest Portal",
        subtitle: "Please start your visit registration or check your visit status.",
        getStarted: "Get Started (Guest Registration)",
        gotoStatus: "Check Visit Status & Login",
        regTitle: "Guest Registration Form",
        lblFullname: "Full Name",
        lblIdType: "ID Type",
        lblIdNumber: "ID Number (ID/Driver License/Passport)",
        lblCompany: "Origin Institution / Company",
        lblPurpose: "Purpose of Visit",
        btnSubmitReg: "Submit Registration",
        btnBack: "Back",
        statusTitle: "Check Visit Status",
        statusDesc: "Enter your Registration Number / Guest ID to check your status.",
        btnCheckStatus: "Check Status",
        loginTitle: "Admin & Super Admin Login",
        btnLogin: "Login",
        linkReset: "Forgot / Reset Password?",
        resetTitle: "Reset Account Password",
        resetDesc: "Enter your username and create a new password.",
        btnResetSubmit: "Save New Password"
    }
};

function changeLanguage() {
    const lang = document.getElementById('lang-select').value;
    const dict = dictionary[lang];

    document.getElementById('txt-welcome').innerText = dict.welcome;
    document.getElementById('txt-subtitle').innerText = dict.subtitle;
    document.getElementById('btn-get-started').innerText = dict.getStarted;
    document.getElementById('btn-goto-status').innerText = dict.gotoStatus;
    
    document.getElementById('txt-reg-title').innerText = dict.regTitle;
    document.getElementById('lbl-fullname').innerText = dict.lblFullname;
    document.getElementById('lbl-idtype').innerText = dict.lblIdType;
    document.getElementById('lbl-idnumber').innerText = dict.lblIdNumber;
    document.getElementById('lbl-company').innerText = dict.lblCompany;
    document.getElementById('lbl-purpose').innerText = dict.lblPurpose;
    document.getElementById('btn-submit-reg').innerText = dict.btnSubmitReg;
    
    document.getElementById('btn-back-1').innerText = dict.btnBack;
    document.getElementById('btn-back-2').innerText = dict.btnBack;
    document.getElementById('btn-back-3').innerText = dict.btnBack;

    document.getElementById('txt-status-title').innerText = dict.statusTitle;
    document.getElementById('txt-status-desc').innerText = dict.statusDesc;
    document.getElementById('btn-check-status').innerText = dict.btnCheckStatus;
    document.getElementById('txt-login-title').innerText = dict.loginTitle;
    document.getElementById('btn-login').innerText = dict.btnLogin;
    document.getElementById('link-reset').innerText = dict.linkReset;

    document.getElementById('txt-reset-title').innerText = dict.resetTitle;
    document.getElementById('txt-reset-desc').innerText = dict.resetDesc;
    document.getElementById('btn-reset-submit').innerText = dict.btnResetSubmit;
}