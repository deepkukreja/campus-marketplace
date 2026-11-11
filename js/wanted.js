(function () {
    "use strict";

    const grid = document.querySelector(".wanted-grid");
    if (!grid) return;

    const statusNode = document.getElementById("wanted-status");
    let currentUser = null;

    function setStatus(message, type = "info") {
        if (!statusNode) return;
        statusNode.textContent = message;
        statusNode.className = `wanted-status is-visible is-${type}`;
    }

    function clearStatus() {
        if (!statusNode) return;
        statusNode.textContent = "";
        statusNode.className = "wanted-status";
    }

    function render(requests) {
        if (!requests.length) {
            grid.innerHTML = `
                <div class="empty-state">
                    <h3>No open wanted requests yet</h3>
                    <p>Be the first student to post what you need.</p>
                    <a class="button button--primary" href="./create-wanted.html">Post a Wanted Request</a>
                </div>`;
            return;
        }

        grid.innerHTML = requests.map(request => {
            const category = CampusStore.escapeHTML(CampusStore.titleCase(request.category));
            const minimum = Number(request.minimumBudget || 0);
            const maximum = Number(request.maximumBudget || 0);
            const budget = minimum > 0
                ? `${CampusStore.formatMoney(minimum)} – ${CampusStore.formatMoney(maximum)}`
                : `Up to ${CampusStore.formatMoney(maximum)}`;
            const isOwner = request.ownerId === currentUser?.id;
            const action = isOwner
                ? `<span class="wanted-owner-label">Your request</span>`
                : `<button class="button button--secondary wanted-interest-button" type="button" data-request-id="${CampusStore.escapeHTML(request.id)}">I'm interested</button>`;

            return `
                <article class="wanted-card">
                    <div class="wanted-card__link">
                        <div class="wanted-card__category">${category}</div>
                        <div class="wanted-card__content">
                            <h3 class="wanted-card__title">${CampusStore.escapeHTML(request.title)}</h3>
                            <p class="wanted-card__description">${CampusStore.escapeHTML(request.description || "No additional description.")}</p>
                            <div class="wanted-card__budget">
                                <span>Budget</span>
                                <strong>${budget}</strong>
                            </div>
                            <div class="wanted-card__footer">
                                <span>Needed by ${CampusStore.formatDate(request.deadline)}</span>
                                <span>${CampusStore.escapeHTML(request.location || "Campus")}</span>
                            </div>
                            ${request.notes ? `<p class="wanted-card__notes">${CampusStore.escapeHTML(request.notes)}</p>` : ""}
                            <div class="wanted-card__actions">${action}</div>
                        </div>
                    </div>
                </article>`;
        }).join("");
    }

    grid.addEventListener("click", async event => {
        const button = event.target.closest(".wanted-interest-button");
        if (!button) return;

        button.disabled = true;
        button.textContent = "Opening chat…";
        clearStatus();

        try {
            const requestId = button.dataset.requestId;
            const conversationId = await CampusWantedDB.getOrCreateConversation(requestId, currentUser);
            window.location.href = `./messages.html?id=${encodeURIComponent(conversationId)}`;
        } catch (error) {
            console.error("Could not start wanted-request conversation:", error);
            setStatus(error.message || "Could not start the conversation. Please try again.", "error");
            button.disabled = false;
            button.textContent = "I'm interested";
        }
    });

    async function init() {
        try {
            currentUser = await CampusAuth.getUser();
            if (!currentUser) {
                const next = window.location.pathname + window.location.search;
                window.location.href = `./login.html?next=${encodeURIComponent(next)}`;
                return;
            }

            setStatus("Loading wanted requests…");
            const requests = await CampusWantedDB.getOpenRequests(currentUser);
            clearStatus();
            render(requests);
        } catch (error) {
            console.error("Wanted board could not load:", error);
            setStatus(error.message || "Could not load wanted requests. Check your connection and Supabase setup.", "error");
        }
    }

    init();
})();
