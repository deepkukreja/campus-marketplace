import { createHeader } from "../components/header.js";
import { createListingCard } from "../components/listing-card.js";
import { getListings } from "../services/listing-service.js";

const app = document.querySelector("#app");

const header = createHeader("..");

app.append(header);

const main = document.createElement("main");
main.className = "marketplace-page";

main.innerHTML = `
    <section class="marketplace-intro">
        <p class="home-kicker">Marketplace</p>

        <div class="marketplace-heading">
            <div>
                <h1>Browse campus listings</h1>
                <p>
                    Find items available from students across your campus.
                </p>
            </div>

            <a
                class="button button--primary"
                href="./create-listing.html"
            >
                Post an Item
            </a>
        </div>
    </section>

    <section
        class="listing-section"
        aria-labelledby="listing-section-title"
    >
        <div class="section-heading">
            <h2 id="listing-section-title">Recent listings</h2>
        </div>

        <div
            class="listing-grid"
            id="listing-grid"
        ></div>
    </section>
`;

app.append(main);

const listingGrid = main.querySelector("#listing-grid");

const marketplaceListings = getListings();

marketplaceListings.forEach((listing) => {
    const card = createListingCard(listing);
    listingGrid.append(card);
});