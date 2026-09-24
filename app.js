// ==========================================
// KONFIGURASI SUPABASE (GANTI DENGAN MILIKMU)
// ==========================================
const SUPABASE_URL = 'https://gyortxfcoifxzrwfogzr.supabase.co; // Ganti dengan URL Anda
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5b3J0eGZjb2lmeHpyd2ZvZ3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNzE2NzEsImV4cCI6MjEwNTc0NzY3MX0.dO07GyxM9WYRMHYOE70-nJQI_TONr7SXK7loXLRdkHU'; // Ganti dengan anon key Anda

// Inisialisasi klien Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// FUNGSI NAVIGASI HALAMAN
// ==========================================
function showPage(pageId) {
    // Sembunyikan semua section
    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.remove('active');
    });
    // Tampilkan section yang dituju
    document.getElementById(pageId).classList.add('active');

    // Jika ke dashboard, load data
    if(pageId === 'admin-dashboard') {
        fetchGuests();
    }
}

// Cek status login saat halaman dimuat
async function checkAuthStatus() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (session) {
        document.getElementById('nav-login-btn').style.display = 'none';
        document.getElementById('nav-logout-btn').style.display = 'inline-block';
        showPage('admin-dashboard');
    } else {
        document.getElementById('nav-login-btn').style.display = 'inline-block';
        document.getElementById('nav-logout-btn').style.display = 'none';
        showPage('guest-page');
    }
}

// ==========================================
// LOGIKA TAMU (GUEST)
// ==========================================
document.getElementById('guest-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('guest-name').value;
    const company = document.getElementById('guest-company').value;
    const purpose = document.getElementById('guest-purpose').value;
    const messageDiv = document.getElementById('guest-message');

    // Insert ke tabel guests
    const { error } = await supabaseClient
        .from('guests')
        .insert([{ nama: name, instansi: company, keperluan: purpose }]);

    if (error) {
        messageDiv.className = 'message error';
        messageDiv.textContent = 'Gagal mendaftar. Silakan coba lagi.';
        console.error(error);
    } else {
        messageDiv.className = 'message success';
        messageDiv.textContent = 'Registrasi berhasil! Silakan tunggu konfirmasi admin.';
        document.getElementById('guest-form').reset();
    }
});

// ==========================================
// LOGIKA ADMIN LOGIN & LOGOUT
// ==========================================
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    const messageDiv = document.getElementById('login-message');

    const { error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        messageDiv.className = 'message error';
        messageDiv.textContent = 'Email atau password salah!';
    } else {
        messageDiv.style.display = 'none';
        document.getElementById('login-form').reset();
        checkAuthStatus(); // Update UI dan alihkan ke dashboard
    }
});

async function logoutAdmin() {
    await supabaseClient.auth.signOut();
    checkAuthStatus();
}

// ==========================================
// LOGIKA DASHBOARD ADMIN
// ==========================================
async function fetchGuests() {
    const tbody = document.getElementById('guests-tbody');
    tbody.innerHTML = '<tr><td colspan="6">Memuat data...</td></tr>';

    const { data, error } = await supabaseClient
        .from('guests')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching data:', error);
        tbody.innerHTML = '<tr><td colspan="6">Gagal memuat data</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    
    data.forEach(guest => {
        const tr = document.createElement('tr');
        const date = new Date(guest.created_at).toLocaleString('id-ID');
        
        let statusBadge = guest.status === 'Diberikan Akses' 
            ? '<span class="status-badge status-diberikan">Diberikan Akses</span>'
            : '<span class="status-badge status-menunggu">Menunggu</span>';

        let actionBtn = guest.status === 'Menunggu Akses' || guest.status === 'Menunggu'
            ? `<button onclick="grantAccess('${guest.id}')" class="btn-success">Beri Akses</button>`
            : '<i>Full Akses</i>';

        tr.innerHTML = `
            <td>${date}</td>
            <td>${guest.nama}</td>
            <td>${guest.instansi}</td>
            <td>${guest.keperluan}</td>
            <td>${statusBadge}</td>
            <td>${actionBtn}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Fungsi Admin untuk Memberikan Akses
async function grantAccess(id) {
    const { error } = await supabaseClient
        .from('guests')
        .update({ status: 'Diberikan Akses' })
        .eq('id', id);

    if (error) {
        alert('Gagal mengupdate status: ' + error.message);
    } else {
        fetchGuests(); // Refresh tabel setelah diupdate
    }
}

// Inisialisasi saat pertama load
checkAuthStatus();