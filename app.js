// 1. INISIALISASI SUPABASE
const SUPABASE_URL = 'https://ojlpeqhstbsuzjqccjgk.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qbHBlcWhzdGJzdXpqcWNjamdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNjExNTcsImV4cCI6MjEwNTczNzE1N30.hMoVGhKUBUlcktrWhsBaOk5A673irsAsYn_iMdOJKjw'; 
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
let factorId = null; 

// 2. NAVIGASI HALAMAN
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}

// 3. LOAD DROPDOWN
async function loadDropdowns() {
    const instansiSelect = document.getElementById('instansi_id');
    const tujuanSelect = document.getElementById('tujuan_id');

    const { data: instansi } = await supabaseClient.from('instansi').select('*');
    instansiSelect.innerHTML = '<option value="">-- Pilih Instansi --</option>';
    instansi?.forEach(item => {
        instansiSelect.innerHTML += `<option value="${item.id}">${item.nama_instansi}</option>`;
    });

    const { data: tujuan } = await supabaseClient.from('orang_tujuan').select('*');
    tujuanSelect.innerHTML = '<option value="">-- Pilih Tujuan --</option>';
    tujuan?.forEach(item => {
        tujuanSelect.innerHTML += `<option value="${item.id}">${item.nama_orang}</option>`;
    });
}

// 4. SUBMIT FORM TAMU
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

// 5. PERBAIKAN: LOGIN DENGAN PENCEGAHAN ERROR 2FA
async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) return alert("Login Gagal: " + error.message);

    const { data: mfaData, error: mfaError } = await supabaseClient.auth.mfa.getAuthenticatorAssuranceLevel();
    
    if (mfaData && mfaData.nextLevel === 'aal2' && mfaData.currentLevel === 'aal1') {
        document.getElementById('login-step-1').style.display = 'none';
        document.getElementById('login-step-2').style.display = 'block';
        
        const factors = await supabaseClient.auth.mfa.listFactors();
        if (factors.data && factors.data.totp.length > 0) {
            const totpFactor = factors.data.totp[0];
            factorId = totpFactor.id;
            await supabaseClient.auth.mfa.challenge({ factorId });
        } else {
            checkUserRole(); 
        }
    } else {
        checkUserRole();
    }
}

// 6. VERIFIKASI KODE 2FA
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

// 7. CEK ROLE USER
async function checkUserRole() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    currentUser = user;

    const { data: roleData } = await supabaseClient.from('user_roles').select('role').eq('user_id', user.id).single();
    
    document.getElementById('btn-login-nav').style.display = 'none';
    document.getElementById('btn-logout').style.display = 'inline-block';

    if (roleData && roleData.role === 'admin') {
        showPage('admin-page');
    } else if (roleData && roleData.role === 'atasan') {
        showPage('atasan-page');
        loadApprovalList();
    } else {
        alert("Anda tidak memiliki akses dashboard.");
        logout();
    }
}

// 8 & 9. FUNGSI ADMIN: Data Master
async function tambahInstansi() {
    const val = document.getElementById('new-instansi').value;
    if(!val) return;
    const { error } = await supabaseClient.from('instansi').insert([{ nama_instansi: val }]);
    if(!error) {
        alert('Instansi ditambahkan!');
        document.getElementById('new-instansi').value = '';
        loadDropdowns(); 
    }
}

async function tambahTujuan() {
    const val = document.getElementById('new-tujuan').value;
    if(!val) return;
    const { error } = await supabaseClient.from('orang_tujuan').insert([{ nama_orang: val }]);
    if(!error) {
        alert('Orang Tujuan ditambahkan!');
        document.getElementById('new-tujuan').value = '';
        loadDropdowns(); 
    }
}

// ==========================================
// FITUR BARU: MANAJEMEN AKUN (KHUSUS ADMIN)
// ==========================================
async function tambahAkun() {
    const email = document.getElementById('new-user-email').value;
    const password = document.getElementById('new-user-password').value;
    const role = document.getElementById('new-user-role').value;

    if(!email || !password) return alert("Email dan Password wajib diisi!");

    // Mendaftarkan akun (Catatan: untuk keamanan ekstra di prod, gunakan Edge Function Admin)
    const { data, error } = await supabaseClient.auth.signUp({ email, password });
    if (error) return alert("Gagal membuat akun: " + error.message);

    if(data.user) {
        const { error: roleError } = await supabaseClient.from('user_roles').insert([
            { user_id: data.user.id, role: role }
        ]);
        
        if(roleError) alert("Akun terbuat tapi gagal menetapkan role!");
        else {
            alert(`Akun ${email} sukses didaftarkan sebagai ${role}!`);
            document.getElementById('new-user-email').value = '';
            document.getElementById('new-user-password').value = '';
        }
    }
}

async function adminReset2FA() {
    const email = document.getElementById('reset-2fa-email').value;
    if(!email) return alert("Masukkan email pengguna!");
    
    // Fungsi ini akan memanggil RPC di Supabase (Pastikan Anda telah membuat fungsi RPC "admin_reset_mfa" di SQL Supabase Anda)
    const { data, error } = await supabaseClient.rpc('admin_reset_mfa', { target_email: email });
    
    if (error) {
        alert("Gagal reset 2FA: " + error.message + "\n(Pastikan fungsi RPC diaktifkan di Supabase)");
    } else {
        alert(`2FA untuk ${email} telah direset.`);
        document.getElementById('reset-2fa-email').value = '';
    }
}
// ==========================================

// 10 & 11. FUNGSI ATASAN
async function loadApprovalList() {
    const { data, error } = await supabaseClient
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
    const { error } = await supabaseClient.from('tamu').update({ status: 'Approved' }).eq('id', id);
    if (!error) {
        alert("Tamu telah di-Approve!");
        loadApprovalList(); 
    }
}

// 12. LOGOUT
async function logout() {
    await supabaseClient.auth.signOut();
    currentUser = null;
    document.getElementById('btn-login-nav').style.display = 'inline-block';
    document.getElementById('btn-logout').style.display = 'none';
    
    document.getElementById('login-step-1').style.display = 'block';
    document.getElementById('login-step-2').style.display = 'none';
    
    showPage('guest-page');
    window.location.reload();
}

loadDropdowns();