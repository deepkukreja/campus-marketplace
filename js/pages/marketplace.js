import { createHeader } from "../components/header.js";
import { createListingCard } from "../components/listing-card.js";
import { searchAndFilterListings } from "../services/listing-service.js";

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
        class="marketplace-controls"
        aria-labelledby="filter-title"
    >
        <h2 id="filter-title">Find an item</h2>

        <div class="filter-grid">
            <div class="filter-field filter-field--search">
                <label for="search-input">Search</label>

                <input
                    id="search-input"
                    type="search"
                    placeholder="Search listings..."
                    autocomplete="off"
                >
            </div>

            <div class="filter-field">
                <label for="category-filter">Category</label>

                <select id="category-filter">
                    <option value="all">All categories</option>
                    <option value="Academic">Academic</option>
                    <option value="Books">Books</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Sports">Sports</option>
                </select>
            </div>

            <div class="filter-field">
                <label for="transaction-filter">Type</label>

                <select id="transaction-filter">
                    <option value="all">All types</option>
                    <option value="sell">For sale</option>
                    <option value="rent">For rent</option>
                    <option value="swap">Swap</option>
                    <option value="free">Free</option>
                </select>
            </div>

            <div class="filter-field">
                <label for="price-filter">Maximum price</label>

                <input
                    id="price-filter"
                    type="number"
                    min="0"
                    placeholder="Any price"
                >
            </div>

            <div class="filter-field">
                <label for="sort-filter">Sort</label>

                <select id="sort-filter">
                    <option value="newest">Newest</option>
                    <option value="price-low">Price: Low to high</option>
                    <option value="price-high">Price: High to low</option>
                </select>
            </div>
        </div>
    </section>

    <section
        class="listing-section"
        aria-labelledby="listing-section-title"
    >
        <div class="listing-section__header">
            <div class="section-heading">
                <h2 id="listing-section-title">Recent listings</h2>
                <p id="listing-count"></p>
            </div>

            <button
                id="clear-filters"
                class="clear-filters"
                type="button"
            >
                Clear filters
            </button>
        </div>

        <div
            class="listing-grid"
            id="listing-grid"
        ></div>

        <div
            class="listing-empty"
            id="listing-empty"
            hidden
        >
            <h3>No listings found</h3>
            <p>
                Try changing your search or removing some filters.
            </p>
        </div>
    </section>
`;

app.append(main);

const searchInput = main.querySelector("#search-input");
const categoryFilter = main.querySelector("#category-filter");
const transactionFilter = main.querySelector("#transaction-filter");
const priceFilter = main.querySelector("#price-filter");
const sortFilter = main.querySelector("#sort-filter");
const clearFiltersButton = main.querySelector("#clear-filters");

const listingGrid = main.querySelector("#listing-grid");
const listingCount = main.querySelector("#listing-count");
const listingEmpty = main.querySelector("#listing-empty");

function renderListings() {
    const filteredListings = searchAndFilterListings({
        searchTerm: searchInput.value,
        category: categoryFilter.value,
        transactionType: transactionFilter.value,
        maxPrice: priceFilter.value,
        sortBy: sortFilter.value
    });

    listingGrid.innerHTML = "";

    listingCount.textContent =
        `${filteredListings.length} listing${filteredListings.length === 1 ? "" : "s"}`;

    listingEmpty.hidden = filteredListings.length !== 0;

    filteredListings.forEach((listing) => {
        const card = createListingCard(listing);
        listingGrid.append(card);
    });
}

function clearFilters() {
    searchInput.value = "";
    categoryFilter.value = "all";
    transactionFilter.value = "all";
    priceFilter.value = "";
    sortFilter.value = "newest";

    renderListings();
}

searchInput.addEventListener("input", renderListings);
categoryFilter.addEventListener("change", renderListings);
transactionFilter.addEventListener("change", renderListings);
priceFilter.addEventListener("input", renderListings);
sortFilter.addEventListener("change", renderListings);
clearFiltersButton.addEventListener("click", clearFilters);

renderListings();