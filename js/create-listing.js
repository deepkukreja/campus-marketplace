(function () {
    "use strict";

    const form = document.querySelector(".listing-form");
    if (!form) return;

    const submitButton = form.querySelector('button[type="submit"]');

    form.addEventListener("submit", async event => {
        event.preventDefault();
        if (!form.reportValidity()) return;

        submitButton.disabled = true;
        const originalLabel = submitButton.textContent;
        submitButton.textContent = "Publishing…";

        try {
            const user = await CampusAuth.getUser();
            if (!user) throw new Error("Please log in with your BMU account before posting an item.");

            const type = document.getElementById("transaction-type").value;
            const priceValue = document.getElementById("price").value.trim();
            const price = type === "free" || type === "swap" ? 0 : Number(priceValue);
            if ((type === "sell" || type === "rent") && priceValue === "") {
                throw new Error("Please enter a price for an item you are selling or renting.");
            }
            if (price < 0 || !Number.isFinite(price)) {
                throw new Error("Please enter a valid price.");
            }

            const locationSelect = document.getElementById("handover-location");
            const location = locationSelect.options[locationSelect.selectedIndex]?.text || "Campus";
            const imageFile = document.getElementById("image").files?.[0] || null;

            await CampusMarketplaceDB.createListing({
                title: document.getElementById("item-title").value.trim(),
                category: document.getElementById("category").value.toLowerCase(),
                type,
                price,
                condition: document.getElementById("condition").value.toLowerCase(),
                location,
                description: document.getElementById("description").value.trim()
            }, imageFile, user);

            alert("Your item has been published to the shared campus marketplace!");
            window.location.href = "./marketplace.html";
        } catch (error) {
            console.error("Listing creation failed:", error);
            alert(error.message || "Something went wrong while publishing your listing.");
            submitButton.disabled = false;
            submitButton.textContent = originalLabel;
        }
    });
})();
