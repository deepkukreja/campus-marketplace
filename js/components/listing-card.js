export function createListingCard(listing) {
    const article =
        document.createElement("article");

    article.className =
        "listing-card";

    const link =
        document.createElement("a");

    link.className =
        "listing-card__link";

    link.href =
        `./listing.html?id=${encodeURIComponent(
            listing.id
        )}`;

    link.setAttribute(
        "aria-label",
        `View ${listing.title}`
    );

    const image =
        document.createElement("div");

    image.className =
        "listing-card__image";

    const imageLabel =
        document.createElement("span");

    imageLabel.textContent =
        listing.category;

    image.append(imageLabel);

    const content =
        document.createElement("div");

    content.className =
        "listing-card__content";

    const type =
        document.createElement("p");

    type.className =
        "listing-card__type";

    type.textContent =
        formatTransactionType(
            listing.transactionType
        );

    const title =
        document.createElement("h3");

    title.className =
        "listing-card__title";

    title.textContent =
        listing.title;

    const condition =
        document.createElement("p");

    condition.className =
        "listing-card__condition";

    condition.textContent =
        listing.condition;

    const footer =
        document.createElement("div");

    footer.className =
        "listing-card__footer";

    const price =
        document.createElement("strong");

    price.textContent =
        `₹${listing.price}`;

    const location =
        document.createElement("span");

    location.textContent =
        listing.location;

    footer.append(
        price,
        location
    );

    content.append(
        type,
        title,
        condition,
        footer
    );

    link.append(
        image,
        content
    );

    article.append(link);

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