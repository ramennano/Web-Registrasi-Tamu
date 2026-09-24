/* ==========================================================================
   KONFIGURASI SUPABASE & STATE
   ========================================================================== */
const SUPABASE_URL = 'https://gyortxfcoifxzrwfogzr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5b3J0eGZjb2lmeHpyd2ZvZ3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNzE2NzEsImV4cCI6MjEwNTc0NzY3MX0.dO07GyxM9WYRMHYOE70-nJQI_TONr7SXK7loXLRdkHU';

let supabaseClient = null;
let isSupabaseActive = false;

window.addEventListener('DOMContentLoaded', () => {
    initSupabaseConnection();
    setupEventListeners();
});

function initSupabaseConnection() {
    if (SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase) {
        try {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            isSupabaseActive = true;
        } catch (e) {
            console.warn("Mode Mock Aktif:", e);
        }
    }
}

function setupEventListeners() {
    const modal = document.getElementById('loginModal');
    const btnOpenLogin = document.getElementById('btnOpenLogin');
    const closeLogin = document.getElementById('closeLogin');

    if (btnOpenLogin) {
        btnOpenLogin.addEventListener('click', () => {
            modal.style.display = 'flex';
            document.getElementById('loginForm').style.display = 'block';
            document.getElementById('twoFaForm').style.display = 'none';
            document.getElementById('loginMessage').innerText = '';
            document.getElementById('loginForm').reset();
        });
    }

    if (closeLogin) {
        closeLogin.addEventListener('click', () => modal.style.display = 'none');
    }

    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });

    const visitorForm = document.getElementById('visitorForm');
    if (visitorForm) {
        visitorForm.addEventListener('submit', handleVisitorSubmit);
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleAdminLoginStep1);
    }

    const twoFaForm = document.getElementById('twoFaForm');
    if (twoFaForm) {
        twoFaForm.addEventListener('submit', handleAdminLoginStep2);
    }
}

// 1. Registrasi Permohonan Tamu
async function handleVisitorSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const company = document.getElementById('company').value.trim();
    const host = document.getElementById('host').value.trim();
    const purpose = document.getElementById('purpose').value.trim();
    const msgEl = document.getElementById('visitorMessage');

    try {
        if (isSupabaseActive && supabaseClient) {
            const { error } = await supabaseClient.from('visitors').insert([
                { name, company, host, purpose, status: 'Pending', check_in_time: new Date().toISOString() }
            ]);
            if (error) throw error;
        }
        msgEl.style.color = '#16a34a';
        msgEl.innerText = 'Permohonan akses berhasil dikirim! Menunggu konfirmasi Admin.';
        document.getElementById('visitorForm').reset();
    } catch (err) {
        msgEl.style.color = '#dc2626';
        msgEl.innerText = 'Gagal mengirim permohonan: ' + err.message;
    }
}

// 2. Login Admin Step 1 (Tanpa Registrasi Email, Menggunakan Default Admin)
async function handleAdminLoginStep1(e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const msgEl = document.getElementById('loginMessage');

    msgEl.innerText = '';

    // Autentikasi default admin
    if (username === 'admin' && password === 'admin123') {
        // Lanjut ke Step 2 (2FA Verification)
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('twoFaForm').style.display = 'block';
        document.getElementById('modalTitle').innerText = 'Keamanan 2FA';
    } else {
        msgEl.innerText = 'Username atau Password admin salah!';
    }
}

// 3. Login Admin Step 2 (Verifikasi 2FA Security)
function handleAdminLoginStep2(e) {
    e.preventDefault();
    const code = document.getElementById('twoFaCode').value.trim();
    const msgEl = document.getElementById('loginMessage');

    // Validasi kode 2FA (Kode simulasi: 123456)
    if (code === '123456') {
        localStorage.setItem('admin_logged', 'true');
        window.location.href = 'admin.html';
    } else {
        msgEl.innerText = 'Kode 2FA salah! Masukkan kode: 123456';
    }
}