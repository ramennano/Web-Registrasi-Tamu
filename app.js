// 1. INISIALISASI SUPABASE
const SUPABASE_URL = 'https://ojlpeqhstbsuzjqccjgk.supabase.co'; // GANTI DENGAN URL SUPABASE ANDA
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qbHBlcWhzdGJzdXpqcWNjamdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNjExNTcsImV4cCI6MjEwNTczNzE1N30.hMoVGhKUBUlcktrWhsBaOk5A673irsAsYn_iMdOJKjw'; // Ganti dengan anon key Anda
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qbHBlcWhzdGJzdXpqcWNjamdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNjExNTcsImV4cCI6MjEwNTczNzE1N30.hMoVGhKUBUlcktrWhsBaOk5A673irsAsYn_iMdOJKjw'; // GANTI dengan Service Role Key Anda untuk fungsi Admin (Tambah User & Reset 2FA)

// Client Standar (Untuk tamu, login, dsb)
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Client Admin (KHUSUS untuk manajemen akun & 2FA oleh Admin)
const supabaseAdmin = window.supabase.createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Variabel Global untuk sesi Auth
let currentUser = null;
let factorId = null; 

// 2. NAVIGASI HALAMAN
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}

// 3. LOAD DROPDOWN (Instansi & Tujuan) SAAT HALAMAN DIMUAT
async function loadDropdowns() {
    const instansiSelect = document.getElementById('instansi_id');
    const tujuanSelect = document.getElementById('tujuan_id');

    // Fetch Instansi
    const { data: instansi } = await supabase.from('instansi').select('*');
    if (instansiSelect) {
        instansiSelect.innerHTML = '<option value="">-- Pilih Instansi --</option>';
        instansi?.forEach(item => {
            instansiSelect.innerHTML += `<option value="${item.id}">${item.nama_instansi}</option>`;
        });
    }

    // Fetch Tujuan
    const { data: tujuan } = await supabase.from('orang_tujuan').select('*');
    if (tujuanSelect) {
        tujuanSelect.innerHTML = '<option value="">-- Pilih Tujuan --</option>';
        tujuan?.forEach(item => {
            tujuanSelect.innerHTML += `<option value="${item.id}">${item.nama_orang}</option>`;
        });
    }
}

// 4. SUBMIT FORM TAMU (PUBLIC)
document.getElementById('form-tamu')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nama_tamu = document.getElementById('nama_tamu').value;
    const instansi_id = document.getElementById('instansi_id').value;
    const tujuan_id = document.getElementById('tujuan_id').value;
    const keperluan = document.getElementById('keperluan').value;

    const { error } = await supabase.from('tamu').insert([
        { nama_tamu, instansi_id, tujuan_id, keperluan, status: 'Pending' }
    ]);

    if (error) return alert('Gagal mengirim data! Pastikan input benar.');
    alert('Registrasi berhasil! Menunggu Approval Atasan.');
    e.target.reset();
});

// 5. LOGIN DENGAN 2FA (Diperbaiki)
async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) return alert("Email dan Password wajib diisi!");

    // Step 1: Sign In 
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) return alert("Login Gagal: " + error.message);

    // Cek apakah 2FA (MFA) Aktif untuk user ini
    const { data: mfaData, error: mfaError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    
    if (mfaData && mfaData.nextLevel === 'aal2' && mfaData.currentLevel === 'aal1') {
        // Jika butuh 2FA
        document.getElementById('login-step-1').style.display = 'none';
        document.getElementById('login-step-2').style.display = 'block';
        
        // Dapatkan faktor autentikasi pertama user
        const factors = await supabase.auth.mfa.listFactors();
        if (factors.data && factors.data.totp.length > 0) {
            const totpFactor = factors.data.totp[0];
            factorId = totpFactor.id;
            // Siapkan challenge 2FA
            await supabase.auth.mfa.challenge({ factorId });
        } else {
            alert("Terjadi kesalahan sistem 2FA.");
        }
    } else {
        // Jika tidak disetting 2FA, langsung masuk
        checkUserRole();
    }
}

// 6. VERIFIKASI KODE 2FA / TOTP
async function verify2FA() {
    const code = document.getElementById('totp-code').value;
    if (!code) return alert("Masukkan kode 2FA!");

    const challenge = await supabase.auth.mfa.challenge({ factorId });
    
    const { data, error } = await supabase.auth.mfa.verify({
        factorId: factorId,
        challengeId: challenge.data.id,
        code: code
    });

    if (error) {
        alert("Kode 2FA Salah!");
    } else {
        alert("2FA Berhasil!");
        document.getElementById('totp-code').value = '';
        checkUserRole();
    }
}

// 7. CEK ROLE USER (ADMIN ATAU ATASAN) (Diperbaiki)
async function checkUserRole() {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        return alert("Sesi login tidak valid.");
    }
    
    currentUser = user;

    // Ambil role dari tabel user_roles
    const { data: roleData, error: roleError } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single();
    
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

    // Kembalikan form login ke tahap 1 jika sewaktu-waktu logout
    document.getElementById('login-step-1').style.display = 'block';
    document.getElementById('login-step-2').style.display = 'none';
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
}

// 8. FUNGSI KHUSUS ADMIN: Tambah Instansi
async function tambahInstansi() {
    const val = document.getElementById('new-instansi').value;
    if(!val) return;
    const { error } = await supabase.from('instansi').insert([{ nama_instansi: val }]);
    if(!error) {
        alert('Instansi ditambahkan!');
        document.getElementById('new-instansi').value = '';
        loadDropdowns();
    } else {
        alert('Gagal menambahkan instansi.');
    }
}

// 9. FUNGSI KHUSUS ADMIN: Tambah Orang Tujuan
async function tambahTujuan() {
    const val = document.getElementById('new-tujuan').value;
    if(!val) return;
    const { error } = await supabase.from('orang_tujuan').insert([{ nama_orang: val }]);
    if(!error) {
        alert('Orang Tujuan ditambahkan!');
        document.getElementById('new-tujuan').value = '';
        loadDropdowns(); 
    } else {
        alert('Gagal menambahkan orang tujuan.');
    }
}

// 10. FUNGSI KHUSUS ADMIN: Tambah Akun Staff/Atasan (Baru)
async function tambahAkunStaff() {
    const email = document.getElementById('new-user-email').value;
    const password = document.getElementById('new-user-password').value;
    const role = document.getElementById('new-user-role').value;

    if (!email || !password) return alert("Email dan Password wajib diisi!");

    // Gunakan Admin API agar tidak otomatis login sebagai user baru
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true
    });

    if (error) {
        alert("Gagal membuat akun: " + error.message);
        return;
    }

    const newUserId = data.user.id;
    
    // Insert ke tabel role
    const { error: roleError } = await supabase.from('user_roles').insert([
        { user_id: newUserId, role: role }
    ]);

    if (roleError) {
        alert("Akun dibuat tapi gagal set role. Error: " + roleError.message);
    } else {
        alert("Akun berhasil dibuat dengan akses: " + role + "\nUser ID: " + newUserId);
        document.getElementById('new-user-email').value = '';
        document.getElementById('new-user-password').value = '';
    }
}

// 11. FUNGSI KHUSUS ADMIN: Reset 2FA User Lain (Baru)
async function resetUser2FA() {
    const userId = document.getElementById('reset-user-id').value;

    if (!userId) return alert("User ID wajib diisi!");

    // Dapatkan list faktor MFA untuk user tersebut
    const { data: factorsData, error: listError } = await supabaseAdmin.auth.admin.mfa.listFactors({
        userId: userId
    });

    if (listError || !factorsData.factors || factorsData.factors.length === 0) {
        return alert("Tidak ada faktor 2FA yang terdaftar untuk user ini, atau User ID salah.");
    }

    // Ambil ID faktor pertama yang aktif
    const userFactorId = factorsData.factors[0].id;

    // Hapus/Reset Faktor
    const { error: deleteError } = await supabaseAdmin.auth.admin.mfa.deleteFactor({
        id: userFactorId,
        userId: userId
    });

    if (deleteError) {
        alert("Gagal mereset 2FA: " + deleteError.message);
    } else {
        alert("2FA berhasil direset untuk user tersebut!");
        document.getElementById('reset-user-id').value = '';
    }
}

// 12. FUNGSI KHUSUS ATASAN: Load Data untuk di-Approve
async function loadApprovalList() {
    const { data, error } = await supabase
        .from('tamu')
        .select(`
            id, nama_tamu, keperluan, status, waktu_masuk,
            instansi ( nama_instansi )
        `)
        .order('waktu_masuk', { ascending: false });

    if(error) return console.log(error);

    const tbody = document.getElementById('approval-list');
    tbody.innerHTML = '';
    
    data.forEach(tamu => {
        let actionBtn = tamu.status === 'Pending' 
            ? `<button style="background:green;" onclick="approveTamu(${tamu.id})">Approve</button>` 
            : `<span style="font-weight:bold;">Selesai</span>`;

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

// 13. FUNGSI KHUSUS ATASAN: Eksekusi Approval
async function approveTamu(id) {
    const { error } = await supabase.from('tamu').update({ status: 'Approved' }).eq('id', id);
    if (!error) {
        alert("Tamu telah di-Approve!");
        loadApprovalList();
    }
}

// 14. LOGOUT
async function logout() {
    await supabase.auth.signOut();
    currentUser = null;
    document.getElementById('btn-login-nav').style.display = 'inline-block';
    document.getElementById('btn-logout').style.display = 'none';
    
    // Reset Form Login jika ada
    document.getElementById('login-step-1').style.display = 'block';
    document.getElementById('login-step-2').style.display = 'none';
    
    showPage('guest-page');
}

// Batal 2FA dan kembali ke step 1
function cancel2FA() {
    document.getElementById('login-step-2').style.display = 'none';
    document.getElementById('login-step-1').style.display = 'block';
    supabase.auth.signOut();
}

// Init saat load pertama
loadDropdowns();