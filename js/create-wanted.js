(function () {
    "use strict";

    const form = document.querySelector(".wanted-form");
    if (!form) return;

    const submitButton = form.querySelector('button[type="submit"]');
    const deadlineInput = document.getElementById("deadline");
    const notice = document.getElementById("create-wanted-status");

    function showError(message) {
        if (notice) {
            notice.textContent = message;
            notice.className = "wanted-status is-visible is-error";
        } else {
            alert(message);
        }
    }

    if (deadlineInput) {
        const now = new Date();
        const localToday = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
            .toISOString().slice(0, 10);
        deadlineInput.min = localToday;
    }

    form.addEventListener("submit", async event => {
        event.preventDefault();
        if (!form.reportValidity()) return;

        const user = await CampusAuth.getUser();
        if (!user) {
            window.location.href = `./login.html?next=${encodeURIComponent(window.location.pathname)}`;
            return;
        }

        const minimumText = document.getElementById("minimum-budget").value;
        const maximumText = document.getElementById("maximum-budget").value;
        const minimumBudget = minimumText === "" ? 0 : Number(minimumText);
        const maximumBudget = Number(maximumText);

        if (!Number.isFinite(minimumBudget) || !Number.isFinite(maximumBudget) ||
            minimumBudget < 0 || maximumBudget < 0 || minimumBudget > maximumBudget) {
            showError("Please check your budget. The minimum cannot exceed the maximum.");
            return;
        }

        const locationSelect = document.getElementById("wanted-location");
        const values = {
            title: document.getElementById("wanted-title").value.trim(),
            category: document.getElementById("wanted-category").value,
            minimumBudget,
            maximumBudget,
            deadline: deadlineInput.value,
            location: locationSelect.options[locationSelect.selectedIndex].text,
            description: document.getElementById("wanted-description").value.trim(),
            notes: document.getElementById("additional-notes").value.trim()
        };

        submitButton.disabled = true;
        submitButton.textContent = "Publishing…";
        if (notice) {
            notice.textContent = "Saving your request to the campus database…";
            notice.className = "wanted-status is-visible is-info";
        }

        try {
            await CampusWantedDB.createWantedRequest(values, user);
            window.location.href = "./wanted.html?posted=1";
        } catch (error) {
            console.error("Wanted request could not be published:", error);
            showError(error.message || "Your request could not be saved. Please try again.");
            submitButton.disabled = false;
            submitButton.textContent = "Post Wanted Request";
        }
    });
})();
