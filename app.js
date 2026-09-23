// 1. INISIALISASI SUPABASE
const SUPABASE_URL = 'https://ojlpeqhstbsuzjqccjgk.supabase.co'; // GANTI DENGAN URL SUPABASE ANDA
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qbHBlcWhzdGJzdXpqcWNjamdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNjExNTcsImV4cCI6MjEwNTczNzE1N30.hMoVGhKUBUlcktrWhsBaOk5A673irsAsYn_iMdOJKjw'; // GANTI DENGAN ANON KEY SUPABASE ANDA

// PERBAIKAN: Ubah nama variabel menjadi supabaseClient untuk menghindari bentrok dengan CDN global
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
    const { data: instansi } = await supabaseClient.from('instansi').select('*');
    instansiSelect.innerHTML = '<option value="">-- Pilih Instansi --</option>';
    instansi?.forEach(item => {
        instansiSelect.innerHTML += `<option value="${item.id}">${item.nama_instansi}</option>`;
    });

    // Fetch Tujuan
    const { data: tujuan } = await supabaseClient.from('orang_tujuan').select('*');
    tujuanSelect.innerHTML = '<option value="">-- Pilih Tujuan --</option>';
    tujuan?.forEach(item => {
        tujuanSelect.innerHTML += `<option value="${item.id}">${item.nama_orang}</option>`;
    });
}

// 4. SUBMIT FORM TAMU (PUBLIC)
document.getElementById('form-tamu').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nama_tamu = document.getElementById('nama_tamu').value;
    const instansi_id = document.getElementById('instansi_id').value;
    const tujuan_id = document.getElementById('tujuan_id').value;
    const keperluan = document.getElementById('keperluan').value;

    const { error } = await supabaseClient.from('tamu').insert([
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

    // Step 1: Sign In 
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    
    if (error) return alert("Login Gagal: " + error.message);

    // Cek apakah 2FA (MFA) Aktif untuk user ini
    const { data: mfaData, error: mfaError } = await supabaseClient.auth.mfa.getAuthenticatorAssuranceLevel();
    
    // PERBAIKAN: Pastikan mfaData tidak null sebelum mengecek level
    if (mfaData && mfaData.nextLevel === 'aal2' && mfaData.currentLevel === 'aal1') {
        // Jika butuh 2FA
        document.getElementById('login-step-1').style.display = 'none';
        document.getElementById('login-step-2').style.display = 'block';
        
        // Dapatkan faktor autentikasi pertama user
        const factors = await supabaseClient.auth.mfa.listFactors();
        const totpFactor = factors.data.totp[0];
        factorId = totpFactor.id;

        // Siapkan challenge 2FA
        await supabaseClient.auth.mfa.challenge({ factorId });
    } else {
        // Jika tidak disetting 2FA, langsung masuk
        checkUserRole();
    }
}

// 6. VERIFIKASI KODE 2FA / TOTP
async function verify2FA() {
    const code = document.getElementById('totp-code').value;
    
    const { data, error } = await supabaseClient.auth.mfa.verify({
        factorId: factorId,
        challengeId: (await supabaseClient.auth.mfa.challenge({ factorId })).data.id,
        code: code
    });

    if (error) {
        alert("Kode 2FA Salah!");
    } else {
        alert("2FA Berhasil!");
        checkUserRole();
    }
}

// 7. CEK ROLE USER (ADMIN ATAU ATASAN)
async function checkUserRole() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    currentUser = user;

    // Ambil role dari tabel user_roles
    const { data: roleData } = await supabaseClient.from('user_roles').select('role').eq('user_id', user.id).single();
    
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

// 8. FUNGSI KHUSUS ADMIN: Tambah Instansi
async function tambahInstansi() {
    const val = document.getElementById('new-instansi').value;
    if(!val) return;
    const { error } = await supabaseClient.from('instansi').insert([{ nama_instansi: val }]);
    if(!error) {
        alert('Instansi ditambahkan!');
        document.getElementById('new-instansi').value = '';
        loadDropdowns(); // Update dropdown di form depan
    } else {
        alert('Gagal menambah instansi: ' + error.message);
    }
}

// 9. FUNGSI KHUSUS ADMIN: Tambah Orang Tujuan
async function tambahTujuan() {
    const val = document.getElementById('new-tujuan').value;
    if(!val) return;
    const { error } = await supabaseClient.from('orang_tujuan').insert([{ nama_orang: val }]);
    if(!error) {
        alert('Orang Tujuan ditambahkan!');
        document.getElementById('new-tujuan').value = '';
        loadDropdowns(); // Update dropdown di form depan
    } else {
         alert('Gagal menambah tujuan: ' + error.message);
    }
}

// 10. FUNGSI KHUSUS ATASAN: Load Data untuk di-Approve
async function loadApprovalList() {
    // Join tabel menggunakan sintaks relasi Supabase
    const { data, error } = await supabaseClient
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
            : `<span>Selesai</span>`;

        // Mencegah error jika data relasi instansi terhapus atau kosong
        let namaInstansi = tamu.instansi ? tamu.instansi.nama_instansi : 'Tidak Diketahui';

        tbody.innerHTML += `
            <tr>
                <td>${new Date(tamu.waktu_masuk).toLocaleString('id-ID')}</td>
                <td>${tamu.nama_tamu}</td>
                <td>${namaInstansi}</td>
                <td>${tamu.keperluan}</td>
                <td class="badge-${tamu.status.toLowerCase()}">${tamu.status}</td>
                <td>${actionBtn}</td>
            </tr>
        `;
    });
}

// 11. FUNGSI KHUSUS ATASAN: Eksekusi Approval
async function approveTamu(id) {
    const { error } = await supabaseClient.from('tamu').update({ status: 'Approved' }).eq('id', id);
    if (!error) {
        alert("Tamu telah di-Approve!");
        loadApprovalList(); // Refresh tabel
    }
}

// 12. LOGOUT
async function logout() {
    await supabaseClient.auth.signOut();
    currentUser = null;
    document.getElementById('btn-login-nav').style.display = 'inline-block';
    document.getElementById('btn-logout').style.display = 'none';
    showPage('guest-page');
    window.location.reload();
}

// Init saat load pertama
loadDropdowns();