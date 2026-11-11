(function () {
    "use strict";

    const config = window.CAMPUS_SUPABASE_CONFIG || {};
    const validUrl = typeof config.url === "string" && /^https:\/\/.+\.supabase\.co$/i.test(config.url);
    const validKey = typeof config.publishableKey === "string" &&
        config.publishableKey.length > 20 &&
        !config.publishableKey.includes("YOUR_SUPABASE");

    if (!window.supabase || typeof window.supabase.createClient !== "function") {
        window.CampusSupabase = {
            client: null,
            configured: false,
            error: "The Supabase JavaScript library could not be loaded. Check your internet connection."
        };
        return;
    }

    if (!validUrl || !validKey) {
        window.CampusSupabase = {
            client: null,
            configured: false,
            error: "Add your Supabase project URL and publishable key in js/supabase-config.js."
        };
        return;
    }

    window.CampusSupabase = {
        client: window.supabase.createClient(config.url, config.publishableKey, {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true
            }
        }),
        configured: true,
        error: null
    };
})();
