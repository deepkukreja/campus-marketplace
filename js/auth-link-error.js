(function () {
    "use strict";
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    if (!params.get("error")) return;
    // Keep the error fragment for the login screen, which displays a helpful recovery action.
    const target = new URL("./pages/login.html", window.location.href);
    target.hash = hash;
    window.location.replace(target.href);
})();
