(function () {
    "use strict";

    const form = document.getElementById("signup-form");
    if (!form) return;
    const message = document.getElementById("auth-message");
    const submit = form.querySelector('button[type="submit"]');

    function showMessage(text, type = "info") {
        message.textContent = text;
        message.className = `auth-message is-visible is-${type}`;
    }

    if (!CampusAuth.isConfigured()) {
        showMessage(CampusAuth.getConfigurationError(), "error");
        submit.disabled = true;
    }

    form.addEventListener("submit", async event => {
        event.preventDefault();
        if (!form.reportValidity() || !CampusAuth.isConfigured()) return;

        const email = document.getElementById("signup-email").value.trim().toLowerCase();
        const password = document.getElementById("signup-password").value;
        const confirmPassword = document.getElementById("confirm-password").value;
        if (!CampusAuth.isBMUEmail(email)) {
            showMessage("Only official BMU email addresses ending exactly in @bmu.edu.in can register.", "error");
            return;
        }
        if (password.length < 8) {
            showMessage("Use a password with at least 8 characters.", "error");
            return;
        }
        if (password !== confirmPassword) {
            showMessage("The passwords do not match.", "error");
            return;
        }

        submit.disabled = true;
        submit.textContent = "Creating account…";
        try {
            const { data, error } = await CampusAuth.signUp({
                email,
                password,
                fullName: document.getElementById("full-name").value,
                department: document.getElementById("department").value,
                academicYear: document.getElementById("academic-year").value
            });
            if (error) throw error;

            if (data.session) {
                showMessage("Your account has been created. You are now signed in.", "success");
                window.setTimeout(() => {
                    window.location.href = CampusAuth.getSafeNextUrl();
                }, 900);
            } else {
                form.reset();
                showMessage("Registration started. Check your BMU inbox and click the verification link to activate your account, then log in.", "success");
            }
        } catch (error) {
            showMessage(error.message || "We could not create your account. Please try again.", "error");
        } finally {
            submit.disabled = false;
            submit.textContent = "Create account";
        }
    });
})();
