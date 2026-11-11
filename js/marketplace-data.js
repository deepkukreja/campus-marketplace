/*
 * Campus Marketplace - Supabase listing data layer.
 * Handles listing creation, reading, editing and deletion.
 */

(function () {
    "use strict";

    const supabaseState = window.CampusSupabase || {};
    const client = supabaseState.client;

    const TABLE = "listings";
    const BUCKET = "listing-images";
    const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

    const DELETED_LEGACY_PREFIX = "campusMarketplaceDeletedLegacyIds:";

    const ALLOWED_IMAGE_TYPES = new Set([
        "image/jpeg",
        "image/png",
        "image/webp"
    ]);

    // --------------------------------------------------
    // SUPABASE CLIENT
    // --------------------------------------------------

    function requireClient() {
        if (!client) {
            throw new Error(
                supabaseState.error ||
                "Supabase is not configured. Check js/supabase-config.js."
            );
        }

        return client;
    }

    // --------------------------------------------------
    // LISTING DATA MAPPING
    // --------------------------------------------------

    function mapListing(row) {
        const createdAt = row.created_at || new Date().toISOString();

        return {
            id: String(row.id),
            ownerId: row.owner_id || null,
            legacyId: row.legacy_id || null,
            title: row.title || "Untitled item",
            category: String(row.category || "other").toLowerCase(),
            type: String(row.transaction_type || "sell").toLowerCase(),
            price: Number(row.price || 0),
            condition: String(row.condition || "not-specified").toLowerCase(),
            location: row.location || "Campus",
            description: row.description || "",
            image: row.image_url || "",
            imagePath: row.image_path || null,
            seller: row.seller_name || "BMU Student",
            status: row.status || "Available",
            date: new Date(createdAt).toLocaleDateString("en-IN"),
            createdAt
        };
    }

    // --------------------------------------------------
    // LEGACY DELETION TRACKING
    // --------------------------------------------------

    function getDeletedLegacyIds(userId) {
        try {
            const key = DELETED_LEGACY_PREFIX + userId;
            const stored = JSON.parse(localStorage.getItem(key) || "[]");

            return new Set(
                Array.isArray(stored) ? stored.map(String) : []
            );

        } catch (error) {
            console.warn("Could not read deleted listing records:", error);
            return new Set();
        }
    }

    function markLegacyListingDeleted(userId, legacyId) {
        if (!userId || !legacyId) return;

        try {
            const key = DELETED_LEGACY_PREFIX + userId;
            const deletedIds = getDeletedLegacyIds(userId);

            deletedIds.add(String(legacyId));

            localStorage.setItem(
                key,
                JSON.stringify([...deletedIds])
            );

        } catch (error) {
            console.warn("Could not save deleted listing record:", error);
        }
    }

    function removeLegacyListingFromStorage(listingId, current, user) {
        if (!window.CampusStore || !user?.id) return;

        try {
            window.CampusStore.initializeDemoData();

            const idsToRemove = new Set([
                String(listingId)
            ]);

            if (current.legacyId) {
                idsToRemove.add(String(current.legacyId));

                markLegacyListingDeleted(
                    user.id,
                    current.legacyId
                );
            }

            const oldListings = window.CampusStore.getListings();

            const updatedListings = oldListings.filter(item => {
                if (!item) return true;

                const itemId = String(item.id || "");

                const isMatchingId = idsToRemove.has(itemId);

                const belongsToUser = item.ownerId === user.id;

                // Remove only this user's matching old listing.
                return !(isMatchingId && belongsToUser);
            });

            const saved = window.CampusStore.saveListings(updatedListings);

            if (!saved) {
                console.warn("Could not remove the old browser listing.");
            }

        } catch (error) {
            console.warn("Browser listing cleanup failed:", error);
        }
    }

    // --------------------------------------------------
    // IMAGE HELPERS
    // --------------------------------------------------

    function extensionForMime(mimeType) {
        if (mimeType === "image/jpeg") return "jpg";
        if (mimeType === "image/png") return "png";
        if (mimeType === "image/webp") return "webp";

        return null;
    }

    async function uploadImage(
        fileOrBlob,
        userId,
        preferredName = "listing-image"
    ) {
        if (!fileOrBlob) {
            return {
                imageUrl: null,
                imagePath: null
            };
        }

        if (!ALLOWED_IMAGE_TYPES.has(fileOrBlob.type)) {
            throw new Error("Please use a JPG, PNG or WebP image.");
        }

        if (fileOrBlob.size > MAX_IMAGE_BYTES) {
            throw new Error("Please choose an image smaller than 2 MB.");
        }

        const extension = extensionForMime(fileOrBlob.type);

        const safeBase = String(preferredName || "listing-image")
            .replace(/\.[^.]+$/, "")
            .replace(/[^a-zA-Z0-9_-]/g, "-")
            .slice(0, 45) || "listing-image";

        const uniquePart = window.crypto?.randomUUID
            ? window.crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

        const path = `${userId}/${uniquePart}-${safeBase}.${extension}`;

        const supabase = requireClient();

        const { error } = await supabase.storage
            .from(BUCKET)
            .upload(path, fileOrBlob, {
                cacheControl: "3600",
                upsert: false,
                contentType: fileOrBlob.type
            });

        if (error) throw error;

        const { data } = supabase.storage
            .from(BUCKET)
            .getPublicUrl(path);

        return {
            imageUrl: data.publicUrl,
            imagePath: path
        };
    }

    async function removeImage(path) {
        if (!path) return;

        try {
            const { error } = await requireClient()
                .storage
                .from(BUCKET)
                .remove([path]);

            if (error) {
                console.warn("Image removal failed:", error.message);
            }

        } catch (error) {
            console.warn("Image cleanup failed:", error.message);
        }
    }

    // --------------------------------------------------
    // GET ALL LISTINGS
    // --------------------------------------------------

    async function getListings() {
        const { data, error } = await requireClient()
            .from(TABLE)
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;

        return (data || []).map(mapListing);
    }

    // --------------------------------------------------
    // GET ONE LISTING
    // --------------------------------------------------

    async function getListingById(listingId) {
        if (!listingId) return null;

        const { data, error } = await requireClient()
            .from(TABLE)
            .select("*")
            .eq("id", listingId)
            .maybeSingle();

        if (error) throw error;

        return data ? mapListing(data) : null;
    }

    // --------------------------------------------------
    // GET SELLER NAME
    // --------------------------------------------------

    async function getSellerName(user) {
        const { data, error } = await requireClient()
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .maybeSingle();

        if (error) throw error;

        return (
            data?.full_name ||
            user.user_metadata?.full_name ||
            user.email ||
            "BMU Student"
        );
    }

    // --------------------------------------------------
    // CREATE LISTING
    // --------------------------------------------------

    async function createListing(values, imageFile, user) {
        if (!user?.id) {
            throw new Error(
                "Please sign in with your BMU account before posting an item."
            );
        }

        const sellerName = await getSellerName(user);

        let uploaded = {
            imageUrl: null,
            imagePath: null
        };

        try {
            if (imageFile) {
                uploaded = await uploadImage(
                    imageFile,
                    user.id,
                    imageFile.name
                );
            }

            const payload = {
                owner_id: user.id,
                title: values.title,
                category: values.category,
                transaction_type: values.type,
                price: values.price,
                condition: values.condition,
                location: values.location,
                description: values.description,
                seller_name: sellerName,
                image_url: uploaded.imageUrl,
                image_path: uploaded.imagePath,
                status: "Available"
            };

            const { data, error } = await requireClient()
                .from(TABLE)
                .insert(payload)
                .select("*")
                .single();

            if (error) throw error;

            return mapListing(data);

        } catch (error) {
            if (uploaded.imagePath) {
                await removeImage(uploaded.imagePath);
            }

            throw error;
        }
    }

    // --------------------------------------------------
    // UPDATE LISTING
    // --------------------------------------------------

    async function updateListing(listingId, values, imageFile, user) {
        if (!user?.id) {
            throw new Error("Please sign in before editing a listing.");
        }

        const current = await getListingById(listingId);

        if (!current) {
            throw new Error("Listing not found.");
        }

        if (current.ownerId !== user.id) {
            throw new Error(
                "You can edit only listings created by your own BMU account."
            );
        }

        let uploaded = null;

        try {
            if (imageFile) {
                uploaded = await uploadImage(
                    imageFile,
                    user.id,
                    imageFile.name
                );
            }

            const payload = {
                title: values.title,
                category: values.category,
                price: values.price,
                condition: values.condition,
                description: values.description,
                location: values.location,
                status: values.status
            };

            if (uploaded) {
                payload.image_url = uploaded.imageUrl;
                payload.image_path = uploaded.imagePath;
            }

            const { data, error } = await requireClient()
                .from(TABLE)
                .update(payload)
                .eq("id", listingId)
                .eq("owner_id", user.id)
                .select("*")
                .single();

            if (error) throw error;

            if (uploaded && current.imagePath) {
                await removeImage(current.imagePath);
            }

            return mapListing(data);

        } catch (error) {
            if (uploaded?.imagePath) {
                await removeImage(uploaded.imagePath);
            }

            throw error;
        }
    }

    // --------------------------------------------------
    // DELETE LISTING
    // --------------------------------------------------

    async function deleteListing(listingId, user) {
        if (!user?.id) {
            throw new Error(
                "Your Supabase login session is missing. Sign in again."
            );
        }

        if (!listingId) {
            throw new Error("Listing ID is missing.");
        }

        const supabase = requireClient();

        // Find the listing.
        const current = await getListingById(listingId);

        if (!current) {
            throw new Error("Listing not found.");
        }

        // Verify ownership.
        if (current.ownerId !== user.id) {
            throw new Error(
                "You can delete only listings created by your own BMU account."
            );
        }

        // Delete the record from Supabase.
        const { data, error } = await supabase
            .from(TABLE)
            .delete()
            .eq("id", listingId)
            .eq("owner_id", user.id)
            .select("id");

        if (error) {
            throw error;
        }

        // Make sure Supabase actually deleted a row.
        if (!data || data.length === 0) {
            throw new Error(
                "Supabase did not delete this listing. " +
                "Check the DELETE policy in Row Level Security."
            );
        }

        // Remove the old localStorage copy so it cannot be imported again.
        removeLegacyListingFromStorage(
            listingId,
            current,
            user
        );

        // Remove the associated image.
        if (current.imagePath) {
            await removeImage(current.imagePath);
        }

        console.log("Listing successfully deleted:", data[0].id);

        return {
            deletedId: data[0].id
        };
    }

    // --------------------------------------------------
    // IMPORT OLD BROWSER LISTINGS
    // --------------------------------------------------

    async function importLegacyListingsForUser(user) {
        if (!user?.id || !window.CampusStore) {
            return 0;
        }

        let localListings = [];

        const deletedIds = getDeletedLegacyIds(user.id);

        try {
            window.CampusStore.initializeDemoData();

            localListings = window.CampusStore.getListings().filter(item => {
                if (!item || item.ownerId !== user.id || !item.id) {
                    return false;
                }

                const legacyId = String(item.id);

                if (legacyId.startsWith("demo-")) {
                    return false;
                }

                // Do not import a listing that the user previously deleted.
                if (deletedIds.has(legacyId)) {
                    return false;
                }

                return true;
            });

        } catch (error) {
            console.warn(
                "Legacy listing data could not be inspected:",
                error
            );

            return 0;
        }

        let imported = 0;

        for (const item of localListings) {
            const legacyId = String(item.id);

            const { data: existing, error: lookupError } =
                await requireClient()
                    .from(TABLE)
                    .select("id")
                    .eq("owner_id", user.id)
                    .eq("legacy_id", legacyId)
                    .maybeSingle();

            if (lookupError) throw lookupError;

            if (existing) continue;

            let imageUrl =
                typeof item.image === "string" &&
                !item.image.startsWith("data:")
                    ? item.image
                    : null;

            let imagePath = null;

            if (
                typeof item.image === "string" &&
                item.image.startsWith("data:")
            ) {
                try {
                    const blob = await fetch(item.image)
                        .then(response => response.blob());

                    const uploaded = await uploadImage(
                        blob,
                        user.id,
                        `legacy-${legacyId}`
                    );

                    imageUrl = uploaded.imageUrl;
                    imagePath = uploaded.imagePath;

                } catch (error) {
                    console.warn(
                        `Image for old listing ${legacyId} was not imported:`,
                        error.message
                    );
                }
            }

            const type = String(
                item.type || item.transactionType || "sell"
            ).toLowerCase();

            const payload = {
                owner_id: user.id,
                legacy_id: legacyId,
                title: String(item.title || "Untitled item").slice(0, 100),
                category: String(item.category || "other").toLowerCase(),

                transaction_type: [
                    "sell",
                    "rent",
                    "swap",
                    "free"
                ].includes(type) ? type : "sell",

                price: Math.max(0, Number(item.price) || 0),
                condition: String(item.condition || "good").toLowerCase(),
                location: String(item.location || "Campus"),
                description: String(item.description || "").slice(0, 2000),

                seller_name: String(
                    item.seller ||
                    user.user_metadata?.full_name ||
                    user.email ||
                    "BMU Student"
                ),

                image_url: imageUrl,
                image_path: imagePath,

                status: [
                    "Available",
                    "Reserved",
                    "Sold"
                ].includes(item.status) ? item.status : "Available",

                created_at: item.createdAt || new Date().toISOString()
            };

            const { error: insertError } = await requireClient()
                .from(TABLE)
                .insert(payload);

            if (insertError) {
                if (imagePath) {
                    await removeImage(imagePath);
                }

                if (insertError.code === "23505") {
                    continue;
                }

                throw insertError;
            }

            imported += 1;
        }

        return imported;
    }

    // --------------------------------------------------
    // PUBLIC API
    // --------------------------------------------------

    window.CampusMarketplaceDB = {
        getListings,
        getListingById,
        createListing,
        updateListing,
        deleteListing,
        importLegacyListingsForUser
    };

})();