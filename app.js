// Pengaturan Bahasa (ID / EN)
const i18n = {
  id: {
    title: "Sistem Kunjungan Tamu",
    getStarted: "Registrasi Tamu",
    checkStatus: "Cek Status Kunjungan",
    adminLogin: "Login Admin / Super Admin",
    back: "Kembali",
    submit: "Kirim",
    search: "Cari Status",
    registerTitle: "Formulir Registrasi Tamu",
    statusTitle: "Status Approving Tamu"
  },
  en: {
    title: "Guest Management System",
    getStarted: "Guest Registration",
    checkStatus: "Check Visit Status",
    adminLogin: "Admin / Super Admin Login",
    back: "Back",
    submit: "Submit",
    search: "Search Status",
    registerTitle: "Guest Registration Form",
    statusTitle: "Guest Approval Status"
  }
};

let currentLang = localStorage.getItem('lang') || 'id';

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (i18n[lang][key]) el.textContent = i18n[lang][key];
  });
}

// Muat Konfigurasi Branding (Nama PT, Logo, Wallpaper)
async function loadSiteBranding() {
  const { data, error } = await supabase.from('site_config').select('*').eq('id', 1).single();
  if (data) {
    const compElements = document.querySelectorAll('.company-name');
    compElements.forEach(el => el.textContent = data.company_name);
    
    if (data.logo_url) {
      document.querySelectorAll('.brand-logo').forEach(img => img.src = data.logo_url);
    }
    if (data.wallpaper_url) {
      document.body.style.backgroundImage = `url('${data.wallpaper_url}')`;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setLanguage(currentLang);
  loadSiteBranding();
});