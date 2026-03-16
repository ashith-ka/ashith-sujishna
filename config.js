/**
 * Config for Supabase
 * 
 * LOCAL DEVELOPMENT: Copy config.example.js to config.js and add your credentials
 * GITHUB PAGES: Values are injected via GitHub Actions secrets (_supabase-secrets.js)
 * 
 */
const CONFIG = {
    SUPABASE_URL: '',
    SUPABASE_ANON_KEY: ''
};

(function() {
    if (typeof window !== 'undefined') {
        if (window.SUPABASE_URL && window.SUPABASE_URL.startsWith('http')) {
            CONFIG.SUPABASE_URL = window.SUPABASE_URL;
        }
        if (window.SUPABASE_ANON_KEY && window.SUPABASE_ANON_KEY.startsWith('eyJ')) {
            CONFIG.SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY;
        }
    }
})();
