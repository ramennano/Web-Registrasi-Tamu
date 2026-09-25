const SUPABASE_URL = 'https://gyortxfcoifxzrwfogzr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5b3J0eGZjb2lmeHpyd2ZvZ3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNzE2NzEsImV4cCI6MjEwNTc0NzY3MX0.dO07GyxM9WYRMHYOE70-nJQI_TONr7SXK7loXLRdkHU';

let supabaseClient = null;
try {
    if (window.supabase && SUPABASE_URL !== 'https://YOUR_PROJECT_ID.supabase.co') {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
} catch (e) {
    console.warn("Supabase initialization failed, running local fallback mode.");
}

const isConnected = () => supabaseClient !== null;

function showView(viewId) {
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
}

window.onload = async () => {
    await loadWebSettings();
    await loadDropdownData();
};

async function loadWebSettings() {
    if (isConnected()) {
        const { data } = await supabaseClient.from('web_settings').select('*');
        if (data) {
            data.forEach(s => {
                if (s.setting_key === 'company_name' && s.setting_value) {
                    document.getElementById('app-company-name').innerText = s.setting_value;
                    document.getElementById('page-title').innerText = s.setting_value;
                }
                if (s.setting_key === 'logo_url' && s.setting_value) {
                    const logo = document.getElementById('app-logo');
                    logo.src = s.setting_value;
                    logo.style.display = 'block';
                }
                if (s.setting_key === 'wallpaper_url' && s.setting_value) {
                    document.body.style.backgroundImage = `url('${s.setting_value}')`;
                }
            });
        }
    } else {
        const cName = localStorage.getItem('vms_company_name');
        const cLogo = localStorage.getItem('vms_logo_url');
        const cWall = localStorage.getItem('vms_wallpaper_url');
        if (cName) {
            document.getElementById('app-company-name').innerText = cName;
            document.getElementById('page-title').innerText = cName;
        }
        if (cLogo) {
            const logo = document.getElementById('app-logo');
            logo.src = cLogo;
            logo.style.display = 'block';
        }
        if (cWall) {
            document.body.style.backgroundImage = `url('${cWall}')`;
        }
    }
}

async function loadDropdownData() {
    const idTypeSelect = document.getElementById('reg-id-type');
    idTypeSelect.innerHTML = '<option value="" disabled selected>Pilih Jenis ID</option>';
    
    let idTypesList = ['KTP', 'SIM', 'Paspor', 'ID Card Karyawan'];
    if (isConnected()) {
        const { data } = await supabaseClient.from('id_types').select('type_name');
        if (data && data.length > 0) {
            idTypesList = data.map(d => d.type_name);
        }
    } else {
        const localIdTypes = JSON.parse(localStorage.getItem('vms_id_types'));
        if (localIdTypes) idTypesList = localIdTypes;
    }
    idTypesList.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        idTypeSelect.appendChild(opt);
    });

    const companyDatalist = document.getElementById('approved-companies-list');
    companyDatalist.innerHTML = '';
    let compsList = ['PT Teknologi Nusantara', 'PT Maju Bersama Jaya', 'PT Global Mandiri'];
    if (isConnected()) {
        const { data } = await supabaseClient.from('approved_companies').select('company_name');
        if (data && data.length > 0) {
            compsList = data.map(d => d.company_name);
        }
    } else {
        const localComps = JSON.parse(localStorage.getItem('vms_companies'));
        if (localComps) compsList = localComps;
    }
    compsList.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        companyDatalist.appendChild(opt);
    });
}

async function handleRegister(e) {
    e.preventDefault();
    const guestId = 'GST' + Date.now().toString().slice(-8);
    const fullname = document.getElementById('reg-name').value;
    const idType = document.getElementById('reg-id-type').value;
    const originCompany = document.getElementById('reg-company').value;
    const purpose = document.getElementById('reg-purpose').value;

    const newGuest = {
        guest_id: guestId,
        fullname,
        id_type: idType,
        origin_company: originCompany,
        purpose,
        status: 'Pending',
        created_at: new Date().toISOString()
    };

    if (isConnected()) {
        const { error } = await supabaseClient.from('guests').insert([newGuest]);
        if (error) {
            alert('Gagal registrasi: ' + error.message);
            return;
        }
    } else {
        let guests = JSON.parse(localStorage.getItem('vms_guests') || '[]');
        guests.push(newGuest);
        localStorage.setItem('vms_guests', JSON.stringify(guests));
    }

    alert(`Registrasi Berhasil!\nNomor Registrasi / ID Tamu Anda adalah: ${guestId}\nHarap simpan ID ini untuk pengecekan status.`);
    document.getElementById('form-register').reset();
    showView('view-status');
    document.getElementById('check-guest-id').value = guestId;
    checkStatus();
}

async function checkStatus() {
    const guestId = document.getElementById('check-guest-id').value.trim();
    const resultDiv = document.getElementById('status-result');
    resultDiv.style.display = 'block';

    if (!guestId) {
        resultDiv.className = 'notif rejected';
        resultDiv.innerText = 'Mohon masukkan Nomor Registrasi / ID Tamu.';
        return;
    }

    let guest = null;
    if (isConnected()) {
        const { data, error } = await supabaseClient.from('guests').select('*').eq('guest_id', guestId).single();
        if (!error && data) guest = data;
    } else {
        const guests = JSON.parse(localStorage.getItem('vms_guests') || '[]');
        guest = guests.find(g => g.guest_id === guestId);
    }

    if (!guest) {
        resultDiv.className = 'notif rejected';
        resultDiv.innerText = 'ID Tamu tidak ditemukan di database.';
    } else {
        let msg = `Nama: ${guest.fullname} | PT: ${guest.origin_company}<br>Status Kunjungan: <strong>${guest.status}</strong>`;
        if (guest.status === 'Approved') {
            resultDiv.className = 'notif success';
            msg += '<br><span style="font-size:1.1rem; color:#155724;">✅ Akses Approve! Silakan memasuki area kunjungan.</span>';
        } else if (guest.status === 'Rejected') {
            resultDiv.className = 'notif rejected';
            msg += '<br>❌ Maaf, kunjungan ditolak.';
        } else {
            resultDiv.className = 'notif pending';
            msg += '<br>⏳ Menunggu persetujuan admin.';
        }
        resultDiv.innerHTML = msg;
    }
}

let currentUserRole = null;

async function handleLogin() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();

    if (!username || !password) {
        alert('Mohon isi username dan password.');
        return;
    }

    let user = null;
    if (isConnected()) {
        const { data } = await supabaseClient.from('users').select('*').eq('username', username).eq('password', password).single();
        if (data) user = data;
    } else {
        let users = JSON.parse(localStorage.getItem('vms_users') || '[]');
        if (users.length === 0) {
            users = [
                { username: 'superadmin', password: 'super123', role: 'super_admin' },
                { username: 'admin', password: 'admin123', role: 'admin' }
            ];
            localStorage.setItem('vms_users', JSON.stringify(users));
        }
        user = users.find(u => u.username === username && u.password === password);
    }

    if (user) {
        currentUserRole = user.role;
        document.getElementById('login-username').value = '';
        document.getElementById('login-password').value = '';
        if (user.role === 'super_admin') {
            showView('view-superadmin');
        } else {
            showView('view-admin');
            loadGuestsForAdmin();
        }
    } else {
        alert('Username atau password salah!');
    }
}

async function handleResetPassword() {
    const username = document.getElementById('reset-username').value.trim();
    const newPassword = document.getElementById('reset-new-password').value.trim();

    if (!username || !newPassword) {
        alert('Mohon isi username dan password baru.');
        return;
    }

    if (isConnected()) {
        const { data } = await supabaseClient.from('users').select('*').eq('username', username).single();
        if (!data) {
            alert('Username tidak ditemukan.');
            return;
        }
        const { error } = await supabaseClient.from('users').update({ password: newPassword }).eq('username', username);
        if (error) {
            alert('Gagal mereset password: ' + error.message);
            return;
        }
    } else {
        let users = JSON.parse(localStorage.getItem('vms_users') || '[]');
        const uIndex = users.findIndex(u => u.username === username);
        if (uIndex === -1) {
            alert('Username tidak ditemukan.');
            return;
        }
        users[uIndex].password = newPassword;
        localStorage.setItem('vms_users', JSON.stringify(users));
    }

    alert('Password berhasil direset! Silakan login dengan password baru.');
    document.getElementById('reset-username').value = '';
    document.getElementById('reset-new-password').value = '';
    showView('view-status');
}

function logout() {
    currentUserRole = null;
    showView('view-home');
}

async function loadGuestsForAdmin() {
    const listDiv = document.getElementById('admin-guest-list');
    listDiv.innerHTML = '<div style="padding:15px; text-align:center;">Memuat data...</div>';

    let guests = [];
    if (isConnected()) {
        const { data } = await supabaseClient.from('guests').select('*').order('created_at', { ascending: false });
        if (data) guests = data;
    } else {
        guests = JSON.parse(localStorage.getItem('vms_guests') || '[]');
    }

    if (guests.length === 0) {
        listDiv.innerHTML = '<div style="padding:15px; text-align:center; color:#666;">Belum ada data tamu.</div>';
        return;
    }

    let html = '';
    guests.forEach(g => {
        html += `
            <div class="guest-item">
                <strong>ID: ${g.guest_id}</strong> | ${g.fullname} (${g.origin_company})<br>
                Tujuan: ${g.purpose}<br>
                Status: <span style="font-weight:bold; color:${g.status==='Approved'?'green':(g.status==='Rejected'?'red':'orange')}">${g.status}</span><br>
                <div style="margin-top:8px; display:flex; gap:8px;">
                    <button onclick="updateGuestStatus('${g.guest_id}', 'Approved')" class="btn-secondary" style="padding:5px 10px; font-size:0.85rem; width:auto;">Approve</button>
                    <button onclick="updateGuestStatus('${g.guest_id}', 'Rejected')" class="btn-danger" style="padding:5px 10px; font-size:0.85rem; width:auto;">Reject</button>
                </div>
            </div>
        `;
    });
    listDiv.innerHTML = html;
}

async function updateGuestStatus(guestId, newStatus) {
    if (isConnected()) {
        await supabaseClient.from('guests').update({ status: newStatus }).eq('guest_id', guestId);
    } else {
        let guests = JSON.parse(localStorage.getItem('vms_guests') || '[]');
        const idx = guests.findIndex(g => g.guest_id === guestId);
        if (idx !== -1) {
            guests[idx].status = newStatus;
            localStorage.setItem('vms_guests', JSON.stringify(guests));
        }
    }
    loadGuestsForAdmin();
}

async function loadGuestsForSuperAdmin() {
    const listDiv = document.getElementById('sa-guest-list');
    listDiv.innerHTML = '<div style="padding:15px; text-align:center;">Memuat data...</div>';

    let guests = [];
    if (isConnected()) {
        const { data } = await supabaseClient.from('guests').select('*').order('created_at', { ascending: false });
        if (data) guests = data;
    } else {
        guests = JSON.parse(localStorage.getItem('vms_guests') || '[]');
    }

    if (guests.length === 0) {
        listDiv.innerHTML = '<div style="padding:15px; text-align:center; color:#666;">Belum ada data tamu.</div>';
        return;
    }

    let html = '';
    guests.forEach(g => {
        html += `
            <div class="guest-item" style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <strong>${g.guest_id}</strong> - ${g.fullname} (${g.origin_company})<br>
                    <small>Status: ${g.status} | Waktu: ${new Date(g.created_at).toLocaleString()}</small>
                </div>
                <button onclick="deleteGuestRecord('${g.guest_id}')" class="btn-danger" style="width:auto; padding:6px 12px; font-size:0.85rem;">Hapus</button>
            </div>
        `;
    });
    listDiv.innerHTML = html;
}

async function deleteGuestRecord(guestId) {
    if (confirm(`Yakin ingin menghapus data tamu dengan ID ${guestId}?`)) {
        if (isConnected()) {
            await supabaseClient.from('guests').delete().eq('guest_id', guestId);
        } else {
            let guests = JSON.parse(localStorage.getItem('vms_guests') || '[]');
            guests = guests.filter(g => g.guest_id !== guestId);
            localStorage.setItem('vms_guests', JSON.stringify(guests));
        }
        loadGuestsForSuperAdmin();
    }
}

async function addApprovedCompany() {
    const compName = document.getElementById('new-company-name').value.trim();
    if (!compName) return alert('Masukkan nama PT.');

    if (isConnected()) {
        const { error } = await supabaseClient.from('approved_companies').insert([{ company_name: compName }]);
        if (error) {
            alert('Gagal menambahkan PT: ' + error.message);
            return;
        }
    } else {
        let comps = JSON.parse(localStorage.getItem('vms_companies') || '["PT Teknologi Nusantara", "PT Maju Bersama Jaya", "PT Global Mandiri"]');
        if (!comps.includes(compName)) {
            comps.push(compName);
            localStorage.setItem('vms_companies', JSON.stringify(comps));
        }
    }
    alert('PT berhasil ditambahkan ke whitelist!');
    document.getElementById('new-company-name').value = '';
    loadDropdownData();
}

async function addIdType() {
    const idTypeName = document.getElementById('new-id-type').value.trim();
    if (!idTypeName) return alert('Masukkan jenis ID.');

    if (isConnected()) {
        const { error } = await supabaseClient.from('id_types').insert([{ type_name: idTypeName }]);
        if (error) {
            alert('Gagal menambahkan Jenis ID: ' + error.message);
            return;
        }
    } else {
        let types = JSON.parse(localStorage.getItem('vms_id_types') || '["KTP", "SIM", "Paspor", "ID Card Karyawan"]');
        if (!types.includes(idTypeName)) {
            types.push(idTypeName);
            localStorage.setItem('vms_id_types', JSON.stringify(types));
        }
    }
    alert('Jenis ID berhasil ditambahkan!');
    document.getElementById('new-id-type').value = '';
    loadDropdownData();
}

async function saveConfiguration() {
    const ptName = document.getElementById('config-pt-name').value.trim();
    const logoFile = document.getElementById('config-logo').files[0];
    const wallFile = document.getElementById('config-wallpaper').files[0];

    if (ptName) {
        if (isConnected()) {
            await supabaseClient.from('web_settings').update({ setting_value: ptName }).eq('setting_key', 'company_name');
        } else {
            localStorage.setItem('vms_company_name', ptName);
        }
    }

    if (logoFile) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64Logo = e.target.result;
            if (isConnected()) {
                await supabaseClient.from('web_settings').update({ setting_value: base64Logo }).eq('setting_key', 'logo_url');
            } else {
                localStorage.setItem('vms_logo_url', base64Logo);
            }
            loadWebSettings();
        };
        reader.readAsDataURL(logoFile);
    }

    if (wallFile) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64Wall = e.target.result;
            if (isConnected()) {
                await supabaseClient.from('web_settings').update({ setting_value: base64Wall }).eq('setting_key', 'wallpaper_url');
            } else {
                localStorage.setItem('vms_wallpaper_url', base64Wall);
            }
            loadWebSettings();
        };
        reader.readAsDataURL(wallFile);
    }

    alert('Konfigurasi web berhasil disimpan!');
    setTimeout(loadWebSettings, 500);
}

async function resetConfiguration() {
    if (confirm('Yakin ingin menghapus dan mereset semua konfigurasi website (Nama PT, Logo, Wallpaper)?')) {
        if (isConnected()) {
            await supabaseClient.from('web_settings').update({ setting_value: 'Sistem Manajemen Tamu' }).eq('setting_key', 'company_name');
            await supabaseClient.from('web_settings').update({ setting_value: '' }).eq('setting_key', 'logo_url');
            await supabaseClient.from('web_settings').update({ setting_value: '' }).eq('setting_key', 'wallpaper_url');
        } else {
            localStorage.removeItem('vms_company_name');
            localStorage.removeItem('vms_logo_url');
            localStorage.removeItem('vms_wallpaper_url');
        }
        document.getElementById('app-logo').style.display = 'none';
        document.body.style.backgroundImage = 'none';
        loadWebSettings();
        alert('Konfigurasi web telah direset!');
    }
}

const langData = {
    id: {
        welcome: "Selamat Datang di Portal Kunjungan Tamu",
        welcomeDesc: "Silakan klik tombol di bawah untuk melakukan registrasi kunjungan baru atau mengecek status kunjungan Anda.",
        getStarted: "Get Started",
        gotoStatus: "Cek Status & Login Admin",
        regTitle: "Form Registrasi Tamu",
        lblFullname: "Nama Lengkap",
        lblIdType: "Jenis ID",
        lblCompany: "Asal Instansi / Perusahaan",
        lblPurpose: "Tujuan Kunjungan",
        btnSubmitReg: "Daftar Sekarang",
        back1: "Kembali",
        back2: "Kembali",
        back3: "Kembali",
        statusTitle: "Cek Status Kunjungan & Login",
        checkHeading: "Cek Status Approve Tamu",
        checkDesc: "Masukkan Nomor Registrasi / ID Tamu Anda untuk memeriksa status.",
        btnCheckStatus: "Cek Status",
        loginHeading: "Admin & Super Admin Login",
        btnLoginSubmit: "Login",
        linkReset: "Lupa / Reset Password?",
        resetTitle: "Reset Password",
        resetDesc: "Masukkan username akun Admin / Super Admin serta password baru Anda.",
        btnResetSubmit: "Simpan Password Baru"
    },
    en: {
        welcome: "Welcome to Visitor Management Portal",
        welcomeDesc: "Please click the button below to register a new visit or check your visit status.",
        getStarted: "Get Started",
        gotoStatus: "Check Status & Admin Login",
        regTitle: "Guest Registration Form",
        lblFullname: "Full Name",
        lblIdType: "ID Type",
        lblCompany: "Origin Company / Institution",
        lblPurpose: "Purpose of Visit",
        btnSubmitReg: "Register Now",
        back1: "Back",
        back2: "Back",
        back3: "Back",
        statusTitle: "Check Visit Status & Login",
        checkHeading: "Check Guest Approval Status",
        checkDesc: "Enter your Registration Number / Guest ID to check status.",
        btnCheckStatus: "Check Status",
        loginHeading: "Admin & Super Admin Login",
        btnLoginSubmit: "Login",
        linkReset: "Forgot / Reset Password?",
        resetTitle: "Reset Password",
        resetDesc: "Enter your Admin / Super Admin username and your new password.",
        btnResetSubmit: "Save New Password"
    }
};

function changeLanguage() {
    const lang = document.getElementById('lang-select').value;
    const t = langData[lang];
    if (!t) return;

    document.getElementById('txt-welcome').innerText = t.welcome;
    document.getElementById('txt-welcome-desc').innerText = t.welcomeDesc;
    document.getElementById('btn-get-started').innerText = t.getStarted;
    document.getElementById('btn-goto-status').innerText = t.gotoStatus;
    document.getElementById('txt-reg-title').innerText = t.regTitle;
    document.getElementById('lbl-fullname').innerText = t.lblFullname;
    document.getElementById('lbl-idtype').innerText = t.lblIdType;
    document.getElementById('lbl-company').innerText = t.lblCompany;
    document.getElementById('lbl-purpose').innerText = t.lblPurpose;
    document.getElementById('btn-submit-reg').innerText = t.btnSubmitReg;
    document.getElementById('btn-back-1').innerText = t.back1;
    document.getElementById('btn-back-2').innerText = t.back2;
    document.getElementById('btn-back-3').innerText = t.back3;
    document.getElementById('txt-status-title').innerText = t.statusTitle;
    document.getElementById('txt-check-heading').innerText = t.checkHeading;
    document.getElementById('txt-check-desc').innerText = t.checkDesc;
    document.getElementById('btn-check-status').innerText = t.btnCheckStatus;
    document.getElementById('txt-login-heading').innerText = t.loginHeading;
    document.getElementById('btn-login-submit').innerText = t.btnLoginSubmit;
    document.getElementById('link-reset').innerText = t.linkReset;
    document.getElementById('txt-reset-title').innerText = t.resetTitle;
    document.getElementById('txt-reset-desc').innerText = t.resetDesc;
    document.getElementById('btn-reset-submit').innerText = t.btnResetSubmit;
}
