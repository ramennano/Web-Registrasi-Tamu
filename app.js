/* ==========================================================================
   KONFIGURASI SUPABASE & STATE APLIKASI
   ========================================================================== */
const SUPABASE_URL = 'https://gyortxfcoifxzrwfogzr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5b3J0eGZjb2lmeHpyd2ZvZ3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNzE2NzEsImV4cCI6MjEwNTc0NzY3MX0.dO07GyxM9WYRMHYOE70-nJQI_TONr7SXK7loXLRdkHU';

let supabaseClient = null;
let isSupabaseActive = false;
let pendingAdminUser = null;

// Inisialisasi saat halaman dimuat
window.addEventListener('DOMContentLoaded', () => {
    initSupabaseConnection();
    setupEventListeners();
});

function initSupabaseConnection() {
    if (SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase) {
        try {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            isSupabaseActive = true;
            console.log("Terhubung ke Supabase database.");
        } catch (e) {
            console.warn("Gagal inisialisasi Supabase, menggunakan Mock Mode:", e);
        }
    }
}

/* ==========================================================================
   EVENT LISTENERS & KONTROL UI
   ========================================================================== */
function setupEventListeners() {
    const modal = document.getElementById('loginModal');
    const btnOpenLogin = document.getElementById('btnOpenLogin');
    const closeLogin = document.getElementById('closeLogin');

    // Tombol Buka Modal Login Admin
    if (btnOpenLogin) {
        btnOpenLogin.addEventListener('click', () => {
            modal.style.display = 'flex';
            document.getElementById('loginForm').style.display = 'block';
            document.getElementById('twoFaForm').style.display = 'none';
            document.getElementById('loginMessage').innerText = '';
            document.getElementById('loginForm').reset();
        });
    }

    // Tombol Tutup Modal
    if (closeLogin) {
        closeLogin.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Submit Form Tamu
    const visitorForm = document.getElementById('visitorForm');
    if (visitorForm) {
        visitorForm.addEventListener('submit', handleVisitorSubmit);
    }

    // Submit Login Step 1 (Username & Password)
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleAdminLogin);
    }

    // Submit 2FA Step 2
    const twoFaForm = document.getElementById('twoFaForm');
    if (twoFaForm) {
        twoFaForm.addEventListener('submit', handle2FAVerify);
    }
}

/* ==========================================================================
   FUNGSI REGISTRASI TAMU KE SUPABASE
   ========================================================================== */
async function handleVisitorSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const company = document.getElementById('company').value.trim();
    const purpose = document.getElementById('purpose').value.trim();
    const msgEl = document.getElementById('visitorMessage');

    try {
        if (isSupabaseActive && supabaseClient) {
            const { error } = await supabaseClient.from('visitors').insert([
                { name, company, purpose, check_in_time: new Date().toISOString(), status: 'active' }
            ]);
            if (error) throw error;
        }
        msgEl.style.color = '#16a34a';
        msgEl.innerText = 'Registrasi berhasil! Selamat datang.';
        document.getElementById('visitorForm').reset();
    } catch (err) {
        console.error(err);
        msgEl.style.color = '#dc2626';
        msgEl.innerText = 'Gagal menyimpan data: ' + err.message;
    }
}

/* ==========================================================================
   FUNGSI LOGIN ADMIN & 2FA SECURITY
   ========================================================================== */
async function handleAdminLogin(e) {
    e.preventDefault();
    const usernameInput = document.getElementById('username').value.trim();
    const passwordInput = document.getElementById('password').value.trim();
    const msgEl = document.getElementById('loginMessage');

    msgEl.innerText = '';

    try {
        let isAuthenticated = false;

        if (isSupabaseActive && supabaseClient && usernameInput.includes('@')) {
            // Cek otentikasi via Supabase Auth jika menggunakan format email
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: usernameInput,
                password: passwordInput
            });
            if (!error && data.user) {
                isAuthenticated = true;
            }
        } 
        
        // Fallback / Admin Default Default Tanpa Registrasi Email (Username: admin, Pass: admin123)
        if (!isAuthenticated) {
            if (usernameInput === 'admin' && passwordInput === 'admin123') {
                isAuthenticated = true;
            }
        }

        if (isAuthenticated) {
            pendingAdminUser = usernameInput;
            // Pindah ke tampilan 2FA Security
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('twoFaForm').style.display = 'block';
            document.getElementById('modalTitle').innerText = 'Verifikasi 2FA';
        } else {
            throw new Error('Username/Email atau Password salah!');
        }
    } catch (err) {
        msgEl.innerText = err.message || 'Gagal melakukan login admin.';
    }
}

function handle2FAVerify(e) {
    e.preventDefault();
    const code = document.getElementById('twoFaCode').value.trim();
    const msgEl = document.getElementById('loginMessage');

    // Kode verifikasi 2FA (Default demo: 123456)
    if (code === '123456') {
        localStorage.setItem('corpvisit_admin_logged', 'true');
        alert('Login Admin & 2FA Berhasil!');
        window.location.href = 'admin.html'; // Redirect ke halaman dashboard admin
    } else {
        msgEl.innerText = 'Kode 2FA salah! Gunakan kode demo: 123456';
    }
}