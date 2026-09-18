import { createHeader } from "../components/header.js";
import { getListingById } from "../services/listing-service.js";

const app = document.querySelector("#app");

const header = createHeader("..");

app.append(header);

const params = new URLSearchParams(
    window.location.search
);

const listingId = params.get("id");

const listing = getListingById(listingId);

const main = document.createElement("main");
main.className = "listing-page";

if (!listing) {
    main.innerHTML = `
        <section class="listing-not-found">
            <p class="home-kicker">Listing</p>

            <h1>Listing not found</h1>

            <p>
                The listing you're looking for does not exist
                or is no longer available.
            </p>

            <a
                class="button button--primary"
                href="./marketplace.html"
            >
                Back to Marketplace
            </a>
        </section>
    `;

    app.append(main);
} else {
    const breadcrumb = document.createElement("nav");

    breadcrumb.className = "listing-breadcrumb";
    breadcrumb.setAttribute(
        "aria-label",
        "Breadcrumb"
    );

    const marketplaceLink =
        document.createElement("a");

    marketplaceLink.href = "./marketplace.html";
    marketplaceLink.textContent = "Marketplace";

    const separator =
        document.createElement("span");

    separator.textContent = "/";

    const current =
        document.createElement("span");

    current.textContent = listing.title;

    breadcrumb.append(
        marketplaceLink,
        separator,
        current
    );

    const detailSection =
        document.createElement("section");

    detailSection.className = "listing-detail";

    const image =
        document.createElement("div");

    image.className = "listing-detail__image";

    const imageLabel =
        document.createElement("span");

    imageLabel.textContent =
        listing.category;

    image.append(imageLabel);

    const content =
        document.createElement("div");

    content.className =
        "listing-detail__content";

    const type =
        document.createElement("p");

    type.className = "home-kicker";
    type.textContent =
        formatTransactionType(
            listing.transactionType
        );

    const title =
        document.createElement("h1");

    title.textContent = listing.title;

    const price =
        document.createElement("p");

    price.className =
        "listing-detail__price";

    price.textContent =
        `₹${listing.price}`;

    const facts =
        document.createElement("div");

    facts.className =
        "listing-detail__facts";

    addFact(
        facts,
        "Category",
        listing.category
    );

    addFact(
        facts,
        "Condition",
        listing.condition
    );

    addFact(
        facts,
        "Handover location",
        listing.location
    );

    const description =
        document.createElement("div");

    description.className =
        "listing-detail__description";

    const descriptionHeading =
        document.createElement("h2");

    descriptionHeading.textContent =
        "Description";

    const descriptionText =
        document.createElement("p");

    descriptionText.textContent =
        listing.description;

    description.append(
        descriptionHeading,
        descriptionText
    );

    const actions =
        document.createElement("div");

    actions.className =
        "listing-detail__actions";

    const contactButton =
        document.createElement("button");

    contactButton.className =
        "button button--primary";

    contactButton.type = "button";
    contactButton.textContent =
        "Contact seller";

    const offerButton =
        document.createElement("button");

    offerButton.className =
        "button button--secondary";

    offerButton.type = "button";
    offerButton.textContent =
        "Make an offer";

    const editLink =
        document.createElement("a");

    editLink.className =
        "button button--secondary";

    editLink.href =
        `./edit-listing.html?id=${encodeURIComponent(
            listing.id
        )}`;

    editLink.textContent =
        "Edit Listing";

    actions.append(
        contactButton,
        offerButton,
        editLink
    );

    const note =
        document.createElement("p");

    note.className =
        "listing-detail__note";

    note.textContent =
        "Messaging, offers, and authorization are currently frontend prototypes.";

    content.append(
        type,
        title,
        price,
        facts,
        description,
        actions,
        note
    );

    detailSection.append(
        image,
        content
    );

    main.append(
        breadcrumb,
        detailSection
    );

    app.append(main);
}

function addFact(container, label, value) {
    const row =
        document.createElement("div");

    const labelElement =
        document.createElement("span");

    labelElement.textContent = label;

    const valueElement =
        document.createElement("strong");

    valueElement.textContent = value;

    row.append(
        labelElement,
        valueElement
    );

    container.append(row);
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