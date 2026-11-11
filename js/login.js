(function () {
    "use strict";

    const form = document.getElementById("login-form");
    const resetPanel = document.getElementById("password-reset-panel");
    const resetForm = document.getElementById("password-reset-form");
    const message = document.getElementById("auth-message");
    const authLinks = document.querySelector(".auth-links");
    const domainNote = document.querySelector(".auth-domain-note");
    if (!form || !message) return;

    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const isRecoveryRoute = params.get("mode") === "recovery" || hashParams.get("type") === "recovery";
    let recoveryEventReceived = false;

    const signupLink = document.querySelector('.auth-links a[href="./signup.html"]');
    const nextParam = params.get("next");
    if (signupLink && nextParam) {
        const signupUrl = new URL(signupLink.href);
        signupUrl.searchParams.set("next", nextParam);
        signupLink.href = signupUrl.href;
    }

    function showMessage(text, type = "info") {
        message.textContent = text;
        message.className = `auth-message is-visible is-${type}`;
    }

    function clearMessage() {
        message.textContent = "";
        message.className = "auth-message";
    }

    function showRecoveryPanel(text = "Enter a new password for your account.", type = "info") {
        document.body.classList.add("auth-recovery-mode");
        form.hidden = true;
        if (resetPanel) resetPanel.hidden = false;
        if (authLinks) authLinks.hidden = true;
        if (domainNote) domainNote.hidden = true;
        // Do not carry an old login error into the password-recovery screen.
        clearMessage();
        showMessage(text, type);
    }

    function showLoginPanel() {
        document.body.classList.remove("auth-recovery-mode");
        form.hidden = false;
        if (resetPanel) resetPanel.hidden = true;
        if (authLinks) authLinks.hidden = false;
        if (domainNote) domainNote.hidden = false;
    }

    // Switch the view immediately for recovery URLs so the login form is never
    // displayed while Supabase is processing the password-reset link.
    if (isRecoveryRoute) {
        showRecoveryPanel("Checking your password-reset link…", "info");
    }

    if (!CampusAuth.isConfigured()) {
        if (isRecoveryRoute) {
            showRecoveryPanel(CampusAuth.getConfigurationError(), "error");
        } else {
            showMessage(CampusAuth.getConfigurationError(), "error");
            form.querySelector('button[type="submit"]').disabled = true;
        }
    } else {
        CampusAuth.client.auth.onAuthStateChange((event, session) => {
            if (event === "PASSWORD_RECOVERY") {
                recoveryEventReceived = true;
                showRecoveryPanel("Enter a new password for your account.", "info");
            } else if (event === "SIGNED_OUT" && document.body.classList.contains("auth-recovery-mode")) {
                showLoginPanel();
                showMessage("Your password-reset session has ended. Request a new reset link.", "error");
            } else if (!isRecoveryRoute && session && event === "SIGNED_IN") {
                window.location.replace(CampusAuth.getSafeNextUrl());
            }
        });

        CampusAuth.client.auth.getSession().then(({ data, error }) => {
            if (isRecoveryRoute) {
                if (data?.session || recoveryEventReceived) {
                    showRecoveryPanel("Enter a new password for your account.", "info");
                } else if (!recoveryEventReceived) {
                    showLoginPanel();
                    showMessage(
                        error?.message || "This password-reset link is invalid or expired. Request a new reset link.",
                        "error"
                    );
                }
            } else if (data?.session) {
                window.location.replace(CampusAuth.getSafeNextUrl());
            }
        }).catch(error => {
            if (isRecoveryRoute && !recoveryEventReceived) {
                showLoginPanel();
                showMessage(error.message || "We could not validate the reset link. Request a new one.", "error");
            }
        });
    }

    form.addEventListener("submit", async event => {
        event.preventDefault();
        if (!form.reportValidity() || !CampusAuth.isConfigured()) return;
        const email = document.getElementById("login-email").value.trim().toLowerCase();
        const password = document.getElementById("login-password").value;
        if (!CampusAuth.isBMUEmail(email)) {
            showMessage("Please use your @bmu.edu.in email address.", "error");
            return;
        }
        const button = form.querySelector('button[type="submit"]');
        button.disabled = true;
        button.textContent = "Signing in…";
        try {
            const { error } = await CampusAuth.signIn(email, password);
            if (error) throw error;
            showMessage("Signed in successfully. Redirecting…", "success");
            window.location.replace(CampusAuth.getSafeNextUrl());
        } catch (error) {
            showMessage(error.message || "Unable to sign in. Check your email and password.", "error");
        } finally {
            button.disabled = false;
            button.textContent = "Log in";
        }
    });

    // Clear stale login errors as soon as the user starts correcting credentials.
    ["login-email", "login-password"].forEach(id => {
        const input = document.getElementById(id);
        input?.addEventListener("input", () => {
            if (!document.body.classList.contains("auth-recovery-mode") && message.classList.contains("is-error")) {
                clearMessage();
            }
        });
    });

    if (resetForm) {
        resetForm.addEventListener("submit", async event => {
            event.preventDefault();
            if (!resetForm.reportValidity() || !CampusAuth.isConfigured()) return;
            const password = document.getElementById("new-password").value;
            const confirmation = document.getElementById("new-password-confirm").value;
            if (password.length < 8 || password !== confirmation) {
                showMessage(password.length < 8 ? "Use at least 8 characters." : "The passwords do not match.", "error");
                return;
            }
            const button = resetForm.querySelector('button[type="submit"]');
            button.disabled = true;
            button.textContent = "Updating…";
            try {
                const { error } = await CampusAuth.client.auth.updateUser({ password });
                if (error) throw error;
                showMessage("Your password has been updated. Redirecting to the marketplace…", "success");
                resetForm.reset();
                window.setTimeout(() => window.location.replace("../index.html"), 1000);
            } catch (error) {
                showMessage(error.message || "The password could not be updated. Request a new reset link if this session has expired.", "error");
            } finally {
                button.disabled = false;
                button.textContent = "Update password";
            }
        });
    }
})();
