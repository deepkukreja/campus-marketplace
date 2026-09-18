import { listings } from "../data/listings.js";

export function getListings() {
    return listings;
}

export function getListingById(listingId) {
    return listings.find((listing) => listing.id === listingId);
}

export function searchAndFilterListings({
    searchTerm = "",
    category = "all",
    transactionType = "all",
    maxPrice = "",
    sortBy = "newest"
} = {}) {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    let results = listings.filter((listing) => {
        const matchesSearch =
            normalizedSearchTerm === "" ||
            listing.title.toLowerCase().includes(normalizedSearchTerm) ||
            listing.description.toLowerCase().includes(normalizedSearchTerm) ||
            listing.category.toLowerCase().includes(normalizedSearchTerm);

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

        return new Date(second.createdAt) - new Date(first.createdAt);
    });

    return results;
}