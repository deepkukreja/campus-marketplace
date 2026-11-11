(function () {
    "use strict";

    if (document.body.dataset.authRequired !== "true" || !window.CampusAuth) return;
    document.body.classList.add("auth-pending");

    (async () => {
        const auth = window.CampusAuth;
        if (!auth.isConfigured()) {
            document.body.classList.remove("auth-pending");
            const main = document.querySelector("main");
            const notice = document.createElement("div");
            notice.className = "auth-setup-message";
            notice.setAttribute("role", "alert");
            notice.innerHTML = `<strong>Authentication setup is not complete.</strong>${auth.getConfigurationError()} Open the project setup guide and finish the Supabase configuration.`;
            main?.prepend(notice);
            const form = main?.querySelector("form");
            if (form) form.hidden = true;
            return;
        }

        const user = await auth.requireUser();
        if (user) document.body.classList.remove("auth-pending");
    })();
})();
