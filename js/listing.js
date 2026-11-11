(function () {
    "use strict";

    const container = document.getElementById("listing-content");
    const breadcrumbTitle = document.getElementById("breadcrumb-title");
    if (!container) return;

    const requestedId = new URLSearchParams(window.location.search).get("id");
    let currentListing = null;
    let deleteInProgress = false;

    function safeText(value) {
        return CampusStore.escapeHTML(value == null ? "" : String(value));
    }

    function showNotFound(message = "This item may have been removed or is not available to your account.") {
        container.innerHTML = `
            <div class="not-found">
                <h2>Listing not found</h2>
                <p>${safeText(message)}</p>
                <a href="./marketplace.html">Back to Marketplace</a>
            </div>`;
    }

    function showActionMessage(text, type = "error") {
        let message = document.getElementById("listing-action-message");
        if (!message) {
            message = document.createElement("p");
            message.id = "listing-action-message";
            message.className = "listing-action-message";
            message.setAttribute("role", type === "error" ? "alert" : "status");
            const actions = container.querySelector(".listing-actions");
            if (actions) actions.insertAdjacentElement("afterend", message);
            else container.prepend(message);
        }
        message.textContent = text;
        message.dataset.type = type;
        message.hidden = false;
        message.style.cssText = type === "error"
            ? "margin:16px 0;padding:12px 14px;border:1px solid #fecaca;border-radius:10px;background:#fef2f2;color:#991b1b;"
            : "margin:16px 0;padding:12px 14px;border:1px solid #bbf7d0;border-radius:10px;background:#f0fdf4;color:#166534;";
    }

    async function handleDelete(button) {
        if (deleteInProgress) return;
        const user = await CampusAuth.getUser();
        if (!user) {
            showActionMessage("Your login session could not be verified. Please sign out, sign in again, and retry.");
            return;
        }
        if (!currentListing || currentListing.ownerId !== user.id) {
            showActionMessage("This account is not the owner of this listing. Only the original student account can delete it.");
            return;
        }
        if (!window.confirm(`Delete “${currentListing.title}” permanently? This cannot be undone.`)) return;

        deleteInProgress = true;
        button.disabled = true;
        button.setAttribute("aria-busy", "true");
        button.textContent = "Deleting…";
        showActionMessage("Sending delete request to Supabase…", "info");

        try {
            const result = await CampusMarketplaceDB.deleteListing(currentListing.id, user);
            showActionMessage("Listing deleted from the shared marketplace. Returning to listings…", "success");
            console.info("Campus Marketplace: listing deleted", result?.deletedId || currentListing.id);
            window.setTimeout(() => window.location.replace("./marketplace.html"), 700);
        } catch (error) {
            console.error("Campus Marketplace delete failed:", error);
            showActionMessage(error?.message || "Delete failed. Open the browser console (F12) for details.");
            deleteInProgress = false;
            button.disabled = false;
            button.removeAttribute("aria-busy");
            button.textContent = "Delete Listing";
        }
    }

    async function render() {
        container.innerHTML = "<p>Loading item details…</p>";
        try {
            if (!window.CampusStore || !window.CampusAuth || !window.CampusMarketplaceDB) {
                throw new Error("A required script did not load. Check that common.js, auth.js and marketplace-data.js load before listing.js.");
            }
            if (!requestedId) {
                showNotFound("The listing URL is missing its ID.");
                return;
            }

            currentListing = await CampusMarketplaceDB.getListingById(requestedId);
            if (!currentListing) {
                showNotFound();
                return;
            }

            const currentUser = await CampusAuth.getUser();
            const isOwner = Boolean(currentUser && currentListing.ownerId && currentListing.ownerId === currentUser.id);
            const ownerActions = isOwner ? `
                <a class="secondary-button" href="./edit-listing.html?id=${encodeURIComponent(currentListing.id)}">Edit Listing</a>
                <button class="danger-button" id="delete-listing-button" type="button">Delete Listing</button>
            ` : "";
            const title = safeText(currentListing.title || "Untitled item");
            const category = safeText(CampusStore.titleCase(currentListing.category || "other"));
            const imageHTML = currentListing.image
                ? `<img src="${safeText(currentListing.image)}" alt="${title}">`
                : '<div class="image-placeholder" aria-label="No item image">📦</div>';
            const type = String(currentListing.type || "sell").toLowerCase();
            const priceLabel = type === "free" ? "Free" : type === "swap" ? "Swap" : CampusStore.formatMoney(currentListing.price);

            document.title = `${currentListing.title || "Item Details"} | Campus Marketplace`;
            if (breadcrumbTitle) breadcrumbTitle.textContent = currentListing.title || "Item Details";

            container.innerHTML = `
                <div class="listing-grid">
                    <section><div class="listing-image">${imageHTML}</div></section>
                    <section>
                        <span class="listing-category">${category}</span>
                        <h1 class="listing-title">${title}</h1>
                        <div class="listing-price">${priceLabel}</div>
                        <p class="listing-condition"><strong>Transaction:</strong> ${type === "rent" ? "For rent" : type === "swap" ? "Swap" : type === "free" ? "Give away" : "For sale"}</p>
                        <p class="listing-condition"><strong>Condition:</strong> ${safeText(CampusStore.titleCase(currentListing.condition || "Not specified"))}</p>
                        <p><strong>Status:</strong> ${safeText(currentListing.status || "Available")}</p>
                        <h3>Description</h3>
                        <div class="listing-description">${safeText(currentListing.description || "No description provided.")}</div>
                        <div class="listing-actions">
                            ${isOwner
                                ? '<span class="listing-owner-label">Your listing</span>'
                                : '<button class="primary-button" id="contact-seller-button" type="button">Contact Seller</button>'}
                            ${ownerActions}
                        </div>
                        <div class="seller-card">
                            <h3>Seller Information</h3>
                            <div class="seller-details">
                                <p><strong>Name:</strong> ${safeText(currentListing.seller || "BMU Student")}</p>
                                <p><strong>Location:</strong> ${safeText(currentListing.location || "Campus")}</p>
                                <p><strong>Listed on:</strong> ${safeText(currentListing.date || "Not specified")}</p>
                            </div>
                        </div>
                        <p class="listing-meta">Listing ID: ${safeText(currentListing.id)}</p>
                    </section>
                </div>`;

            const deleteButton = document.getElementById("delete-listing-button");
            if (deleteButton) deleteButton.addEventListener("click", () => handleDelete(deleteButton));

            const contactButton = document.getElementById("contact-seller-button");
            contactButton?.addEventListener("click", async () => {
                if (contactButton.disabled) return;
                contactButton.disabled = true;
                contactButton.textContent = "Opening chat…";
                showActionMessage("Connecting to the seller…", "info");

                try {
                    const user = await CampusAuth.getUser();
                    if (!user) {
                        const next = window.location.pathname + window.location.search;
                        window.location.href = `./login.html?next=${encodeURIComponent(next)}`;
                        return;
                    }

                    if (!window.CampusWantedDB?.getOrCreateListingConversation) {
                        throw new Error("Messaging scripts are not loaded. Check that wanted-data.js loads before listing.js.");
                    }

                    const conversationId = await CampusWantedDB.getOrCreateListingConversation(
                        currentListing.id,
                        user
                    );

                    window.location.href = `./messages.html?id=${encodeURIComponent(conversationId)}`;
                } catch (error) {
                    console.error("Could not contact seller:", error);
                    showActionMessage(error.message || "Could not open a chat with this seller.", "error");
                    contactButton.disabled = false;
                    contactButton.textContent = "Contact Seller";
                }
            });
        } catch (error) {
            console.error("Listing details could not be loaded:", error);
            container.innerHTML = `
                <div class="not-found" role="alert">
                    <h2>Unable to load this listing</h2>
                    <p>${safeText(error.message || "Check your internet connection and Supabase listing permissions.")}</p>
                    <a href="./marketplace.html">Back to Marketplace</a>
                </div>`;
        }
    }

    render();
})();
