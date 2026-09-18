import { listings } from "../data/listings.js";

export function getListings() {
    return listings;
}

export function getListingById(listingId) {
    return listings.find((listing) => listing.id === listingId);
}