(function () {
    "use strict";

    const auth = window.CampusAuth;
    const nav = document.querySelector(".site-header__nav, header nav");
    if (!nav || !auth) return;

    const group = document.createElement("span");
    group.className = "auth-nav-group";
    group.setAttribute("aria-label", "Account actions");
    nav.appendChild(group);

    function render(user) {
        group.replaceChildren();
        const isPages = /\/pages\//i.test(window.location.pathname);
        const loginHref = isPages ? "./login.html" : "./pages/login.html";
        const signupHref = isPages ? "./signup.html" : "./pages/signup.html";

        if (user) {
            const email = document.createElement("span");
            email.className = "auth-nav-user";
            email.textContent = user.email || "BMU student";
            email.title = user.email || "";

            const logout = document.createElement("button");
            logout.className = "auth-nav-logout";
            logout.type = "button";
            logout.textContent = "Log out";
            logout.addEventListener("click", async () => {
                logout.disabled = true;
                try {
                    await auth.signOut();
                    window.location.href = isPages ? "../index.html" : "./index.html";
                } catch (error) {
                    alert(error.message || "Could not sign out. Please try again.");
                    logout.disabled = false;
                }
            });
            group.append(email, logout);
        } else {
            const login = document.createElement("a");
            login.href = loginHref;
            login.textContent = "Log in";
            login.className = "auth-nav-login";

            const signup = document.createElement("a");
            signup.href = signupHref;
            signup.textContent = "Sign up";
            signup.className = "auth-nav-signup";
            group.append(login, signup);
        }
    }

    if (!auth.isConfigured()) {
        render(null);
        return;
    }

    auth.client.auth.onAuthStateChange((_event, session) => render(session?.user || null));
    auth.client.auth.getSession().then(({ data }) => render(data.session?.user || null));
})();
