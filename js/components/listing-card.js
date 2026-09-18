export function createListingCard(listing) {
    const article = document.createElement("article");

    article.className = "listing-card";

    article.innerHTML = `
        <div class="listing-card__image">
            <span>${listing.category}</span>
        </div>

        <div class="listing-card__content">
            <p class="listing-card__type">
                ${formatTransactionType(listing.transactionType)}
            </p>

            <h3 class="listing-card__title">
                ${listing.title}
            </h3>

            <p class="listing-card__condition">
                ${listing.condition}
            </p>

            <div class="listing-card__footer">
                <strong>₹${listing.price}</strong>
                <span>${listing.location}</span>
            </div>
        </div>
    `;

    return article;
}

function formatTransactionType(transactionType) {
    const labels = {
        sell: "For sale",
        rent: "For rent",
        swap: "Swap",
        free: "Free"
    };

    return labels[transactionType] ?? transactionType;
}