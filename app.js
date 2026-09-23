// 1. INISIALISASI SUPABASE
const SUPABASE_URL = 'https://ojlpeqhstbsuzjqccjgk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qbHBlcWhzdGJzdXpqcWNjamdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNjExNTcsImV4cCI6MjEwNTczNzE1N30.hMoVGhKUBUlcktrWhsBaOk5A673irsAsYn_iMdOJKjw';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variabel Global
let currentUser = null;
let factorId = null;

// 2. NAVIGASI HALAMAN
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(pageId);
    if(target) target.classList.add('active');
}

// 3. LOAD DROPDOWN (Instansi & Tujuan)
async function loadDropdowns() {
    const instansiSelect = document.getElementById('instansi_id');
    const tujuanSelect = document.getElementById('tujuan_id');

    const { data: instansi } = await supabase.from('instansi').select('*');
    if (instansiSelect) {
        instansiSelect.innerHTML = '<option value="">-- Pilih Instansi --</option>';
        instansi?.forEach(item => {
            instansiSelect.innerHTML += `<option value="${item.id}">${item.nama_instansi}</option>`;
        });
    }

    const { data: tujuan } = await supabase.from('orang_tujuan').select('*');
    if (tujuanSelect) {
        tujuanSelect.innerHTML = '<option value="">-- Pilih Tujuan --</option>';
        tujuan?.forEach(item => {
            tujuanSelect.innerHTML += `<option value="${item.id}">${item.nama_orang}</option>`;
        });
    }
}

// 4. SUBMIT FORM TAMU (PUBLIC)
const formTamu = document.getElementById('form-tamu');
if (formTamu) {
    formTamu.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nama_tamu = document.getElementById('nama_tamu').value;
        const instansi_id = document.getElementById('instansi_id').value;
        const tujuan_id = document.getElementById('tujuan_id').value;
        const keperluan = document.getElementById('keperluan').value;

        const { error } = await supabase.from('tamu').insert([
            { nama_tamu, instansi_id, tujuan_id, keperluan, status: 'Pending' }
        ]);

        if (error) return alert('Gagal mengirim data: ' + error.message);
        alert('Registrasi berhasil! Menunggu Approval Atasan.');
        e.target.reset();
    });
}

// 5. LOGIN DENGAN 2FA
async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return alert("Login Gagal: " + error.message);

    // Cek level autentikasi MFA / 2FA
    const { data: mfaData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    
    if (mfaData && mfaData.nextLevel === 'aal2' && mfaData.currentLevel === 'aal1') {
        document.getElementById('login-step-1').style.display = 'none';
        document.getElementById('login-step-2').style.display = 'block';
        
        const factors = await supabase.auth.mfa.listFactors();
        if (factors.data && factors.data.totp.length > 0) {
            const totpFactor = factors.data.totp[0];
            factorId = totpFactor.id;
            await supabase.auth.mfa.challenge({ factorId });
        }
    } else {
        checkUserRole();
    }
}

// 6. VERIFIKASI KODE 2FA / TOTP
async function verify2FA() {
    const code = document.getElementById('totp-code').value;
    
    const challengeRes = await supabase.auth.mfa.challenge({ factorId });
    if(challengeRes.error) return alert("Gagal memproses tantangan 2FA.");

    const { error } = await supabase.auth.mfa.verify({
        factorId: factorId,
        challengeId: challengeRes.data.id,
        code: code
    });

    if (error) {
        alert("Kode 2FA Salah!");
    } else {
        alert("Verifikasi 2FA Berhasil!");
        checkUserRole();
    }
}

// 7. CEK ROLE USER (ADMIN ATAU ATASAN)
async function checkUserRole() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    currentUser = user;

    const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

    document.getElementById('btn-login-nav').style.display = 'none';
    document.getElementById('btn-logout').style.display = 'inline-block';

    if (roleData && roleData.role === 'admin') {
        document.getElementById('btn-admin-nav').style.display = 'inline-block';
        showPage('admin-page');
        loadUserManagement();
    } else if (roleData && roleData.role === 'atasan') {
        document.getElementById('btn-atasan-nav').style.display = 'inline-block';
        showPage('atasan-page');
        loadApprovalList();
    } else {
        alert("Anda tidak memiliki akses yang sesuai.");
        logout();
    }
}

// 8. FUNGSI ADMIN: Tambah Instansi & Tujuan
async function tambahInstansi() {
    const val = document.getElementById('new-instansi').value;
    if(!val) return;
    const { error } = await supabase.from('instansi').insert([{ nama_instansi: val }]);
    if(!error) {
        alert('Instansi berhasil ditambahkan!');
        document.getElementById('new-instansi').value = '';
        loadDropdowns();
    } else {
        alert("Gagal menambahkan instansi: " + error.message);
    }
}

async function tambahTujuan() {
    const val = document.getElementById('new-tujuan').value;
    if(!val) return;
    const { error } = await supabase.from('orang_tujuan').insert([{ nama_orang: val }]);
    if(!error) {
        alert('Orang Tujuan berhasil ditambahkan!');
        document.getElementById('new-tujuan').value = '';
        loadDropdowns();
    } else {
        alert("Gagal menambahkan orang tujuan: " + error.message);
    }
}

// 9. FUNGSI ADMIN: Otorisasi Penambahan User Baru
async function tambahUserBaru() {
    const email = document.getElementById('new-user-email').value;
    const password = document.getElementById('new-user-password').value;
    const role = document.getElementById('new-user-role').value;

    if (!email || !password) {
        return alert("Email dan password wajib diisi!");
    }

    // Registrasi User ke Auth Supabase
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password
    });

    if (error) {
        return alert("Gagal membuat akun: " + error.message);
    }

    if (data.user) {
        // Simpan Role User ke Tabel user_roles
        const { error: roleError } = await supabase.from('user_roles').insert([
            { user_id: data.user.id, email: email, role: role }
        ]);

        if (roleError) {
            alert("Akun terbuat tetapi gagal menetapkan role: " + roleError.message);
        } else {
            alert("Akun berhasil dibuat!");
            document.getElementById('new-user-email').value = '';
            document.getElementById('new-user-password').value = '';
            loadUserManagement();
        }
    }
}

// 10. FUNGSI ADMIN: Load & Manajemen Reset 2FA User
async function loadUserManagement() {
    const tbody = document.getElementById('user-list');
    if(!tbody) return;

    const { data: users, error } = await supabase.from('user_roles').select('*');
    if (error) return console.error(error);

    tbody.innerHTML = '';
    users.forEach(user => {
        tbody.innerHTML += `
            <tr>
                <td>${user.email || user.user_id}</td>
                <td><span style="text-transform: capitalize;">${user.role}</span></td>
                <td><span style="color: green;">Aktif</span></td>
                <td>
                    <button style="background: #e74c3c;" onclick="reset2FA('${user.user_id}')">Reset 2FA</button>
                </td>
            </tr>
        `;
    });
}

// FUNGSI ADMIN: Reset 2FA Pengguna
async function reset2FA(userId) {
    if (!confirm("Apakah Anda yakin ingin mereset 2FA untuk user ini?")) return;

    // Menghapus/Unenroll MFA factor jika dipanggil oleh sesi yang berwenang
    // atau memanggil RPC Function jika dikonfigurasi di Supabase DB
    const { data: factors } = await supabase.auth.mfa.listFactors();
    if (factors && factors.totp) {
        for (const factor of factors.totp) {
            await supabase.auth.mfa.unenroll({ factorId: factor.id });
        }
    }

    alert("Permintaan Reset 2FA berhasil diproses.");
    loadUserManagement();
}

// 11. FUNGSI ATASAN: Load & Approval Tamu
async function loadApprovalList() {
    const { data, error } = await supabase
        .from('tamu')
        .select(`
            id, nama_tamu, keperluan, status, waktu_masuk,
            instansi ( nama_instansi )
        `)
        .order('waktu_masuk', { ascending: false });

    if(error) return console.error(error);

    const tbody = document.getElementById('approval-list');
    if(!tbody) return;
    
    tbody.innerHTML = '';
    data.forEach(tamu => {
        let actionBtn = tamu.status === 'Pending' 
            ? `<button style="background: #2ecc71;" onclick="approveTamu(${tamu.id})">Approve</button>` 
            : `<span>Approved</span>`;

        tbody.innerHTML += `
            <tr>
                <td>${new Date(tamu.waktu_masuk).toLocaleString('id-ID')}</td>
                <td>${tamu.nama_tamu}</td>
                <td>${tamu.instansi ? tamu.instansi.nama_instansi : '-'}</td>
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
    } else {
        alert("Gagal approve tamu: " + error.message);
    }
}

// 12. LOGOUT
async function logout() {
    await supabase.auth.signOut();
    currentUser = null;
    document.getElementById('btn-login-nav').style.display = 'inline-block';
    document.getElementById('btn-admin-nav').style.display = 'none';
    document.getElementById('btn-atasan-nav').style.display = 'none';
    document.getElementById('btn-logout').style.display = 'none';
    showPage('guest-page');
}

// Inisialisasi awal
loadDropdowns();