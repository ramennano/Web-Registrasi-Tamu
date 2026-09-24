const SUPABASE_URL = 'https://gyortxfcoifxzrwfogzr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5b3J0eGZjb2lmeHpyd2ZvZ3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNzE2NzEsImV4cCI6MjEwNTc0NzY3MX0.dO07GyxM9WYRMHYOE70-nJQI_TONr7SXK7loXLRdkHU';

let supabaseClient = null;

window.addEventListener('DOMContentLoaded', () => {
    // Cek apakah admin sudah login
    if (localStorage.getItem('admin_logged') !== 'true') {
        alert('Akses ditolak! Silakan login terlebih dahulu.');
        window.location.href = 'index.html';
        return;
    }

    if (window.supabase) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        loadVisitors();
    }

    document.getElementById('btnLogout').addEventListener('click', () => {
        localStorage.removeItem('admin_logged');
        window.location.href = 'index.html';
    });
});

async function loadVisitors() {
    const tbody = document.getElementById('visitorsTableBody');
    try {
        const { data, error } = await supabaseClient
            .from('visitors')
            .select('*')
            .order('check_in_time', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Belum ada tamu yang mendaftar.</td></tr>`;
            return;
        }

        tbody.innerHTML = data.map(v => {
            const timeStr = new Date(v.check_in_time).toLocaleString('id-ID');
            const isApproved = v.status === 'Approved';

            return `
                <tr>
                    <td>${timeStr}</td>
                    <td>
                        <strong>${escapeHtml(v.name)}</strong><br>
                        <small style="color: #64748b;">${escapeHtml(v.company)}</small>
                    </td>
                    <td>
                        Host: ${escapeHtml(v.host)}<br>
                        <small style="color: #64748b;">Tujuan: ${escapeHtml(v.purpose)}</small>
                    </td>
                    <td>
                        <span class="badge ${isApproved ? 'badge-approved' : 'badge-pending'}">
                            ${v.status || 'Pending'}
                        </span>
                    </td>
                    <td>
                        ${isApproved ? 
                            `<button onclick="updateStatus(${v.id}, 'Pending')" class="btn-warning">Cabut Akses</button>` : 
                            `<button onclick="updateStatus(${v.id}, 'Approved')" class="btn-success">Beri Akses</button>`
                        }
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red;">Gagal memuat data database.</td></tr>`;
    }
}

async function updateStatus(id, newStatus) {
    try {
        const { error } = await supabaseClient
            .from('visitors')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) throw error;
        loadVisitors();
    } catch (err) {
        alert('Gagal mengubah status akses: ' + err.message);
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}