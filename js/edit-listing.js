(function () {
    "use strict";

    const form = document.getElementById("edit-listing-form");
    if (!form) return;

    const message = document.getElementById("form-message");
    const imageInput = document.getElementById("image");
    const imagePreview = document.getElementById("image-preview");
    const submitButton = form.querySelector('button[type="submit"]');
    const listingId = new URLSearchParams(window.location.search).get("id");

    let currentListing = null;
    let selectedImageFile = null;
    let previewObjectUrl = null;

    function showMessage(text, type = "info") {
        message.textContent = text;
        message.className = `message ${type}`;
    }

    function renderImagePreview(imageUrl) {
        imagePreview.replaceChildren();
        if (!imageUrl) return;
        const image = document.createElement("img");
        image.src = imageUrl;
        image.alt = "Listing image preview";
        imagePreview.appendChild(image);
    }

    async function loadListing() {
        form.hidden = true;
        showMessage("Loading your listing…", "info");
        try {
            const user = await CampusAuth.getUser();
            if (!user) throw new Error("Please sign in before editing a listing.");
            currentListing = await CampusMarketplaceDB.getListingById(listingId);

            if (!currentListing) throw new Error("Listing not found. It may have been removed or is not available.");
            if (currentListing.ownerId !== user.id) {
                throw new Error("You can edit only listings created by your own BMU account.");
            }

            document.getElementById("title").value = currentListing.title || "";
            document.getElementById("price").value = currentListing.price ?? 0;
            document.getElementById("category").value = CampusStore.titleCase(currentListing.category || "");
            document.getElementById("condition").value = CampusStore.titleCase(currentListing.condition || "");
            document.getElementById("description").value = currentListing.description || "";
            document.getElementById("location").value = currentListing.location || "";
            document.getElementById("status").value = currentListing.status || "Available";
            renderImagePreview(currentListing.image);
            form.hidden = false;
            showMessage("You are editing your own listing.", "success");
        } catch (error) {
            showMessage(error.message || "The listing could not be loaded.", "error");
        }
    }

    imageInput?.addEventListener("change", () => {
        const file = imageInput.files?.[0] || null;
        selectedImageFile = file;
        if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
        previewObjectUrl = file ? URL.createObjectURL(file) : null;
        renderImagePreview(previewObjectUrl || currentListing?.image || "");
        if (file) showMessage("New image selected. Save changes to upload it.", "info");
    });

    form.addEventListener("submit", async event => {
        event.preventDefault();
        if (!currentListing || !form.reportValidity()) return;

        const price = Number(document.getElementById("price").value);
        const values = {
            title: document.getElementById("title").value.trim(),
            price,
            category: document.getElementById("category").value.toLowerCase(),
            condition: document.getElementById("condition").value.toLowerCase(),
            description: document.getElementById("description").value.trim(),
            location: document.getElementById("location").value.trim(),
            status: document.getElementById("status").value
        };
        if (!values.title || !values.description || !values.location || !Number.isFinite(price) || price < 0) {
            showMessage("Please complete all required fields and enter a valid price.", "error");
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = "Saving…";
        try {
            const user = await CampusAuth.getUser();
            const updated = await CampusMarketplaceDB.updateListing(
                currentListing.id,
                values,
                selectedImageFile,
                user
            );
            currentListing = updated;
            showMessage("Your changes have been saved to the shared marketplace.", "success");
            window.setTimeout(() => {
                window.location.href = `./listing.html?id=${encodeURIComponent(updated.id)}`;
            }, 650);
        } catch (error) {
            console.error("Listing update failed:", error);
            showMessage(error.message || "Your changes could not be saved.", "error");
            submitButton.disabled = false;
            submitButton.textContent = "Save Changes";
        }
    });

    window.addEventListener("beforeunload", () => {
        if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
    });

    loadListing();
})();
