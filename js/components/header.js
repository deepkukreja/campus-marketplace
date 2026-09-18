export function createHeader() {
    const header = document.createElement("header");

    header.className = "site-header";

    header.innerHTML = `
        <div class="site-header__inner">
            <a class="site-header__brand" href="./index.html">
                Campus Marketplace
            </a>

            <nav class="site-header__nav" aria-label="Main navigation">
                <a href="./index.html">Marketplace</a>
                <a href="./pages/wanted.html">Wanted</a>
                <a href="./pages/create-listing.html">Sell</a>
                <a href="./pages/profile.html">Profile</a>
            </nav>
        </div>
    `;

    return header;
}