import { createHeader } from "../components/header.js";
import { getListingById } from "../services/listing-service.js";

const app = document.querySelector("#app");

const header = createHeader("..");

app.append(header);

const params = new URLSearchParams(window.location.search);
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
                The listing you're looking for does not exist or is no longer available.
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
    main.innerHTML = `
        <nav class="listing-breadcrumb" aria-label="Breadcrumb">
            <a href="./marketplace.html">Marketplace</a>
            <span>/</span>
            <span>${listing.title}</span>
        </nav>

        <section class="listing-detail">
            <div class="listing-detail__image">
                <span>${listing.category}</span>
            </div>

            <div class="listing-detail__content">
                <p class="home-kicker">
                    ${formatTransactionType(listing.transactionType)}
                </p>

                <h1>${listing.title}</h1>

                <p class="listing-detail__price">
                    ₹${listing.price}
                </p>

                <div class="listing-detail__facts">
                    <div>
                        <span>Category</span>
                        <strong>${listing.category}</strong>
                    </div>

                    <div>
                        <span>Condition</span>
                        <strong>${listing.condition}</strong>
                    </div>

                    <div>
                        <span>Handover location</span>
                        <strong>${listing.location}</strong>
                    </div>
                </div>

                <div class="listing-detail__description">
                    <h2>Description</h2>

                    <p>
                        ${listing.description}
                    </p>
                </div>

                <div class="listing-detail__actions">
                    <button
                        class="button button--primary"
                        type="button"
                    >
                        Contact seller
                    </button>

                    <button
                        class="button button--secondary"
                        type="button"
                    >
                        Make an offer
                    </button>
                </div>

                <p class="listing-detail__note">
                    Messaging and offers are currently a frontend prototype.
                </p>
            </div>
        </section>
    `;

    app.append(main);
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