// ==================== KONFIGURASI SUPABASE ====================
// Ganti dengan URL dan Anon Key dari Project Supabase Anda
const SUPABASE_URL = 'https://gyortxfcoifxzrwfogzr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5b3J0eGZjb2lmeHpyd2ZvZ3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNzE2NzEsImV4cCI6MjEwNTc0NzY3MX0.dO07GyxM9WYRMHYOE70-nJQI_TONr7SXK7loXLRdkHU';

// Inisialisasi Supabase Client (jika gagal/offline, otomatis fallback ke LocalStorage)
let supabase = null;
try {
    if (window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
} catch (e) {
    console.warn("Supabase tidak aktif, beralih ke local storage mode.");
}

// ==================== NAVIGASI ANTAR TAMPILAN ====================
function showView(viewId) {
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    
    // Refresh data spesifik ketika masuk ke view tertentu
    if (viewId === 'view-status') {
        loadPublicBookingCodes();
    }
    if (viewId === 'view-register') {
        loadFormDropdowns();
    }
}

// ==================== INISIALISASI & MULTI-LANGUAGE ====================
window.onload = async () => {
    await loadWebSettings();
    await loadFormDropdowns();
    
    // Listener untuk mendukung tombol Enter pada form login
    const loginForm = document.getElementById('form-login');
    if (loginForm) {
        loginForm.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                handleLogin(event);
            }
        });
    }
};

const dictionary = {
    id: {
        welcome: "Selamat Datang di Portal Tamu",
        desc: "Silakan mulai pendaftaran kunjungan Anda atau periksa status kunjungan.",
        getStarted: "Get Started (Registrasi Tamu)",
        goStatus: "Cek Status Kunjungan / Booking",
        goLogin: "Login Admin & Super Admin",
        regTitle: "Registrasi Tamu",
        fullname: "Nama Lengkap:",
        idtype: "Jenis ID:",
        idnum: "Nomor Identitas (No ID):",
        company: "Asal Instansi / Perusahaan:",
        purpose: "Tujuan Kunjungan:",
        submitReg: "Kirim Pendaftaran",
        back: "Kembali",
        statusTitle: "Cek Status Kunjungan",
        checkDesc: "Masukkan ID Tamu / Nomor Registrasi / Kode Booking Anda:",
        checkBtn: "Cek Status",
        bookingList: "Daftar Kode Booking Tamu Terdaftar",
        loginTitle: "Login Admin & Super Admin",
        resetTitle: "Reset Password Akun"
    },
    en: {
        welcome: "Welcome to Guest Portal",
        desc: "Please start your visit registration or check your visit status.",
        getStarted: "Get Started (Guest Registration)",
        goStatus: "Check Visit Status / Booking",
        goLogin: "Admin & Super Admin Login",
        regTitle: "Guest Registration",
        fullname: "Full Name:",
        idtype: "ID Type:",
        idnum: "ID Number (No ID):",
        company: "Origin Company / Institution:",
        purpose: "Purpose of Visit:",
        submitReg: "Submit Registration",
        back: "Back",
        statusTitle: "Check Visit Status",
        checkDesc: "Enter your Guest ID / Registration No / Booking Code:",
        checkBtn: "Check Status",
        bookingList: "List of Registered Booking Codes",
        loginTitle: "Admin & Super Admin Login",
        resetTitle: "Reset Account Password"
    }
};

function changeLanguage() {
    const lang = document.getElementById('lang-select').value;
    const dict = dictionary[lang];
    
    document.getElementById('txt-welcome').innerText = dict.welcome;
    document.getElementById('txt-desc').innerText = dict.desc;
    document.getElementById('btn-get-started').innerText = dict.getStarted;
    document.getElementById('btn-go-status').innerText = dict.goStatus;
    document.getElementById('btn-go-login').innerText = dict.goLogin;
    document.getElementById('txt-reg-title').innerText = dict.regTitle;
    document.getElementById('lbl-fullname').innerText = dict.fullname;
    document.getElementById('lbl-idtype').innerText = dict.idtype;
    document.getElementById('lbl-idnum').innerText = dict.idnum;
    document.getElementById('lbl-company').innerText = dict.company;
    document.getElementById('lbl-purpose').innerText = dict.purpose;
    document.getElementById('btn-submit-reg').innerText = dict.submitReg;
    document.getElementById('txt-status-title').innerText = dict.statusTitle;
    document.getElementById('txt-check-desc').innerText = dict.checkDesc;
    document.getElementById('btn-check-status').innerText = dict.checkBtn;
    document.getElementById('txt-booking-list').innerText = dict.bookingList;
    document.getElementById('txt-login-title').innerText = dict.loginTitle;
    document.getElementById('txt-reset-title').innerText = dict.resetTitle;
    
    document.querySelectorAll('.btn-back').forEach(btn => btn.innerText = dict.back);
}

// ==================== WEB SETTINGS & TAMPILAN DINAMIS ====================
async function loadWebSettings() {
    if (!supabase) return;
    const { data } = await supabase.from('web_settings').select('*');
    if (data) {
        data.forEach(item => {
            if (item.setting_key === 'company_name' && item.setting_value) {
                document.getElementById('app-company-name').innerText = item.setting_value;
                document.title = item.setting_value;
                const saInput = document.getElementById('sa-company-name');
                if(saInput) saInput.value = item.setting_value;
            }
            if (item.setting_key === 'logo_url' && item.setting_value) {
                const logo = document.getElementById('app-logo');
                logo.src = item.setting_value;
                logo.style.display = 'inline-block';
            }
            if (item.setting_key === 'wallpaper_url' && item.setting_value) {
                document.body.style.backgroundImage = `url('${item.setting_value}')`;
            }
        });
    }
}

async function loadFormDropdowns() {
    // Load ID Types
    let idTypes = ['KTP', 'SIM', 'Paspor'];
    if (supabase) {
        const { data } = await supabase.from('id_types').select('type_name');
        if (data && data.length > 0) idTypes = data.map(i => i.type_name);
    }
    const idSelect = document.getElementById('reg-id-type');
    idSelect.innerHTML = '<option value="" disabled selected>Pilih Jenis ID</option>';
    idTypes.forEach(t => {
        idSelect.innerHTML += `<option value="${t}">${t}</option>`;
    });

    // Load Approved Companies (Whitelist)
    let companies = ['PT Telkom Indonesia', 'PT Bank Mandiri'];
    if (supabase) {
        const { data } = await supabase.from('approved_companies').select('company_name');
        if (data && data.length > 0) companies = data.map(c => c.company_name);
    }
    const datalist = document.getElementById('approved-companies-list');
    datalist.innerHTML = '';
    companies.forEach(c => {
        datalist.innerHTML += `<option value="${c}">`;
    });
}

// ==================== REGISTRASI TAMU ====================
async function handleRegister(e) {
    e.preventDefault();
    const guestId = 'GST-' + Math.floor(100000 + Math.random() * 900000);
    
    const payload = {
        guest_id: guestId,
        fullname: document.getElementById('reg-name').value,
        id_type: document.getElementById('reg-id-type').value,
        id_number: document.getElementById('reg-id-number').value,
        origin_company: document.getElementById('reg-company').value,
        purpose: document.getElementById('reg-purpose').value,
        status: 'Pending'
    };

    if (supabase) {
        const { error } = await supabase.from('guests').insert([payload]);
        if (error) {
            alert('Gagal mendaftarkan tamu: ' + error.message);
            return;
        }
    } else {
        // Fallback local storage
        let localGuests = JSON.parse(localStorage.getItem('local_guests') || '[]');
        localGuests.push(payload);
        localStorage.setItem('local_guests', JSON.stringify(localGuests));
    }

    alert(`Registrasi Berhasil!\nNomor Registrasi / Kode Booking Anda: ${guestId}\nSimpan kode ini untuk mengecek status.`);
    document.getElementById('form-register').reset();
    showView('view-status');
}

// ==================== CEK STATUS & REALTIME DATABASE ====================
async function checkStatusRealtime() {
    const id = document.getElementById('check-guest-id').value.trim();
    const notif = document.getElementById('status-result-notif');
    notif.style.display = 'block';

    if (!id) {
        notif.className = 'notif-box rejected';
        notif.innerText = 'Mohon masukkan ID Tamu atau Kode Booking.';
        return;
    }

    let guest = null;
    if (supabase) {
        const { data } = await supabase.from('guests').select('*').eq('guest_id', id).single();
        guest = data;
    } else {
        let localGuests = JSON.parse(localStorage.getItem('local_guests') || '[]');
        guest = localGuests.find(g => g.guest_id === id);
    }

    if (!guest) {
        notif.className = 'notif-box rejected';
        notif.innerText = 'Kode Booking / ID Tamu tidak ditemukan di database.';
    } else {
        if (guest.status === 'Approved') {
            notif.className = 'notif-box success';
            notif.innerHTML = `Status: <strong>APPROVED (Disetujui)</strong><br>Nama: ${guest.fullname}<br>Instansi: ${guest.origin_company}<br><em>Akses Kunjungan Diberikan. Silakan Masuk.</em>`;
        } else if (guest.status === 'Rejected') {
            notif.className = 'notif-box rejected';
            notif.innerHTML = `Status: <strong>REJECTED (Ditolak)</strong><br>Mohon hubungi resepsionis.`;
        } else {
            notif.className = 'notif-box pending';
            notif.innerHTML = `Status: <strong>PENDING (Menunggu Persetujuan Admin)</strong>`;
        }
    }
}

async function loadPublicBookingCodes() {
    const listDiv = document.getElementById('public-booking-list');
    listDiv.innerHTML = 'Memuat data...';
    
    let guests = [];
    if (supabase) {
        const { data } = await supabase.from('guests').select('guest_id, fullname, origin_company, status').order('id', { ascending: false }).limit(10);
        if (data) guests = data;
    } else {
        guests = JSON.parse(localStorage.getItem('local_guests') || '[]');
    }

    listDiv.innerHTML = '';
    if (guests.length === 0) {
        listDiv.innerHTML = '<p style="text-align:center; color:#777;">Belum ada data kunjungan.</p>';
        return;
    }

    guests.forEach(g => {
        listDiv.innerHTML += `
            <div class="item-row">
                <span><strong>${g.guest_id}</strong> - ${g.fullname} (${g.origin_company})</span>
                <span style="font-weight:bold; color:${g.status==='Approved'?'green':g.status==='Rejected'?'red':'orange'}">${g.status}</span>
            </div>
        `;
    });
}

// ==================== LOGIN ADMIN & SUPER ADMIN ====================
let loggedInRole = null;

async function handleLogin(e) {
    if(e) e.preventDefault();
    const user = document.getElementById('login-username').value.trim();
    const pass = document.getElementById('login-password').value.trim();

    let validUser = null;
    if (supabase) {
        const { data } = await supabase.from('users').select('*').eq('username', user).eq('password', pass).single();
        validUser = data;
    } else {
        // Fallback default users
        if (user === 'superadmin' && pass === 'super123') validUser = { role: 'super_admin' };
        if (user === 'admin' && pass === 'admin123') validUser = { role: 'admin' };
    }

    if (validUser) {
        loggedInRole = validUser.role;
        document.getElementById('login-username').value = '';
        document.getElementById('login-password').value = '';

        if (loggedInRole === 'super_admin') {
            showView('view-superadmin');
            loadSuperAdminWhitelist();
        } else {
            showView('view-admin');
            loadAdminData();
        }
    } else {
        alert('Username atau Password salah!');
    }
}

function logout() {
    loggedInRole = null;
    showView('view-home');
}

// ==================== RESET PASSWORD ====================
async function handleResetPassword() {
    const user = document.getElementById('reset-username').value.trim();
    const newPass = document.getElementById('reset-new-password').value.trim();

    if (!user || !newPass) {
        alert('Harap isi username dan password baru.');
        return;
    }

    if (supabase) {
        const { error } = await supabase.from('users').update({ password: newPass }).eq('username', user);
        if (error) {
            alert('Gagal mereset password: ' + error.message);
            return;
        }
    }
    alert('Password berhasil diubah! Silakan login kembali.');
    showView('view-login');
}

// ==================== DASHBOARD ADMIN ====================
async function loadAdminData() {
    const pendingDiv = document.getElementById('admin-pending-list');
    const historyDiv = document.getElementById('admin-history-list');
    pendingDiv.innerHTML = 'Memuat...';
    historyDiv.innerHTML = 'Memuat...';

    let guests = [];
    if (supabase) {
        const { data } = await supabase.from('guests').select('*').order('id', { ascending: false });
        if (data) guests = data;
    } else {
        guests = JSON.parse(localStorage.getItem('local_guests') || '[]');
    }

    pendingDiv.innerHTML = '';
    historyDiv.innerHTML = '';

    let pendingCount = 0;
    let historyCount = 0;

    guests.forEach(g => {
        if (g.status === 'Pending') {
            pendingCount++;
            pendingDiv.innerHTML += `
                <div class="item-row" style="flex-direction: column; align-items: flex-start; gap: 5px;">
                    <div><strong>ID: ${g.guest_id}</strong> | ${g.fullname} (${g.origin_company})</div>
                    <div>Tujuan: ${g.purpose}</div>
                    <div style="display:flex; gap:10px; width:100%; margin-top:5px;">
                        <button onclick="updateGuestStatus('${g.id || g.guest_id}', 'Approved')" class="btn-secondary" style="padding:5px;">Approve</button>
                        <button onclick="updateGuestStatus('${g.id || g.guest_id}', 'Rejected')" class="btn-danger" style="padding:5px;">Reject</button>
                    </div>
                </div>
            `;
        } else if (g.status === 'Approved') {
            historyCount++;
            historyDiv.innerHTML += `
                <div class="item-row">
                    <span><strong>${g.guest_id}</strong> - ${g.fullname} (${g.origin_company})</span>
                    <span style="color: green; font-weight: bold;">Approved / Selesai</span>
                </div>
            `;
        }
    });

    if (pendingCount === 0) pendingDiv.innerHTML = '<p style="color:#777;">Tidak ada permintaan pending.</p>';
    if (historyCount === 0) historyDiv.innerHTML = '<p style="color:#777;">Belum ada history tamu approved.</p>';
}

async function updateGuestStatus(identifier, status) {
    if (supabase) {
        // Cek apakah identifier UUID/angka atau string guest_id
        const isNumeric = !isNaN(identifier);
        let query = supabase.from('guests').update({ status: status });
        if (isNumeric) query = query.eq('id', identifier);
        else query = query.eq('guest_id', identifier);
        
        await query;
    } else {
        let localGuests = JSON.parse(localStorage.getItem('local_guests') || '[]');
        let target = localGuests.find(g => g.guest_id === identifier || g.id === identifier);
        if (target) target.status = status;
        localStorage.setItem('local_guests', JSON.stringify(localGuests));
    }
    loadAdminData();
}

// ==================== DASHBOARD SUPER ADMIN ====================
async function saveWebConfiguration() {
    const ptName = document.getElementById('sa-company-name').value.trim();
    const logoFile = document.getElementById('sa-logo-file').files[0];
    const wallpaperFile = document.getElementById('sa-wallpaper-file').files[0];

    if (supabase) {
        if (ptName) {
            await supabase.from('web_settings').update({ setting_value: ptName }).eq('setting_key', 'company_name');
        }
        if (logoFile) {
            const reader = new FileReader();
            reader.onload = async function(e) {
                await supabase.from('web_settings').update({ setting_value: e.target.result }).eq('setting_key', 'logo_url');
                loadWebSettings();
            };
            reader.readAsDataURL(logoFile);
        }
        if (wallpaperFile) {
            const reader = new FileReader();
            reader.onload = async function(e) {
                await supabase.from('web_settings').update({ setting_value: e.target.result }).eq('setting_key', 'wallpaper_url');
                loadWebSettings();
            };
            reader.readAsDataURL(wallpaperFile);
        }
    }
    alert('Konfigurasi Website berhasil disimpan!');
    setTimeout(loadWebSettings, 500);
}

async function resetAllConfiguration() {
    if (confirm('Yakin ingin menghapus dan mereset seluruh konfigurasi website ke awal?')) {
        if (supabase) {
            await supabase.from('web_settings').update({ setting_value: 'PT Solusi Teknologi Indonesia' }).eq('setting_key', 'company_name');
            await supabase.from('web_settings').update({ setting_value: '' }).eq('setting_key', 'logo_url');
            await supabase.from('web_settings').update({ setting_value: '' }).eq('setting_key', 'wallpaper_url');
        }
        document.body.style.backgroundImage = 'none';
        document.getElementById('app-logo').style.display = 'none';
        alert('Semua konfigurasi web berhasil direset!');
        loadWebSettings();
    }
}

async function addApprovedCompany() {
    const pt = document.getElementById('new-pt-input').value.trim();
    if (!pt) return;
    
    if (supabase) {
        await supabase.from('approved_companies').insert([{ company_name: pt }]);
    }
    document.getElementById('new-pt-input').value = '';
    loadSuperAdminWhitelist();
    loadFormDropdowns();
}

async function addIdType() {
    const idt = document.getElementById('new-idtype-input').value.trim();
    if (!idt) return;

    if (supabase) {
        await supabase.from('id_types').insert([{ type_name: idt }]);
    }
    document.getElementById('new-idtype-input').value = '';
    loadSuperAdminWhitelist();
    loadFormDropdowns();
}

async function loadSuperAdminWhitelist() {
    const display = document.getElementById('sa-whitelist-display');
    if (!supabase) return;
    
    const { data: comp } = await supabase.from('approved_companies').select('company_name');
    const { data: idt } = await supabase.from('id_types').select('type_name');

    let html = '<strong>Daftar PT Whitelist:</strong><br>';
    if (comp) comp.forEach(c => html += `- ${c.company_name}<br>`);
    
    html += '<br><strong>Daftar Jenis ID:</strong><br>';
    if (idt) idt.forEach(i => html += `- ${i.type_name}<br>`);

    display.innerHTML = html;
}

async function loadSuperAdminGuests() {
    const listDiv = document.getElementById('sa-guest-management-list');
    listDiv.innerHTML = 'Memuat data tamu...';

    let guests = [];
    if (supabase) {
        const { data } = await supabase.from('guests').select('*').order('id', { ascending: false });
        if (data) guests = data;
    } else {
        guests = JSON.parse(localStorage.getItem('local_guests') || '[]');
    }

    listDiv.innerHTML = '';
    if (guests.length === 0) {
        listDiv.innerHTML = '<p style="color:#777;">Tidak ada data tamu terekam.</p>';
        return;
    }

    guests.forEach(g => {
        listDiv.innerHTML += `
            <div class="item-row">
                <span><strong>${g.guest_id}</strong> - ${g.fullname} (${g.origin_company}) [${g.status}]</span>
                <button onclick="deleteGuestRecord('${g.id || g.guest_id}')" class="btn-danger" style="width:auto; padding:4px 8px; font-size:12px;">Hapus</button>
            </div>
        `;
    });
}

async function deleteGuestRecord(identifier) {
    if (confirm('Yakin ingin menghapus data tamu ini secara permanen?')) {
        if (supabase) {
            const isNumeric = !isNaN(identifier);
            let query = supabase.from('guests').delete();
            if (isNumeric) query = query.eq('id', identifier);
            else query = query.eq('guest_id', identifier);
            await query;
        } else {
            let localGuests = JSON.parse(localStorage.getItem('local_guests') || '[]');
            localGuests = localGuests.filter(g => g.guest_id !== identifier && g.id !== identifier);
            localStorage.setItem('local_guests', JSON.stringify(localGuests));
        }
        loadSuperAdminGuests();
    }
}