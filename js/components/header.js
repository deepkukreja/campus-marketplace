export function createHeader(rootPath = ".") {
    const header = document.createElement("header");

    header.className = "site-header";

    header.innerHTML = `
        <div class="site-header__inner">
            <a
                class="site-header__brand"
                href="${rootPath}/index.html"
            >
                Campus Marketplace
            </a>

            <nav
                class="site-header__nav"
                aria-label="Main navigation"
            >
                <a href="${rootPath}/pages/marketplace.html">
                    Marketplace
                </a>

                <a href="${rootPath}/pages/wanted.html">
                    Wanted
                </a>

                <a href="${rootPath}/pages/create-listing.html">
                    Sell
                </a>

                <a href="${rootPath}/pages/profile.html">
                    Profile
                </a>
            </nav>
        </div>
    `;

    return header;
}