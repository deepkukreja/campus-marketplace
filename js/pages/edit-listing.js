import { createHeader } from "../components/header.js";
import {
    getListingById,
    updateListing
} from "../services/listing-service.js";

const app = document.querySelector("#app");

const header = createHeader("..");

app.append(header);

const params = new URLSearchParams(window.location.search);

const listingId = params.get("id");

const listing = getListingById(listingId);

const main = document.createElement("main");

main.className = "create-listing-page";

if (!listing) {
    main.innerHTML = `
        <section class="listing-not-found">
            <p class="home-kicker">Edit Listing</p>

            <h1>Listing not found</h1>

            <p>
                The listing you're trying to edit does not exist.
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
        <section class="create-listing-intro">
            <p class="home-kicker">Manage listing</p>

            <h1>Edit listing</h1>

            <p>
                Update the information other students see.
            </p>
        </section>

        <section class="listing-form-section">
            <form
                id="listing-form"
                class="listing-form"
                novalidate
            >

                <div class="form-field">
                    <label for="title">Item title</label>

                    <input
                        id="title"
                        name="title"
                        type="text"
                        maxlength="100"
                        required
                    >

                    <p
                        class="field-error"
                        id="title-error"
                        aria-live="polite"
                    ></p>
                </div>

                <div class="form-grid">

                    <div class="form-field">
                        <label for="category">Category</label>

                        <select
                            id="category"
                            name="category"
                            required
                        >
                            <option value="">Select category</option>
                            <option value="Academic">Academic</option>
                            <option value="Books">Books</option>
                            <option value="Electronics">Electronics</option>
                            <option value="Furniture">Furniture</option>
                            <option value="Hostel">Hostel</option>
                            <option value="Sports">Sports</option>
                            <option value="Clothing">Clothing</option>
                            <option value="Other">Other</option>
                        </select>

                        <p
                            class="field-error"
                            id="category-error"
                            aria-live="polite"
                        ></p>
                    </div>

                    <div class="form-field">
                        <label for="transaction-type">
                            Transaction type
                        </label>

                        <select
                            id="transaction-type"
                            name="transactionType"
                            required
                        >
                            <option value="">Select type</option>
                            <option value="sell">Sell</option>
                            <option value="rent">Rent</option>
                            <option value="swap">Swap</option>
                            <option value="free">Give away</option>
                        </select>

                        <p
                            class="field-error"
                            id="transaction-type-error"
                            aria-live="polite"
                        ></p>
                    </div>

                </div>

                <div class="form-grid">

                    <div class="form-field">
                        <label for="price">Price (₹)</label>

                        <input
                            id="price"
                            name="price"
                            type="number"
                            min="0"
                            step="1"
                        >

                        <p
                            class="field-help"
                            id="price-help"
                        >
                            Enter 0 when giving an item away.
                        </p>

                        <p
                            class="field-error"
                            id="price-error"
                            aria-live="polite"
                        ></p>
                    </div>

                    <div class="form-field">
                        <label for="condition">Condition</label>

                        <select
                            id="condition"
                            name="condition"
                            required
                        >
                            <option value="">Select condition</option>
                            <option value="New">New</option>
                            <option value="Like New">Like New</option>
                            <option value="Good">Good</option>
                            <option value="Fair">Fair</option>
                            <option value="Needs Repair">
                                Needs Repair
                            </option>
                        </select>

                        <p
                            class="field-error"
                            id="condition-error"
                            aria-live="polite"
                        ></p>
                    </div>

                </div>

                <div class="form-field">
                    <label for="location">
                        Preferred handover location
                    </label>

                    <select
                        id="location"
                        name="location"
                        required
                    >
                        <option value="">Select location</option>
                        <option value="Library Entrance">
                            Library Entrance
                        </option>
                        <option value="Student Activity Centre">
                            Student Activity Centre
                        </option>
                        <option value="Cafeteria Entrance">
                            Cafeteria Entrance
                        </option>
                        <option value="Academic Block Lobby">
                            Academic Block Lobby
                        </option>
                        <option value="Security Desk">
                            Security Desk
                        </option>
                        <option value="Hostel Common Area">
                            Hostel Common Area
                        </option>
                    </select>

                    <p
                        class="field-error"
                        id="location-error"
                        aria-live="polite"
                    ></p>
                </div>

                <div class="form-field">
                    <label for="description">Description</label>

                    <textarea
                        id="description"
                        name="description"
                        rows="6"
                        maxlength="1000"
                        required
                    ></textarea>

                    <p
                        class="field-error"
                        id="description-error"
                        aria-live="polite"
                    ></p>
                </div>

                <div class="form-notice">
                    <strong>Frontend prototype</strong>

                    <p>
                        Changes are currently stored in this browser.
                        Real authorization will eventually be enforced
                        by the backend.
                    </p>
                </div>

                <div class="form-actions">
                    <a
                        class="button button--secondary"
                        id="cancel-link"
                        href="./marketplace.html"
                    >
                        Cancel
                    </a>

                    <button
                        class="button button--primary"
                        type="submit"
                    >
                        Save Changes
                    </button>
                </div>

                <p
                    id="form-status"
                    class="form-status"
                    aria-live="polite"
                ></p>

            </form>
        </section>
    `;

    app.append(main);

    const form = main.querySelector("#listing-form");

    const titleInput =
        main.querySelector("#title");

    const categoryInput =
        main.querySelector("#category");

    const transactionTypeInput =
        main.querySelector("#transaction-type");

    const priceInput =
        main.querySelector("#price");

    const conditionInput =
        main.querySelector("#condition");

    const locationInput =
        main.querySelector("#location");

    const descriptionInput =
        main.querySelector("#description");

    const formStatus =
        main.querySelector("#form-status");

    const cancelLink =
        main.querySelector("#cancel-link");

    titleInput.value = listing.title;
    categoryInput.value = listing.category;
    transactionTypeInput.value =
        listing.transactionType;
    priceInput.value = listing.price;
    conditionInput.value = listing.condition;
    locationInput.value = listing.location;
    descriptionInput.value =
        listing.description;

    cancelLink.href =
        `./listing.html?id=${encodeURIComponent(
            listing.id
        )}`;

    updatePriceState();

    function setError(fieldName, message) {
        const errorElement =
            main.querySelector(`#${fieldName}-error`);

        if (errorElement) {
            errorElement.textContent = message;
        }
    }

    function clearErrors() {
        const errorElements =
            main.querySelectorAll(".field-error");

        errorElements.forEach((element) => {
            element.textContent = "";
        });

        const fields = [
            titleInput,
            categoryInput,
            transactionTypeInput,
            priceInput,
            conditionInput,
            locationInput,
            descriptionInput
        ];

        fields.forEach((field) => {
            field.removeAttribute("aria-invalid");
        });
    }

    function validateForm() {
        clearErrors();

        let isValid = true;

        const title =
            titleInput.value.trim();

        const category =
            categoryInput.value;

        const transactionType =
            transactionTypeInput.value;

        const condition =
            conditionInput.value;

        const location =
            locationInput.value;

        const description =
            descriptionInput.value.trim();

        if (title.length < 3) {
            setError(
                "title",
                "Enter an item title with at least 3 characters."
            );

            titleInput.setAttribute(
                "aria-invalid",
                "true"
            );

            isValid = false;
        }

        if (!category) {
            setError(
                "category",
                "Select a category."
            );

            categoryInput.setAttribute(
                "aria-invalid",
                "true"
            );

            isValid = false;
        }

        if (!transactionType) {
            setError(
                "transaction-type",
                "Select a transaction type."
            );

            transactionTypeInput.setAttribute(
                "aria-invalid",
                "true"
            );

            isValid = false;
        }

        if (transactionType === "free") {
            priceInput.value = "0";
        }

        const numericPrice =
            Number(priceInput.value);

        if (
            priceInput.value !== "" &&
            (
                !Number.isFinite(numericPrice) ||
                numericPrice < 0
            )
        ) {
            setError(
                "price",
                "Enter a valid price of 0 or more."
            );

            priceInput.setAttribute(
                "aria-invalid",
                "true"
            );

            isValid = false;
        }

        if (!condition) {
            setError(
                "condition",
                "Select the item's condition."
            );

            conditionInput.setAttribute(
                "aria-invalid",
                "true"
            );

            isValid = false;
        }

        if (!location) {
            setError(
                "location",
                "Select a campus handover location."
            );

            locationInput.setAttribute(
                "aria-invalid",
                "true"
            );

            isValid = false;
        }

        if (description.length < 10) {
            setError(
                "description",
                "Enter a description with at least 10 characters."
            );

            descriptionInput.setAttribute(
                "aria-invalid",
                "true"
            );

            isValid = false;
        }

        return {
            isValid,
            values: {
                title,
                category,
                transactionType,
                price:
                    transactionType === "free"
                        ? 0
                        : Number(
                            priceInput.value || 0
                        ),
                condition,
                location,
                description
            }
        };
    }

    function updatePriceState() {
        if (
            transactionTypeInput.value === "free"
        ) {
            priceInput.value = "0";
            priceInput.disabled = true;
        } else {
            priceInput.disabled = false;
        }
    }

    transactionTypeInput.addEventListener(
        "change",
        updatePriceState
    );

    form.addEventListener(
        "submit",
        (event) => {
            event.preventDefault();

            formStatus.textContent = "";

            const validation =
                validateForm();

            if (!validation.isValid) {
                formStatus.textContent =
                    "Please correct the highlighted fields.";

                return;
            }

            const updatedListing =
                updateListing(
                    listing.id,
                    validation.values
                );

            if (!updatedListing) {
                formStatus.textContent =
                    "The listing could not be updated.";

                return;
            }

            formStatus.textContent =
                "Listing updated successfully.";

            window.setTimeout(() => {
                window.location.href =
                    `./listing.html?id=${encodeURIComponent(
                        updatedListing.id
                    )}`;
            }, 400);
        }
    );
}