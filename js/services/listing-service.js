import { listings as seedListings } from "../data/listings.js";

const STORAGE_KEY = "campus-marketplace-listings";

function loadListings() {
    const storedListings = localStorage.getItem(STORAGE_KEY);

    if (!storedListings) {
        return [...seedListings];
    }

    try {
        const parsedListings = JSON.parse(storedListings);

        if (!Array.isArray(parsedListings)) {
            return [...seedListings];
        }

        return parsedListings;
    } catch {
        return [...seedListings];
    }
}

function saveListings(listings) {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(listings)
    );
}

export function getListings() {
    return loadListings();
}

export function getListingById(listingId) {
    const listings = loadListings();

    return listings.find(
        (listing) => listing.id === listingId
    );
}

export function createListing(listingData) {
    const listings = loadListings();

    const newListing = {
        id: `listing_${crypto.randomUUID()}`,
        ...listingData,
        createdAt: new Date().toISOString(),
        image: null
    };

    listings.unshift(newListing);

    saveListings(listings);

    return newListing;
}

export function updateListing(listingId, listingData) {
    const listings = loadListings();

    const listingIndex = listings.findIndex(
        (listing) => listing.id === listingId
    );

    if (listingIndex === -1) {
        return null;
    }

    const updatedListing = {
        ...listings[listingIndex],
        ...listingData,
        id: listings[listingIndex].id,
        sellerId: listings[listingIndex].sellerId,
        createdAt: listings[listingIndex].createdAt
    };

    listings[listingIndex] = updatedListing;

    saveListings(listings);

    return updatedListing;
}

export function searchAndFilterListings({
    searchTerm = "",
    category = "all",
    transactionType = "all",
    maxPrice = "",
    sortBy = "newest"
} = {}) {
    const listings = loadListings();

    const normalizedSearchTerm =
        searchTerm.trim().toLowerCase();

    let results = listings.filter((listing) => {
        const matchesSearch =
            normalizedSearchTerm === "" ||
            listing.title
                .toLowerCase()
                .includes(normalizedSearchTerm) ||
            listing.description
                .toLowerCase()
                .includes(normalizedSearchTerm) ||
            listing.category
                .toLowerCase()
                .includes(normalizedSearchTerm);

        const matchesCategory =
            category === "all" ||
            listing.category === category;

        const matchesTransactionType =
            transactionType === "all" ||
            listing.transactionType === transactionType;

        const matchesMaxPrice =
            maxPrice === "" ||
            listing.price <= Number(maxPrice);

        return (
            matchesSearch &&
            matchesCategory &&
            matchesTransactionType &&
            matchesMaxPrice
        );
    });

    results.sort((first, second) => {
        if (sortBy === "price-low") {
            return first.price - second.price;
        }

        if (sortBy === "price-high") {
            return second.price - first.price;
        }

        return (
            new Date(second.createdAt) -
            new Date(first.createdAt)
        );
    });

    return results;
}
