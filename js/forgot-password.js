(function () {
    "use strict";

    const form = document.getElementById("forgot-password-form");
    if (!form) return;
    const message = document.getElementById("auth-message");
    const button = form.querySelector('button[type="submit"]');

    function showMessage(text, type = "info") {
        message.textContent = text;
        message.className = `auth-message is-visible is-${type}`;
    }

    if (!CampusAuth.isConfigured()) {
        showMessage(CampusAuth.getConfigurationError(), "error");
        button.disabled = true;
    }

    form.addEventListener("submit", async event => {
        event.preventDefault();
        if (!form.reportValidity() || !CampusAuth.isConfigured()) return;
        const email = document.getElementById("forgot-email").value.trim().toLowerCase();
        if (!CampusAuth.isBMUEmail(email)) {
            showMessage("Enter your official @bmu.edu.in email address.", "error");
            return;
        }

        button.disabled = true;
        button.textContent = "Sending…";
        try {
            const redirectTo = new URL("./login.html?mode=recovery", window.location.href).href;
            const { error } = await CampusAuth.client.auth.resetPasswordForEmail(email, { redirectTo });
            if (error) throw error;
            showMessage("If an account exists for that address, a password-reset email will be sent. Check your BMU inbox.", "success");
            form.reset();
        } catch (error) {
            showMessage(error.message || "The reset email could not be sent.", "error");
        } finally {
            button.disabled = false;
            button.textContent = "Send reset link";
        }
    });
})();
