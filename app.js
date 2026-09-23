// 1. INISIALISASI SUPABASE
const SUPABASE_URL = 'https://ojlpeqhstbsuzjqccjgk.supabase.co'; // GANTI DENGAN URL SUPABASE ANDA
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qbHBlcWhzdGJzdXpqcWNjamdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNjExNTcsImV4cCI6MjEwNTczNzE1N30.hMoVGhKUBUlcktrWhsBaOk5A673irsAsYn_iMdOJKjw'; // GANTI DENGAN ANON KEY SUPABASE ANDA
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qbHBlcWhzdGJzdXpqcWNjamdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNjExNTcsImV4cCI6MjEwNTczNzE1N30.hMoVGhKUBUlcktrWhsBaOk5A673irsAsYn_iMdOJKjw'; // WAJIB untuk Tambah Akun & Reset 2FA

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Client khusus untuk otorisasi bypass admin (Jangan diekspos di web publik produksi sebenarnya)
const supabaseAdmin = window.supabase.createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

// Variabel Global untuk sesi Auth
let currentUser = null;
let factorId = null; 

// 2. NAVIGASI HALAMAN
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}

// 3. LOAD DROPDOWN (Instansi & Tujuan)
async function loadDropdowns() {
    try {
        const instansiSelect = document.getElementById('instansi_id');
        const tujuanSelect = document.getElementById('tujuan_id');

        const { data: instansi } = await supabase.from('instansi').select('*');
        if(instansi) {
            instansiSelect.innerHTML = '<option value="">-- Pilih Instansi --</option>';
            instansi.forEach(item => {
                instansiSelect.innerHTML += `<option value="${item.id}">${item.nama_instansi}</option>`;
            });
        }

        const { data: tujuan } = await supabase.from('orang_tujuan').select('*');
        if(tujuan) {
            tujuanSelect.innerHTML = '<option value="">-- Pilih Tujuan --</option>';
            tujuan.forEach(item => {
                tujuanSelect.innerHTML += `<option value="${item.id}">${item.nama_orang}</option>`;
            });
        }
    } catch (err) {
        console.error("Gagal memuat dropdown, abaikan jika tabel belum dibuat:", err);
    }
}

// 4. SUBMIT FORM TAMU (PUBLIC)
document.getElementById('form-tamu').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nama_tamu = document.getElementById('nama_tamu').value;
    const instansi_id = document.getElementById('instansi_id').value;
    const tujuan_id = document.getElementById('tujuan_id').value;
    const keperluan = document.getElementById('keperluan').value;

    const { error } = await supabase.from('tamu').insert([
        { nama_tamu, instansi_id, tujuan_id, keperluan, status: 'Pending' }
    ]);

    if (error) return alert('Gagal mengirim data!');
    alert('Registrasi berhasil! Menunggu Approval Atasan.');
    e.target.reset();
});

// 5. LOGIN DENGAN 2FA
async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return alert("Login Gagal: " + error.message);

    const { data: mfaData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    
    if (mfaData && mfaData.nextLevel === 'aal2' && mfaData.currentLevel === 'aal1') {
        const factors = await supabase.auth.mfa.listFactors();
        if (factors.data && factors.data.totp && factors.data.totp.length > 0) {
            factorId = factors.data.totp[0].id;
            document.getElementById('login-step-1').style.display = 'none';
            document.getElementById('login-step-2').style.display = 'block';
            await supabase.auth.mfa.challenge({ factorId });
            return;
        }
    } 
    
    // Jika tidak disetting 2FA, langsung masuk
    checkUserRole();
}

// 6. VERIFIKASI KODE 2FA / TOTP
async function verify2FA() {
    const code = document.getElementById('totp-code').value;
    const challenge = await supabase.auth.mfa.challenge({ factorId });
    
    const { error } = await supabase.auth.mfa.verify({
        factorId: factorId,
        challengeId: challenge.data.id,
        code: code
    });

    if (error) {
        alert("Kode 2FA Salah!");
    } else {
        alert("2FA Berhasil!");
        document.getElementById('login-step-2').style.display = 'none';
        document.getElementById('login-step-1').style.display = 'block';
        checkUserRole();
    }
}

// 7. CEK ROLE USER (ADMIN ATAU ATASAN)
async function checkUserRole() {
    const { data: { user } } = await supabase.auth.getUser();
    if(!user) return;
    
    currentUser = user;
    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single();
    
    document.getElementById('btn-login-nav').style.display = 'none';
    document.getElementById('btn-logout').style.display = 'inline-block';

    if (roleData && roleData.role === 'admin') {
        showPage('admin-page');
    } else if (roleData && roleData.role === 'atasan') {
        showPage('atasan-page');
        loadApprovalList();
    } else {
        alert("Anda tidak memiliki akses role (Bukan Admin/Atasan).");
        logout();
    }
}

// 8. FUNGSI ADMIN: Tambah Akun / Otorisasi
async function tambahAkun() {
    const email = document.getElementById('new-user-email').value;
    const password = document.getElementById('new-user-password').value;
    const role = document.getElementById('new-user-role').value;

    if(!email || !password) return alert('Email dan Password wajib diisi!');

    // Buat user menggunakan Service Key agar admin tidak ter-logout
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true
    });

    if (error) return alert('Gagal membuat akun: ' + error.message);

    // Set role di database
    const { error: roleError } = await supabase.from('user_roles').insert([
        { user_id: data.user.id, role: role }
    ]);

    if (roleError) {
        alert('Akun terbuat tapi gagal mengeset Role: ' + roleError.message);
    } else {
        alert('Akun ' + role + ' berhasil ditambahkan!');
        document.getElementById('new-user-email').value = '';
        document.getElementById('new-user-password').value = '';
    }
}

// 9. FUNGSI ADMIN: Reset 2FA User Lain
async function reset2FA() {
    const email = document.getElementById('reset-mfa-email').value;
    if(!email) return alert('Masukkan email user!');

    // Cari user berdasarkan email
    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    if(usersError) return alert('Gagal mengambil daftar pengguna');

    const targetUser = usersData.users.find(u => u.email === email);
    if(!targetUser) return alert('User tidak ditemukan!');

    // Ambil faktor 2FA user tersebut
    const { data: factors, error: factorError } = await supabaseAdmin.auth.admin.mfa.listFactors({
        userId: targetUser.id
    });

    if (factors && factors.factors.length > 0) {
        for (const factor of factors.factors) {
            await supabaseAdmin.auth.admin.mfa.unenroll({
                userId: targetUser.id,
                factorId: factor.id
            });
        }
        alert('2FA berhasil direset untuk user: ' + email);
    } else {
        alert('User ini tidak memiliki 2FA yang aktif.');
    }
}

// 10. FUNGSI ADMIN: Tambah Instansi & Tujuan
async function tambahInstansi() {
    const val = document.getElementById('new-instansi').value;
    if(!val) return;
    const { error } = await supabase.from('instansi').insert([{ nama_instansi: val }]);
    if(!error) {
        alert('Instansi ditambahkan!');
        document.getElementById('new-instansi').value = '';
        loadDropdowns();
    }
}

async function tambahTujuan() {
    const val = document.getElementById('new-tujuan').value;
    if(!val) return;
    const { error } = await supabase.from('orang_tujuan').insert([{ nama_orang: val }]);
    if(!error) {
        alert('Orang Tujuan ditambahkan!');
        document.getElementById('new-tujuan').value = '';
        loadDropdowns(); 
    }
}

// 11. FUNGSI ATASAN: Approval Tamu
async function loadApprovalList() {
    const { data, error } = await supabase
        .from('tamu')
        .select(`id, nama_tamu, keperluan, status, waktu_masuk, instansi ( nama_instansi )`)
        .order('waktu_masuk', { ascending: false });

    if(error) return console.log(error);

    const tbody = document.getElementById('approval-list');
    tbody.innerHTML = '';
    
    data.forEach(tamu => {
        let actionBtn = tamu.status === 'Pending' 
            ? `<button style="background:green;" onclick="approveTamu(${tamu.id})">Approve</button>` 
            : `<span>Selesai</span>`;

        tbody.innerHTML += `
            <tr>
                <td>${new Date(tamu.waktu_masuk).toLocaleString('id-ID')}</td>
                <td>${tamu.nama_tamu}</td>
                <td>${tamu.instansi?.nama_instansi || '-'}</td>
                <td>${tamu.keperluan}</td>
                <td class="badge-${tamu.status.toLowerCase()}">${tamu.status}</td>
                <td>${actionBtn}</td>
            </tr>
        `;
    });
}

async function approveTamu(id) {
    const { error } = await supabase.from('tamu').update({ status: 'Approved' }).eq('id', id);
    if (!error) {
        alert("Tamu telah di-Approve!");
        loadApprovalList();
    }
}

// 12. LOGOUT
async function logout() {
    await supabase.auth.signOut();
    currentUser = null;
    document.getElementById('btn-login-nav').style.display = 'inline-block';
    document.getElementById('btn-logout').style.display = 'none';
    showPage('guest-page');
}

// Inisialisasi DOM
document.addEventListener("DOMContentLoaded", () => {
    loadDropdowns();
});