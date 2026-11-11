(function () {
    "use strict";

    const DOMAIN_PATTERN = /^[^\s@]+@bmu\.edu\.in$/i;
    const rootPrefix = /\/pages\//i.test(window.location.pathname) ? "../" : "./";
    const authState = window.CampusSupabase || { client: null, configured: false };
    const client = authState.client;

    function isBMUEmail(email) {
        return DOMAIN_PATTERN.test(String(email || "").trim());
    }

    function getLoginUrl(next) {
        const url = new URL(`${rootPrefix}pages/login.html`, window.location.href);
        if (next) url.searchParams.set("next", next);
        return url.href;
    }

    async function getUser() {
        if (!client) return null;
        const { data, error } = await client.auth.getUser();
        if (error) return null;
        return data.user || null;
    }

    async function requireUser(options = {}) {
        const redirect = options.redirect !== false;
        if (!client) return null;
        const user = await getUser();
        if (!user && redirect) {
            const next = window.location.pathname + window.location.search;
            window.location.replace(getLoginUrl(next));
        }
        return user;
    }

    function getSafeNextUrl() {
        const params = new URLSearchParams(window.location.search);
        const next = params.get("next");
        if (!next || !next.startsWith("/") || next.startsWith("//")) {
            return new URL(`${rootPrefix}index.html`, window.location.href).href;
        }
        const candidate = new URL(next, window.location.origin);
        return candidate.origin === window.location.origin
            ? candidate.href
            : new URL(`${rootPrefix}index.html`, window.location.href).href;
    }

    function showPasswordToggle(button) {
        const inputId = button.getAttribute("aria-controls");
        const input = inputId ? document.getElementById(inputId) : null;
        if (!input) return;
        const isVisible = input.type === "text";
        input.type = isVisible ? "password" : "text";
        button.textContent = isVisible ? "Show" : "Hide";
        button.setAttribute("aria-label", isVisible ? "Show password" : "Hide password");
    }

    document.addEventListener("click", event => {
        const button = event.target.closest(".auth-show-password");
        if (button) showPasswordToggle(button);
    });

    window.CampusAuth = {
        client,
        isConfigured: () => Boolean(client),
        getConfigurationError: () => authState.error || "Supabase is not configured.",
        isBMUEmail,
        getUser,
        requireUser,
        getSafeNextUrl,
        rootPrefix,
        async signUp({ email, password, fullName, department, academicYear }) {
            if (!client) throw new Error(authState.error || "Supabase is not configured.");
            const normalizedEmail = String(email || "").trim().toLowerCase();
            if (!isBMUEmail(normalizedEmail)) {
                throw new Error("Registration is restricted to official @bmu.edu.in email addresses.");
            }
            return client.auth.signUp({
                email: normalizedEmail,
                password,
                options: {
                    emailRedirectTo: new URL("./login.html", window.location.href).href,
                    data: {
                        full_name: String(fullName || "").trim(),
                        department: String(department || "").trim(),
                        academic_year: String(academicYear || "").trim()
                    }
                }
            });
        },
        async signIn(email, password) {
            if (!client) throw new Error(authState.error || "Supabase is not configured.");
            const normalizedEmail = String(email || "").trim().toLowerCase();
            if (!isBMUEmail(normalizedEmail)) {
                throw new Error("Please sign in using your @bmu.edu.in email address.");
            }
            return client.auth.signInWithPassword({ email: normalizedEmail, password });
        },
        async signOut() {
            if (!client) return;
            const { error } = await client.auth.signOut();
            if (error) throw error;
        }
    };
})();
