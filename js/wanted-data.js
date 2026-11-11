/*
 * Campus Marketplace - shared wanted-request and messaging data layer.
 * Requires CampusAuth and the Supabase client to be loaded first.
 */
(function () {
    "use strict";

    const WANTED_TABLE = "wanted_requests";
    const CONVERSATIONS_TABLE = "conversations";
    const MESSAGES_TABLE = "messages";

    function getClient() {
        const client = window.CampusAuth?.client;
        if (!client) {
            throw new Error("Supabase is not configured. Check the Supabase scripts and js/supabase-config.js.");
        }
        return client;
    }

    function mapWanted(row) {
        return {
            id: String(row.id),
            ownerId: row.owner_id,
            legacyId: row.legacy_id || null,
            title: row.title || "Wanted item",
            category: String(row.category || "other").toLowerCase(),
            minimumBudget: Number(row.minimum_budget || 0),
            maximumBudget: Number(row.maximum_budget || 0),
            deadline: row.deadline || "",
            location: row.location || "Campus",
            description: row.description || "",
            notes: row.notes || "",
            status: row.status || "Open",
            createdAt: row.created_at || new Date().toISOString()
        };
    }

    async function importLegacyRequests(user) {
        if (!user?.id || !window.CampusStore) return 0;

        let localRequests = [];
        try {
            CampusStore.initializeDemoData();
            localRequests = CampusStore.getWantedRequests().filter(request =>
                request && request.ownerId === user.id && request.id &&
                !String(request.id).startsWith("demo-")
            );
        } catch (error) {
            console.warn("Could not inspect older wanted requests:", error);
            return 0;
        }

        let imported = 0;
        const client = getClient();

        for (const request of localRequests) {
            const legacyId = String(request.id);
            const { data: existing, error: lookupError } = await client
                .from(WANTED_TABLE)
                .select("id")
                .eq("owner_id", user.id)
                .eq("legacy_id", legacyId)
                .maybeSingle();

            if (lookupError) throw lookupError;
            if (existing) continue;

            const min = Math.max(0, Number(request.minimumBudget ?? request.minBudget ?? 0) || 0);
            const max = Math.max(min, Number(request.maximumBudget ?? request.maxBudget ?? 0) || 0);
            const status = ["Open", "Closed", "Fulfilled"].includes(request.status)
                ? request.status
                : "Open";

            const payload = {
                owner_id: user.id,
                legacy_id: legacyId,
                title: String(request.title || "Wanted item").trim().slice(0, 100),
                category: String(request.category || "other").toLowerCase(),
                minimum_budget: min,
                maximum_budget: max,
                deadline: request.deadline,
                location: String(request.location || "Campus").slice(0, 120),
                description: String(request.description || "").slice(0, 1000),
                notes: String(request.notes || "").slice(0, 500),
                status,
                created_at: request.createdAt || new Date().toISOString()
            };

            const { error: insertError } = await client.from(WANTED_TABLE).insert(payload);
            if (insertError) {
                if (insertError.code === "23505") continue;
                throw insertError;
            }
            imported += 1;
        }

        return imported;
    }

    async function getOpenRequests(user) {
        const client = getClient();
        await importLegacyRequests(user);

        const { data, error } = await client
            .from(WANTED_TABLE)
            .select("id, owner_id, legacy_id, title, category, minimum_budget, maximum_budget, deadline, location, description, notes, status, created_at")
            .eq("status", "Open")
            .order("created_at", { ascending: false });

        if (error) throw error;
        return (data || []).map(mapWanted);
    }

    async function createWantedRequest(values, user) {
        if (!user?.id) throw new Error("Please sign in with your BMU account first.");

        const payload = {
            owner_id: user.id,
            title: String(values.title || "").trim().slice(0, 100),
            category: String(values.category || "other").toLowerCase(),
            minimum_budget: Number(values.minimumBudget || 0),
            maximum_budget: Number(values.maximumBudget || 0),
            deadline: values.deadline,
            location: String(values.location || "Campus").slice(0, 120),
            description: String(values.description || "").trim().slice(0, 1000),
            notes: String(values.notes || "").trim().slice(0, 500),
            status: "Open"
        };

        const { data, error } = await getClient()
            .from(WANTED_TABLE)
            .insert(payload)
            .select("id, owner_id, legacy_id, title, category, minimum_budget, maximum_budget, deadline, location, description, notes, status, created_at")
            .single();

        if (error) throw error;
        return mapWanted(data);
    }

    async function getOrCreateConversation(requestId, user) {
        if (!user?.id) throw new Error("Please sign in before contacting a student.");
        const client = getClient();

        const { data: request, error: requestError } = await client
            .from(WANTED_TABLE)
            .select("id, owner_id, title, status")
            .eq("id", requestId)
            .maybeSingle();

        if (requestError) throw requestError;
        if (!request) throw new Error("This wanted request is no longer available.");
        if (request.status !== "Open") throw new Error("This wanted request is no longer open.");
        if (request.owner_id === user.id) throw new Error("You cannot start a conversation with yourself.");

        const fetchExisting = async () => {
            const { data, error } = await client
                .from(CONVERSATIONS_TABLE)
                .select("id")
                .eq("wanted_request_id", requestId)
                .eq("interested_user_id", user.id)
                .maybeSingle();
            if (error) throw error;
            return data;
        };

        const existing = await fetchExisting();
        if (existing) return existing.id;

        const { data, error } = await client
            .from(CONVERSATIONS_TABLE)
            .insert({
                wanted_request_id: request.id,
                requester_id: request.owner_id,
                interested_user_id: user.id
            })
            .select("id")
            .single();

        if (!error && data) return data.id;

        // If another click/tab created the unique conversation first, reuse it.
        if (error?.code === "23505") {
            const raced = await fetchExisting();
            if (raced) return raced.id;
        }
        throw error || new Error("Could not start the conversation.");
    }

    async function getOrCreateListingConversation(listingId, user) {
        if (!user?.id) throw new Error("Please sign in before contacting a seller.");
        if (!listingId) throw new Error("The listing ID is missing.");

        const client = getClient();
        const { data: listing, error: listingError } = await client
            .from("listings")
            .select("id, owner_id, title, status")
            .eq("id", listingId)
            .maybeSingle();

        if (listingError) throw listingError;
        if (!listing) throw new Error("This listing is no longer available.");
        if (!listing.owner_id) {
            throw new Error("This is a sample listing without a student seller account. Try contacting the owner of a student-created listing.");
        }
        if (listing.owner_id === user.id) {
            throw new Error("This is your own listing. You cannot start a conversation with yourself.");
        }
        if (String(listing.status || "").toLowerCase() !== "available") {
            throw new Error("This listing is not currently available for contact.");
        }

        const fetchExisting = async () => {
            const { data, error } = await client
                .from(CONVERSATIONS_TABLE)
                .select("id")
                .eq("listing_id", listingId)
                .eq("interested_user_id", user.id)
                .maybeSingle();
            if (error) throw error;
            return data;
        };

        const existing = await fetchExisting();
        if (existing) return existing.id;

        const { data, error } = await client
            .from(CONVERSATIONS_TABLE)
            .insert({
                listing_id: listing.id,
                wanted_request_id: null,
                requester_id: listing.owner_id,
                interested_user_id: user.id
            })
            .select("id")
            .single();

        if (!error && data) return data.id;

        if (error?.code === "23505") {
            const raced = await fetchExisting();
            if (raced) return raced.id;
        }
        throw error || new Error("Could not start a conversation with this seller.");
    }

    async function getMyConversations(user) {
        if (!user?.id) throw new Error("Please sign in to view your messages.");
        const client = getClient();

        const [asRequester, asInterested] = await Promise.all([
            client.from(CONVERSATIONS_TABLE)
                .select("id, wanted_request_id, listing_id, requester_id, interested_user_id, created_at, wanted_requests(title), listing:listings(title)")
                .eq("requester_id", user.id)
                .order("created_at", { ascending: false }),
            client.from(CONVERSATIONS_TABLE)
                .select("id, wanted_request_id, listing_id, requester_id, interested_user_id, created_at, wanted_requests(title), listing:listings(title)")
                .eq("interested_user_id", user.id)
                .order("created_at", { ascending: false })
        ]);

        if (asRequester.error) throw asRequester.error;
        if (asInterested.error) throw asInterested.error;

        const combined = [...(asRequester.data || []), ...(asInterested.data || [])];
        const unique = new Map(combined.map(row => [row.id, row]));
        return [...unique.values()].sort((a, b) =>
            new Date(b.created_at || 0) - new Date(a.created_at || 0)
        );
    }

    async function getConversationMessages(conversationId) {
        const { data, error } = await getClient()
            .from(MESSAGES_TABLE)
            .select("id, conversation_id, sender_id, body, created_at")
            .eq("conversation_id", conversationId)
            .order("created_at", { ascending: true });

        if (error) throw error;
        return data || [];
    }

    async function sendMessage(conversationId, body, user) {
        const cleanBody = String(body || "").trim();
        if (!user?.id) throw new Error("Your login session has expired. Sign in again.");
        if (!cleanBody) throw new Error("Write a message before sending.");
        if (cleanBody.length > 2000) throw new Error("Messages must be 2,000 characters or fewer.");

        const { data, error } = await getClient()
            .from(MESSAGES_TABLE)
            .insert({
                conversation_id: conversationId,
                sender_id: user.id,
                body: cleanBody
            })
            .select("id, conversation_id, sender_id, body, created_at")
            .single();

        if (error) throw error;
        return data;
    }

    window.CampusWantedDB = {
        getOpenRequests,
        createWantedRequest,
        getOrCreateConversation,
        getOrCreateListingConversation,
        getMyConversations,
        getConversationMessages,
        sendMessage
    };
})();
