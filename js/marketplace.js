(function () {
    "use strict";

    const grid = document.querySelector(".listing-grid");
    if (!grid) return;

    const searchInput = document.getElementById("search");
    const categoryInput = document.getElementById("category");
    const typeInput = document.getElementById("type");
    const maximumPriceInput = document.getElementById("max-price");
    const sortInput = document.getElementById("sort");
    const statusNode = document.getElementById("listing-status");

    let allListings = [];

    function setStatus(text, kind = "info") {
        if (!statusNode) return;
        statusNode.textContent = text;
        statusNode.className = `listing-status listing-status--${kind}`;
        statusNode.hidden = !text;
    }

    function getFilteredListings() {
        let listings = allListings.filter(item =>
            String(item.status || "Available").toLowerCase() === "available"
        );

        const search = (searchInput?.value || "").trim().toLowerCase();
        const category = (categoryInput?.value || "").trim().toLowerCase();
        const type = (typeInput?.value || "").trim().toLowerCase();
        const maxValue = maximumPriceInput?.value ?? "";
        const maximumPrice = maxValue === "" ? null : Number(maxValue);

        if (search) {
            listings = listings.filter(item =>
                [item.title, item.description, item.category, item.location, item.seller]
                    .join(" ")
                    .toLowerCase()
                    .includes(search)
            );
        }
        if (category) {
            listings = listings.filter(item => String(item.category).toLowerCase() === category);
        }
        if (type) {
            listings = listings.filter(item => String(item.type || "sell").toLowerCase() === type);
        }
        if (maximumPrice !== null && Number.isFinite(maximumPrice)) {
            listings = listings.filter(item => Number(item.price || 0) <= maximumPrice);
        }

        if (sortInput?.value === "low-high") {
            listings.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
        } else if (sortInput?.value === "high-low") {
            listings.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
        } else {
            listings.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        }
        return listings;
    }

    function render() {
        const listings = getFilteredListings();
        if (!listings.length) {
            grid.innerHTML = `
                <div class="empty-state">
                    <h3>No matching listings found</h3>
                    <p>Try changing your search or filters, or check back later.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = listings.map(item => {
            const title = CampusStore.escapeHTML(item.title || "Untitled item");
            const category = CampusStore.escapeHTML(CampusStore.titleCase(item.category || "other"));
            const type = String(item.type || "sell").toLowerCase();
            const typeLabel = type === "rent" ? "For rent" :
                type === "swap" ? "Swap" : type === "free" ? "Free" : "For sale";
            const priceLabel = type === "free" ? "Free" :
                type === "swap" ? "Swap" : CampusStore.formatMoney(item.price);
            const image = item.image
                ? `<img alt="${title}" class="listing-card__photo" loading="lazy" src="${CampusStore.escapeHTML(item.image)}">`
                : `<div class="listing-card__placeholder" aria-label="No item image">📦</div>`;

            return `
                <article class="listing-card">
                    <a class="listing-card__link" href="./listing.html?id=${encodeURIComponent(item.id)}">
                        <div class="listing-card__image">
                            ${image}
                            <span>${category}</span>
                        </div>
                        <div class="listing-card__content">
                            <p class="listing-card__type">${typeLabel}</p>
                            <h3 class="listing-card__title">${title}</h3>
                            <p class="listing-card__condition">${CampusStore.escapeHTML(CampusStore.titleCase(item.condition || "Not specified"))}</p>
                            <div class="listing-card__footer">
                                <strong>${priceLabel}</strong>
                                <span>${CampusStore.escapeHTML(item.location || "Campus")}</span>
                            </div>
                        </div>
                    </a>
                </article>
            `;
        }).join("");
    }

    [searchInput, categoryInput, typeInput, maximumPriceInput, sortInput].forEach(control => {
        if (!control) return;
        control.addEventListener("input", render);
        control.addEventListener("change", render);
    });

    async function initialize() {
        grid.innerHTML = '<div class="empty-state"><p>Loading campus listings…</p></div>';
        setStatus("Loading shared listings from the BMU marketplace database…");
        try {
            const user = await CampusAuth.getUser();
            const importedCount = user
                ? await CampusMarketplaceDB.importLegacyListingsForUser(user)
                : 0;
            allListings = await CampusMarketplaceDB.getListings();
            render();
            setStatus(
                importedCount > 0
                    ? `${importedCount} of your previously saved listing(s) have been moved into the shared marketplace.`
                    : "Listings are now loaded from the shared Supabase database.",
                "success"
            );
        } catch (error) {
            console.error("Marketplace listings could not be loaded:", error);
            grid.innerHTML = `
                <div class="empty-state" role="alert">
                    <h3>We couldn't load the marketplace</h3>
                    <p>${CampusStore.escapeHTML(error.message || "Please check your connection and database setup.")}</p>
                    <p>Confirm that you have run <strong>supabase/marketplace-listings-migration.sql</strong> in Supabase SQL Editor.</p>
                </div>
            `;
            setStatus("Marketplace database connection needs attention.", "error");
        }
    }

    initialize();
})();
