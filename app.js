// Konfigurasi Supabase Anda (Ganti dengan URL dan Anon Key dari dashboard Supabase Anda)
const SUPABASE_URL = 'https://gyortxfcoifxzrwfogzr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5b3J0eGZjb2lmeHpyd2ZvZ3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNzE2NzEsImV4cCI6MjEwNTc0NzY3MX0.dO07GyxM9WYRMHYOE70-nJQI_TONr7SXK7loXLRdkHU';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- NAVIGASI ---
function showView(viewId) {
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
}

// --- INISIALISASI ---
window.onload = async () => {
    await loadWebSettings();
    await loadApprovedCompanies();
};

async function loadWebSettings() {
    const { data, error } = await supabase.from('web_settings').select('*');
    if (data) {
        data.forEach(setting => {
            if (setting.setting_key === 'company_name' && setting.setting_value) {
                document.getElementById('app-company-name').innerText = setting.setting_value;
                document.title = setting.setting_value;
            }
            if (setting.setting_key === 'logo_url' && setting.setting_value) {
                const logoObj = document.getElementById('app-logo');
                logoObj.src = setting.setting_value;
                logoObj.style.display = 'inline-block';
            }
            if (setting.setting_key === 'wallpaper_url' && setting.setting_value) {
                document.body.style.backgroundImage = `url('${setting.setting_value}')`;
            }
        });
    }
}

async function loadApprovedCompanies() {
    const { data } = await supabase.from('approved_companies').select('company_name');
    if (data) {
        const datalist = document.getElementById('approved-companies');
        datalist.innerHTML = '';
        data.forEach(pt => {
            const option = document.createElement('option');
            option.value = pt.company_name;
            datalist.appendChild(option);
        });
    }
}

// --- FITUR TAMU (GUEST) ---
async function handleRegister(e) {
    e.preventDefault();
    const guestId = 'GST' + Date.now().toString().slice(-6);
    
    const guestData = {
        guest_id: guestId,
        fullname: document.getElementById('reg-name').value,
        id_type: document.getElementById('reg-id-type').value,
        origin_company: document.getElementById('reg-company').value,
        purpose: document.getElementById('reg-purpose').value,
        status: 'Pending'
    };

    const { error } = await supabase.from('guests').insert([guestData]);
    
    if (error) {
        alert("Gagal registrasi: " + error.message);
    } else {
        alert(`Registrasi Berhasil!\nSimpan ID Tamu Anda: ${guestId}`);
        document.getElementById('form-register').reset();
        showView('view-status');
    }
}

async function checkStatus() {
    const id = document.getElementById('check-guest-id').value;
    const resultDiv = document.getElementById('status-result');
    
    const { data, error } = await supabase.from('guests').select('*').eq('guest_id', id).single();
    
    resultDiv.style.display = 'block';
    if (error || !data) {
        resultDiv.className = 'notif rejected';
        resultDiv.innerText = 'ID Tamu tidak ditemukan.';
    } else {
        let msg = `Tamu: ${data.fullname} <br> Status: <strong>${data.status}</strong>`;
        if (data.status === 'Approved') {
            resultDiv.className = 'notif success';
            msg += '<br>Silahkan masuk. Akses Approve Berhasil!';
        } else if (data.status === 'Rejected') {
            resultDiv.className = 'notif rejected';
        } else {
            resultDiv.className = 'notif pending';
        }
        resultDiv.innerHTML = msg;
    }
}

// --- FITUR LOGIN (ADMIN & SUPER ADMIN) ---
let currentUserRole = null;

async function handleLogin() {
    const user = document.getElementById('login-username').value;
    const pass = document.getElementById('login-password').value;

    const { data, error } = await supabase.from('users')
        .select('*')
        .eq('username', user)
        .eq('password', pass)
        .single();

    if (data) {
        currentUserRole = data.role;
        document.getElementById('login-username').value = '';
        document.getElementById('login-password').value = '';
        if (data.role === 'super_admin') showView('view-superadmin');
        if (data.role === 'admin') showView('view-admin');
    } else {
        alert('Username atau password salah!');
    }
}

function logout() {
    currentUserRole = null;
    showView('view-home');
}

// --- FITUR ADMIN ---
async function loadGuestsForAdmin() {
    const { data } = await supabase.from('guests').select('*').order('created_at', { ascending: false });
    const list = document.getElementById('admin-guest-list');
    list.innerHTML = '';
    
    if (data) {
        data.forEach(g => {
            list.innerHTML += `
                <div style="border-bottom:1px solid #ccc; padding:10px 0;">
                    <strong>${g.guest_id}</strong> - ${g.fullname} (${g.origin_company})<br>
                    Tujuan: ${g.purpose} | Status: ${g.status}<br>
                    <button onclick="updateStatus('${g.id}', 'Approved')" class="btn-secondary" style="width:auto; padding:5px; margin-top:5px;">Approve</button>
                    <button onclick="updateStatus('${g.id}', 'Rejected')" class="btn-danger" style="width:auto; padding:5px;">Reject</button>
                </div>
            `;
        });
    }
}

async function updateStatus(id, newStatus) {
    await supabase.from('guests').update({ status: newStatus }).eq('id', id);
    if(currentUserRole === 'admin') loadGuestsForAdmin();
}

// --- FITUR SUPER ADMIN ---
async function loadGuestsForSuperAdmin() {
    const { data } = await supabase.from('guests').select('*').order('created_at', { ascending: false });
    const list = document.getElementById('sa-guest-list');
    list.innerHTML = '';
    
    if (data) {
        data.forEach(g => {
            list.innerHTML += `
                <div style="border-bottom:1px solid #ccc; padding:10px 0;">
                    <strong>${g.guest_id}</strong> - ${g.fullname} | Status: ${g.status}
                    <button onclick="deleteGuest('${g.id}')" class="btn-danger" style="width:auto; padding:5px; float:right;">Hapus Data</button>
                </div>
            `;
        });
    }
}

async function deleteGuest(id) {
    if(confirm('Yakin ingin menghapus tamu ini secara permanen?')) {
        await supabase.from('guests').delete().eq('id', id);
        loadGuestsForSuperAdmin();
    }
}

async function saveConfiguration() {
    const ptName = document.getElementById('config-pt-name').value;
    const logoFile = document.getElementById('config-logo').files[0];
    const wallFile = document.getElementById('config-wallpaper').files[0];

    if (ptName) {
        await supabase.from('web_settings').update({ setting_value: ptName }).eq('setting_key', 'company_name');
    }

    if (logoFile) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            await supabase.from('web_settings').update({ setting_value: e.target.result }).eq('setting_key', 'logo_url');
            loadWebSettings();
        };
        reader.readAsDataURL(logoFile); // Convert file to base64 for local storage emulation
    }

    if (wallFile) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            await supabase.from('web_settings').update({ setting_value: e.target.result }).eq('setting_key', 'wallpaper_url');
            loadWebSettings();
        };
        reader.readAsDataURL(wallFile);
    }

    alert('Konfigurasi disimpan!');
    setTimeout(loadWebSettings, 500);
}

async function resetConfiguration() {
    if(confirm('Yakin ingin mereset konfigurasi UI (Nama PT, Logo, Wallpaper)?')) {
        await supabase.from('web_settings').update({ setting_value: 'PT Default Nama' }).eq('setting_key', 'company_name');
        await supabase.from('web_settings').update({ setting_value: '' }).eq('setting_key', 'logo_url');
        await supabase.from('web_settings').update({ setting_value: '' }).eq('setting_key', 'wallpaper_url');
        
        document.getElementById('app-logo').style.display = 'none';
        document.body.style.backgroundImage = 'none';
        loadWebSettings();
        alert('Konfigurasi di-reset!');
    }
}

// --- MULTI-LANGUAGE DICTIONARY ---
const dictionary = {
    id: { welcome: "Selamat Datang", getStarted: "Get Started (Registrasi Tamu)", checkStatus: "Sudah Registrasi? Cek Status / Login", regTitle: "Registrasi Tamu" },
    en: { welcome: "Welcome", getStarted: "Get Started (Guest Registration)", checkStatus: "Already Registered? Check Status / Login", regTitle: "Guest Registration" }
};

function changeLanguage() {
    const lang = document.getElementById('lang-select').value;
    document.getElementById('txt-welcome').innerText = dictionary[lang].welcome;
    document.getElementById('btn-get-started').innerText = dictionary[lang].getStarted;
    document.getElementById('link-cek-status').innerText = dictionary[lang].checkStatus;
    document.getElementById('txt-reg').innerText = dictionary[lang].regTitle;
}