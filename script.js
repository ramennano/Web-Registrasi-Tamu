// Konfigurasi Supabase (Ganti dengan kredensial Supabase Anda)
const SUPABASE_URL = 'https://gyortxfcoifxzrwfogzr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5b3J0eGZjb2lmeHpyd2ZvZ3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNzE2NzEsImV4cCI6MjEwNTc0NzY3MX0.dO07GyxM9WYRMHYOE70-nJQI_TONr7SXK7loXLRdkHU';

let supabaseClient = null;
try {
    if (window.supabase && SUPABASE_URL !== 'https://gyortxfcoifxzrwfogzr.supabase.co') {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
} catch (e) {
    console.warn('Supabase tidak terhubung, menggunakan LocalStorage fallback.');
}

// --- Multi-Language Dictionary ---
const dictionary = {
    id: {
        welcome: "Selamat Datang di Portal Tamu",
        subtitle: "Silakan pilih menu di bawah ini untuk melanjutkan.",
        getStarted: "Get Started (Registrasi Tamu)",
        gotoStatus: "Cek Status Kunjungan",
        gotoLogin: "Login Admin & Super Admin",
        regTitle: "Registrasi Tamu",
        fullname: "Nama Lengkap",
        idType: "Jenis ID",
        idNumber: "Nomor ID",
        company: "Asal Instansi / Perusahaan",
        purpose: "Tujuan Kunjungan",
        submitReg: "Daftar Sekarang",
        statusTitle: "Cek Status Kunjungan",
        statusDesc: "Masukkan Nomor Registrasi / ID Tamu Anda untuk memeriksa status.",
        checkStatusBtn: "Cek Status",
        bookingListTitle: "Daftar Kode Booking / Tamu Terdaftar",
        refreshBooking: "Muat Daftar Booking",
        loginTitle: "Login Admin & Super Admin",
        username: "Username",
        password: "Password",
        loginBtn: "Login",
        resetPassLink: "Lupa / Reset Password?",
        resetTitle: "Reset Password",
        resetDesc: "Masukkan username dan password baru Anda.",
        resetBtn: "Reset Password",
        back: "Kembali"
    },
    en: {
        welcome: "Welcome to Guest Portal",
        subtitle: "Please select an option below to proceed.",
        getStarted: "Get Started (Guest Registration)",
        gotoStatus: "Check Visit Status",
        gotoLogin: "Admin & Super Admin Login",
        regTitle: "Guest Registration",
        fullname: "Full Name",
        idType: "ID Type",
        idNumber: "ID Number",
        company: "Origin Company / Institution",
        purpose: "Purpose of Visit",
        submitReg: "Register Now",
        statusTitle: "Check Visit Status",
        statusDesc: "Enter your Registration Number / Guest ID to check status.",
        checkStatusBtn: "Check Status",
        bookingListTitle: "Registered Booking Codes / Guests",
        refreshBooking: "Load Booking List",
        loginTitle: "Admin & Super Admin Login",
        username: "Username",
        password: "Password",
        loginBtn: "Login",
        resetPassLink: "Forgot / Reset Password?",
        resetTitle: "Reset Password",
        resetDesc: "Enter your username and new password.",
        resetBtn: "Reset Password",
        back: "Back"
    }
};

let currentLang = 'id';

function changeLanguage() {
    currentLang = document.getElementById('lang-select').value;
    const t = dictionary[currentLang];

    document.getElementById('txt-welcome').innerText = t.welcome;
    document.getElementById('txt-subtitle').innerText = t.subtitle;
    document.getElementById('btn-get-started').innerText = t.getStarted;
    document.getElementById('btn-goto-status').innerText = t.gotoStatus;
    document.getElementById('btn-goto-login').innerText = t.gotoLogin;

    document.getElementById('txt-reg-title').innerText = t.regTitle;
    document.getElementById('lbl-fullname').innerText = t.fullname;
    document.getElementById('lbl-id-type').innerText = t.idType;
    document.getElementById('lbl-id-number').innerText = t.idNumber;
    document.getElementById('lbl-company').innerText = t.company;
    document.getElementById('lbl-purpose').innerText = t.purpose;
    document.getElementById('btn-submit-reg').innerText = t.submitReg;

    document.getElementById('txt-status-title').innerText = t.statusTitle;
    document.getElementById('txt-status-desc').innerText = t.statusDesc;
    document.getElementById('btn-check-status').innerText = t.checkStatusBtn;
    document.getElementById('txt-booking-list').innerText = t.bookingListTitle;
    document.getElementById('btn-refresh-booking').innerText = t.refreshBooking;

    document.getElementById('txt-login-title').innerText = t.loginTitle;
    document.getElementById('lbl-username').innerText = t.username;
    document.getElementById('lbl-password').innerText = t.password;
    document.getElementById('btn-login-submit').innerText = t.loginBtn;
    document.getElementById('link-reset-pass').innerText = t.resetPassLink;

    document.getElementById('txt-reset-title').innerText = t.resetTitle;
    document.getElementById('txt-reset-desc').innerText = t.resetDesc;
    document.getElementById('btn-reset-submit').innerText = t.resetBtn;

    document.querySelectorAll('.btn-back').forEach(btn => btn.innerText = t.back);
}

// --- Navigation ---
function showView(viewId) {
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    
    if (viewId === 'view-status') {
        loadRegisteredBookings();
    }
}

// --- Initialization ---
window.onload = async () => {
    await loadWebSettings();
    await loadDropdownData();
    setupLoginEnterKey();
};

// Enter key support for login[cite: 5]
function setupLoginEnterKey() {
    const passInput = document.getElementById('login-password');
    if (passInput) {
        passInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleLogin(e);
            }
        });
    }
}

// --- Web Settings & Configurations ---
async function loadWebSettings() {
    let settings = {};
    if (supabaseClient) {
        const { data } = await supabaseClient.from('web_settings').select('*');
        if (data) {
            data.forEach(s => settings[s.setting_key] = s.setting_value);
        }
    } else {
        settings = JSON.parse(localStorage.getItem('web_settings') || '{}');
    }

    if (settings.company_name) {
        document.getElementById('app-company-name').innerText = settings.company_name;
        document.title = settings.company_name;
    }
    if (settings.logo_url) {
        const logo = document.getElementById('app-logo');
        logo.src = settings.logo_url;
        logo.style.display = 'inline-block';
    }
    if (settings.wallpaper_url) {
        document.body.style.backgroundImage = `url('${settings.wallpaper_url}')`;
    }
}

async function loadDropdownData() {
    let companies = [];
    let idTypes = [];

    if (supabaseClient) {
        const compRes = await supabaseClient.from('approved_companies').select('company_name');
        if (compRes.data) companies = compRes.data.map(c => c.company_name);

        const idRes = await supabaseClient.from('id_types').select('name');
        if (idRes.data) idTypes = idRes.data.map(i => i.name);
    } else {
        companies = JSON.parse(localStorage.getItem('approved_companies') || '["PT Maju Bersama", "PT Teknologi Nusantara"]');
        idTypes = JSON.parse(localStorage.getItem('id_types') || '["KTP", "SIM", "Paspor"]');
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

    const idSelect = document.getElementById('reg-id-type');
    if (idSelect) {
        idSelect.innerHTML = '<option value="" disabled selected>Pilih Jenis ID</option>';
        idTypes.forEach(id => {
            const opt = document.createElement('option');
            opt.value = id;
            opt.innerText = id;
            idSelect.appendChild(opt);
        });
    }
}

// --- Guest Registration with Autosave Manual Company ---
async function handleRegister(e) {
    e.preventDefault();
    const guestId = 'GST-' + Math.floor(100000 + Math.random() * 900000);
    const companyInput = document.getElementById('reg-company').value.trim();

    const newGuest = {
        guest_id: guestId,
        fullname: document.getElementById('reg-name').value,
        id_type: document.getElementById('reg-id-type').value,
        id_number: document.getElementById('reg-id-number').value,
        origin_company: companyInput,
        purpose: document.getElementById('reg-purpose').value,
        status: 'Pending',
        created_at: new Date().toISOString()
    };

    if (supabaseClient) {
        // Autosave manual company if not exists in approved_companies whitelist
        const { data: existingComp } = await supabaseClient
            .from('approved_companies')
            .select('company_name')
            .ilike('company_name', companyInput)
            .single();

        if (!existingComp) {
            await supabaseClient.from('approved_companies').insert([{ company_name: companyInput }]);
        }

        const { error } = await supabaseClient.from('guests').insert([newGuest]);
        if (error) {
            alert('Gagal registrasi: ' + error.message);
            return;
        }
    } else {
        let guests = JSON.parse(localStorage.getItem('guests') || '[]');
        guests.push(newGuest);
        localStorage.setItem('guests', JSON.stringify(guests));

        let comps = JSON.parse(localStorage.getItem('approved_companies') || '[]');
        if (!comps.includes(companyInput)) {
            comps.push(companyInput);
            localStorage.setItem('approved_companies', JSON.stringify(comps));
        }
    }

    alert(`Registrasi Berhasil!\nNomor ID / Kode Booking Anda: ${guestId}\nSimpan kode ini untuk mengecek status.`);
    document.getElementById('form-register').reset();
    showView('view-status');
}

// --- Check Status & Booking List (Realtime DB Query) ---
async function checkStatus() {
    const id = document.getElementById('check-guest-id').value.trim();
    const resultDiv = document.getElementById('status-result');
    resultDiv.style.display = 'block';

    if (!id) {
        resultDiv.className = 'notif rejected';
        resultDiv.innerText = 'Masukkan Nomor Registrasi / ID Tamu terlebih dahulu.';
        return;
    }

    let guest = null;
    if (supabaseClient) {
        const { data } = await supabaseClient.from('guests').select('*').eq('guest_id', id).single();
        guest = data;
    } else {
        const guests = JSON.parse(localStorage.getItem('guests') || '[]');
        guest = guests.find(g => g.guest_id === id);
    }

    if (!guest) {
        resultDiv.className = 'notif rejected';
        resultDiv.innerText = 'ID Tamu / Kode Booking tidak ditemukan di database.';
    } else {
        let msg = `Tamu: <strong>${guest.fullname}</strong> (${guest.origin_company})<br>Status: <strong>${guest.status}</strong>`;
        if (guest.status === 'Approved') {
            resultDiv.className = 'notif success';
            msg += '<br><span style="color:#155724; font-size:1.1rem;">🔔 NOTIFIKASI: AKSES DISETUJUI (APPROVED)! Silakan masuk.</span>';
        } else if (guest.status === 'Rejected') {
            resultDiv.className = 'notif rejected';
            msg += '<br>Maaf, kunjungan Anda tidak disetujui.';
        } else {
            resultDiv.className = 'notif pending';
            msg += '<br>⏳ Menunggu persetujuan (Pending) dari Admin.';
        }
        resultDiv.innerHTML = msg;
    }
}

async function loadRegisteredBookings() {
    let guests = [];
    if (supabaseClient) {
        const { data } = await supabaseClient.from('guests').select('*').order('created_at', { ascending: false }).limit(20);
        if (data) guests = data;
    } else {
        guests = JSON.parse(localStorage.getItem('guests') || '[]');
    }

    const container = document.getElementById('registered-bookings-list');
    container.innerHTML = '';

    if (guests.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#777;">Belum ada data tamu terdaftar.</p>';
        return;
    }

    guests.forEach(g => {
        let badgeColor = g.status === 'Approved' ? 'green' : (g.status === 'Rejected' ? 'red' : 'orange');
        container.innerHTML += `
            <div class="item-row">
                <div>
                    <strong>${g.guest_id}</strong> - ${g.fullname} (${g.origin_company})<br>
                    <small>Tujuan: ${g.purpose}</small>
                </div>
                <div>
                    <span style="padding:4px 8px; border-radius:4px; color:white; background:${badgeColor}; font-size:0.85rem;">${g.status}</span>
                </div>
            </div>
        `;
    });
}

// --- Login & Authentication ---
let currentUserRole = null;

async function handleLogin(e) {
    e.preventDefault();
    const user = document.getElementById('login-username').value.trim();
    const pass = document.getElementById('login-password').value.trim();

    let loggedInUser = null;

    if (supabaseClient) {
        const { data } = await supabaseClient.from('users').select('*').eq('username', user).eq('password', pass).single();
        loggedInUser = data;
    } else {
        let users = JSON.parse(localStorage.getItem('users') || JSON.stringify([
            { username: 'superadmin', password: 'super123', role: 'super_admin' },
            { username: 'admin', password: 'admin123', role: 'admin' }
        ]));
        loggedInUser = users.find(u => u.username === user && u.password === pass);
    }

    if (loggedInUser) {
        currentUserRole = loggedInUser.role;
        document.getElementById('form-login').reset();
        if (currentUserRole === 'super_admin') {
            showView('view-superadmin');
            loadSuperAdminGuests();
            loadManageApprovedCompanies();
            loadManageIdTypes();
        } else {
            showView('view-admin');
            loadAdminGuests();
        }
    } else {
        alert('Username atau password salah!');
    }
}

function logout() {
    currentUserRole = null;
    showView('view-home');
}

async function handleResetPassword() {
    const user = document.getElementById('reset-username').value.trim();
    const newPass = document.getElementById('reset-new-password').value.trim();

    if (!user || !newPass) {
        alert('Mohon isi username dan password baru.');
        return;
    }

    if (supabaseClient) {
        const { error } = await supabaseClient.from('users').update({ password: newPass }).eq('username', user);
        if (error) {
            alert('Gagal reset password: ' + error.message);
            return;
        }
    } else {
        let users = JSON.parse(localStorage.getItem('users') || JSON.stringify([
            { username: 'superadmin', password: 'super123', role: 'super_admin' },
            { username: 'admin', password: 'admin123', role: 'admin' }
        ]));
        let found = users.find(u => u.username === user);
        if (found) {
            found.password = newPass;
            localStorage.setItem('users', JSON.stringify(users));
        } else {
            alert('Username tidak ditemukan.');
            return;
        }
    }

    alert('Password berhasil direset! Silakan login kembali.');
    showView('view-login');
}

// --- Admin Dashboard Functions ---
async function loadAdminGuests() {
    let guests = [];
    if (supabaseClient) {
        const { data } = await supabaseClient.from('guests').select('*').order('created_at', { ascending: false });
        if (data) guests = data;
    } else {
        guests = JSON.parse(localStorage.getItem('guests') || '[]');
    }

    const container = document.getElementById('admin-guest-container');
    container.innerHTML = '';

    guests.forEach(g => {
        container.innerHTML += `
            <div class="item-row">
                <div>
                    <strong>${g.guest_id}</strong> - ${g.fullname} (${g.origin_company})<br>
                    <small>ID: ${g.id_type} (${g.id_number}) | Tujuan: ${g.purpose}</small><br>
                    <small>Status: <strong>${g.status}</strong></small>
                </div>
                <div>
                    <button onclick="updateGuestStatus('${g.guest_id}', 'Approved')" class="btn-secondary" style="padding:5px 10px; font-size:0.8rem;">Approve</button>
                    <button onclick="updateGuestStatus('${g.guest_id}', 'Rejected')" class="btn-danger" style="padding:5px 10px; font-size:0.8rem; margin-top:3px;">Reject</button>
                </div>
            </div>
        `;
    });
}

async function updateGuestStatus(guestId, status) {
    if (supabaseClient) {
        await supabaseClient.from('guests').update({ status: status }).eq('guest_id', guestId);
    } else {
        let guests = JSON.parse(localStorage.getItem('guests') || '[]');
        let g = guests.find(x => x.guest_id === guestId);
        if (g) {
            g.status = status;
            localStorage.setItem('guests', JSON.stringify(guests));
        }
    }
    loadAdminGuests();
}

// --- Super Admin Dashboard Functions ---
async function saveWebConfiguration() {
    const ptName = document.getElementById('config-pt-name').value.trim();
    const logoFile = document.getElementById('config-logo').files[0];
    const wallFile = document.getElementById('config-wallpaper').files[0];

    let settings = {};
    if (!supabaseClient) {
        settings = JSON.parse(localStorage.getItem('web_settings') || '{}');
    }

    if (ptName) {
        if (supabaseClient) {
            await supabaseClient.from('web_settings').upsert({ setting_key: 'company_name', setting_value: ptName }, { onConflict: 'setting_key' });
        } else {
            settings.company_name = ptName;
        }
    }

    if (logoFile) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64Logo = e.target.result;
            if (supabaseClient) {
                await supabaseClient.from('web_settings').upsert({ setting_key: 'logo_url', setting_value: base64Logo }, { onConflict: 'setting_key' });
            } else {
                settings.logo_url = base64Logo;
                localStorage.setItem('web_settings', JSON.stringify(settings));
            }
            loadWebSettings();
        };
        reader.readAsDataURL(logoFile);
    }

    if (wallFile) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64Wall = e.target.result;
            if (supabaseClient) {
                await supabaseClient.from('web_settings').upsert({ setting_key: 'wallpaper_url', setting_value: base64Wall }, { onConflict: 'setting_key' });
            } else {
                settings.wallpaper_url = base64Wall;
                localStorage.setItem('web_settings', JSON.stringify(settings));
            }
            loadWebSettings();
        };
        reader.readAsDataURL(wallFile);
    }

    if (!supabaseClient) {
        localStorage.setItem('web_settings', JSON.stringify(settings));
    }

    alert('Konfigurasi berhasil disimpan!');
    setTimeout(loadWebSettings, 500);
}

async function resetAllConfigurations() {
    if (confirm('Yakin ingin mereset seluruh konfigurasi web (Nama PT, Logo, Wallpaper)?')) {
        if (supabaseClient) {
            await supabaseClient.from('web_settings').upsert({ setting_key: 'company_name', setting_value: 'PT Solusi Teknologi Indonesia' }, { onConflict: 'setting_key' });
            await supabaseClient.from('web_settings').upsert({ setting_key: 'logo_url', setting_value: '' }, { onConflict: 'setting_key' });
            await supabaseClient.from('web_settings').upsert({ setting_key: 'wallpaper_url', setting_value: '' }, { onConflict: 'setting_key' });
        } else {
            localStorage.removeItem('web_settings');
        }
        document.getElementById('app-logo').style.display = 'none';
        document.body.style.backgroundImage = 'none';
        loadWebSettings();
        alert('Semua konfigurasi berhasil dihapus/direset.');
    }
}

// Whitelist PT Management
async function addApprovedCompany() {
    const compName = document.getElementById('new-approved-company').value.trim();
    if (!compName) return;

    if (supabaseClient) {
        await supabaseClient.from('approved_companies').insert([{ company_name: compName }]);
    } else {
        let comps = JSON.parse(localStorage.getItem('approved_companies') || '[]');
        if (!comps.includes(compName)) comps.push(compName);
        localStorage.setItem('approved_companies', JSON.stringify(comps));
    }

    document.getElementById('new-approved-company').value = '';
    loadManageApprovedCompanies();
    loadDropdownData();
}

async function loadManageApprovedCompanies() {
    let comps = [];
    if (supabaseClient) {
        const { data } = await supabaseClient.from('approved_companies').select('*');
        if (data) comps = data;
    } else {
        let arr = JSON.parse(localStorage.getItem('approved_companies') || '[]');
        comps = arr.map((c, i) => ({ id: i, company_name: c }));
    }

    const container = document.getElementById('approved-companies-manage-list');
    container.innerHTML = '';

    comps.forEach(c => {
        container.innerHTML += `
            <div class="item-row">
                <span>${c.company_name}</span>
                <button onclick="deleteApprovedCompany(${c.id}, '${c.company_name}')" class="btn-danger" style="width:auto; padding:3px 8px; font-size:0.8rem;">Hapus</button>
            </div>
        `;
    });
}

async function deleteApprovedCompany(id, name) {
    if (confirm(`Hapus PT ${name} dari daftar disetujui?`)) {
        if (supabaseClient) {
            await supabaseClient.from('approved_companies').delete().eq('id', id);
        } else {
            let comps = JSON.parse(localStorage.getItem('approved_companies') || '[]');
            comps = comps.filter(c => c !== name);
            localStorage.setItem('approved_companies', JSON.stringify(comps));
        }
        loadManageApprovedCompanies();
        loadDropdownData();
    }
}

// ID Types Management
async function addIdType() {
    const typeName = document.getElementById('new-id-type').value.trim();
    if (!typeName) return;

    if (supabaseClient) {
        await supabaseClient.from('id_types').insert([{ name: typeName }]);
    } else {
        let types = JSON.parse(localStorage.getItem('id_types') || '[]');
        if (!types.includes(typeName)) types.push(typeName);
        localStorage.setItem('id_types', JSON.stringify(types));
    }

    document.getElementById('new-id-type').value = '';
    loadManageIdTypes();
    loadDropdownData();
}

async function loadManageIdTypes() {
    let types = [];
    if (supabaseClient) {
        const { data } = await supabaseClient.from('id_types').select('*');
        if (data) types = data;
    } else {
        let arr = JSON.parse(localStorage.getItem('id_types') || '[]');
        types = arr.map((t, i) => ({ id: i, name: t }));
    }

    const container = document.getElementById('id-types-manage-list');
    container.innerHTML = '';

    types.forEach(t => {
        container.innerHTML += `
            <div class="item-row">
                <span>${t.name}</span>
                <button onclick="deleteIdType(${t.id}, '${t.name}')" class="btn-danger" style="width:auto; padding:3px 8px; font-size:0.8rem;">Hapus</button>
            </div>
        `;
    });
}

async function deleteIdType(id, name) {
    if (confirm(`Hapus Jenis ID ${name}?`)) {
        if (supabaseClient) {
            await supabaseClient.from('id_types').delete().eq('id', id);
        } else {
            let types = JSON.parse(localStorage.getItem('id_types') || '[]');
            types = types.filter(t => t !== name);
            localStorage.setItem('id_types', JSON.stringify(types));
        }
        loadManageIdTypes();
        loadDropdownData();
    }
}

// Guest Records Management (Super Admin)
async function loadSuperAdminGuests() {
    let guests = [];
    if (supabaseClient) {
        const { data } = await supabaseClient.from('guests').select('*').order('created_at', { ascending: false });
        if (data) guests = data;
    } else {
        guests = JSON.parse(localStorage.getItem('guests') || '[]');
    }

    const container = document.getElementById('superadmin-guest-container');
    container.innerHTML = '';

    if (guests.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#777;">Tidak ada data tamu.</p>';
        return;
    }

    guests.forEach(g => {
        container.innerHTML += `
            <div class="item-row">
                <div>
                    <strong>${g.guest_id}</strong> - ${g.fullname} (${g.origin_company})<br>
                    <small>Status: ${g.status} | Dibuat: ${new Date(g.created_at).toLocaleString()}</small>
                </div>
                <button onclick="deleteGuestRecord('${g.guest_id}')" class="btn-danger" style="width:auto; padding:5px 10px; font-size:0.8rem;">Hapus</button>
            </div>
        `;
    });
}

async function deleteGuestRecord(guestId) {
    if (confirm(`Hapus permanen data tamu ${guestId}?`)) {
        if (supabaseClient) {
            await supabaseClient.from('guests').delete().eq('guest_id', guestId);
        } else {
            let guests = JSON.parse(localStorage.getItem('guests') || '[]');
            guests = guests.filter(g => g.guest_id !== guestId);
            localStorage.setItem('guests', JSON.stringify(guests));
        }
        loadSuperAdminGuests();
    }
}