// --- 1. KONFIGURASI SUPABASE ---
// Ganti dengan URL dan ANON KEY milik Anda dari Supabase Dashboard
const supabaseUrl = 'https://gyortxfcoifxzrwfogzr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5b3J0eGZjb2lmeHpyd2ZvZ3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNzE2NzEsImV4cCI6MjEwNTc0NzY3MX0.dO07GyxM9WYRMHYOE70-nJQI_TONr7SXK7loXLRdkHU';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// --- KREDENSIAL ADMIN DEFAULT & 2FA (Hanya untuk keperluan demo klien) ---
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';
const DUMMY_2FA_CODE = '123456';

// --- 2. LOGIKA HALAMAN REGISTRASI (index.html) ---
const visitorForm = document.getElementById('visitorForm');
if (visitorForm) {
    visitorForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const company = document.getElementById('company').value;
        const purpose = document.getElementById('purpose').value;
        const msg = document.getElementById('visitorMessage');

        msg.textContent = 'Menyimpan data...';
        msg.className = 'message';

        // Insert ke Supabase
        const { data, error } = await supabase
            .from('visitors')
            .insert([{ name, company, purpose }]);

        if (error) {
            msg.textContent = 'Gagal mendaftar. Silakan coba lagi.';
            msg.className = 'message error';
            console.error(error);
        } else {
            msg.textContent = 'Registrasi Berhasil! Terima kasih.';
            visitorForm.reset();
            setTimeout(() => { msg.textContent = ''; }, 3000);
        }
    });

    // Modal Login Logic
    const modal = document.getElementById('loginModal');
    const btnOpen = document.getElementById('btnOpenLogin');
    const btnClose = document.getElementById('closeLogin');
    const loginForm = document.getElementById('loginForm');
    const twoFaForm = document.getElementById('twoFaForm');
    const loginMsg = document.getElementById('loginMessage');
    const modalTitle = document.getElementById('modalTitle');

    // Buka Modal
    btnOpen.addEventListener('click', () => {
        modal.style.display = 'flex';
        loginForm.style.display = 'block';
        twoFaForm.style.display = 'none';
        modalTitle.textContent = 'Login Admin';
        loginMsg.textContent = '';
        loginForm.reset();
        twoFaForm.reset();
    });

    // Tutup Modal
    btnClose.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });

    // Submit Username & Password (Step 1)
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = document.getElementById('username').value;
        const pass = document.getElementById('password').value;

        if (user === ADMIN_USERNAME && pass === ADMIN_PASSWORD) {
            // Lanjut ke tahap 2FA
            loginForm.style.display = 'none';
            twoFaForm.style.display = 'block';
            modalTitle.textContent = 'Verifikasi 2FA';
            loginMsg.textContent = '';
        } else {
            loginMsg.textContent = 'Username atau password salah!';
        }
    });

    // Submit Kode 2FA (Step 2)
    twoFaForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const code = document.getElementById('twoFaCode').value;

        if (code === DUMMY_2FA_CODE) {
            // Simpan status login di session storage
            sessionStorage.setItem('isAdminLoggedIn', 'true');
            window.location.href = 'admin.html'; // Redirect ke dashboard
        } else {
            loginMsg.textContent = 'Kode 2FA tidak valid!';
        }
    });
}

// --- 3. LOGIKA HALAMAN DASHBOARD ADMIN (admin.html) ---
const visitorsTableBody = document.getElementById('visitorsTableBody');
if (visitorsTableBody) {
    // Proteksi Halaman: Cek apakah Admin sudah login via Session
    if (sessionStorage.getItem('isAdminLoggedIn') !== 'true') {
        alert('Anda harus login terlebih dahulu!');
        window.location.href = 'index.html';
    }

    // Fungsi fetch data dari Supabase
    async function fetchVisitors() {
        const { data, error } = await supabase
            .from('visitors')
            .select('*')
            .order('visit_date', { ascending: false }); // urutkan data terbaru

        if (error) {
            visitorsTableBody.innerHTML = `<tr><td colspan="4" class="error">Gagal memuat data</td></tr>`;
            console.error(error);
            return;
        }

        if (data.length === 0) {
            visitorsTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Belum ada tamu yang terdaftar</td></tr>`;
            return;
        }

        visitorsTableBody.innerHTML = '';
        data.forEach(visitor => {
            // Format tanggal
            const date = new Date(visitor.visit_date).toLocaleString('id-ID');
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${date}</td>
                <td><strong>${visitor.name}</strong></td>
                <td>${visitor.company}</td>
                <td>${visitor.purpose}</td>
            `;
            visitorsTableBody.appendChild(tr);
        });
    }

    // Panggil fetch data
    fetchVisitors();

    // Logika Logout
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            sessionStorage.removeItem('isAdminLoggedIn');
            window.location.href = 'index.html';
        });
    }
}