/*
 * Campus Marketplace - shared browser storage helpers.
 * This is a front-end prototype: data is saved in this browser's localStorage.
 */
(function () {
    "use strict";

    const LISTINGS_KEY = "campusListings";
    const WANTED_KEY = "campusWantedRequests";

    // Keys used by the separate ES-module draft. Import them once when
    // the current HTML-based version has not created its own data yet.
    const LEGACY_LISTINGS_KEY = "campus-marketplace-listings";
    const LEGACY_WANTED_KEY = "campus-marketplace-wanted-posts";

    const demoListings = [
        {
            id: "demo-calculator",
            title: "Casio Scientific Calculator",
            category: "academic",
            type: "sell",
            price: 650,
            condition: "good",
            location: "Library Entrance",
            description: "A Casio scientific calculator in good working condition. Useful for engineering coursework.",
            image: "../assets/images/calculator.svg",
            seller: "Campus Student",
            status: "Available",
            date: "5 Nov 2026",
            createdAt: "2026-11-05T09:00:00.000Z"
        },
        {
            id: "demo-study-table",
            title: "Study Table",
            category: "furniture",
            type: "sell",
            price: 1200,
            condition: "good",
            location: "Hostel Common Area",
            description: "A sturdy study table in good condition. Campus handover preferred.",
            image: "../assets/images/study-table.svg",
            seller: "Campus Student",
            status: "Available",
            date: "4 Nov 2026",
            createdAt: "2026-11-04T10:00:00.000Z"
        },
        {
            id: "demo-textbooks",
            title: "Engineering Textbook Set",
            category: "books",
            type: "sell",
            price: 800,
            condition: "like-new",
            location: "Academic Block Lobby",
            description: "A set of engineering textbooks in very good condition.",
            image: "../assets/images/textbooks.svg",
            seller: "Campus Student",
            status: "Available",
            date: "3 Nov 2026",
            createdAt: "2026-11-03T10:00:00.000Z"
        },
        {
            id: "demo-bicycle",
            title: "Bicycle",
            category: "sports",
            type: "rent",
            price: 300,
            condition: "good",
            location: "Student Activity Centre",
            description: "A bicycle available for short-term campus use.",
            image: "../assets/images/bicycle.svg",
            seller: "Campus Student",
            status: "Available",
            date: "2 Nov 2026",
            createdAt: "2026-11-02T10:00:00.000Z"
        }
    ];

    const demoWanted = [
        {
            id: "wanted-monitor",
            title: "Looking for a second-hand monitor",
            category: "electronics",
            minimumBudget: 3000,
            maximumBudget: 6000,
            deadline: "2026-11-25",
            location: "Library Entrance",
            description: "Looking for a working monitor suitable for coding and coursework. 22-inch or larger preferred.",
            notes: "HDMI input preferred.",
            requester: "Campus Student",
            status: "Open",
            createdAt: "2026-11-05T09:00:00.000Z"
        },
        {
            id: "wanted-maths-book",
            title: "Need engineering mathematics textbook",
            category: "books",
            minimumBudget: 200,
            maximumBudget: 500,
            deadline: "2026-11-22",
            location: "Academic Block Lobby",
            description: "Looking for a used engineering mathematics textbook for the current semester.",
            notes: "Previous edition is also acceptable.",
            requester: "Campus Student",
            status: "Open",
            createdAt: "2026-11-04T09:00:00.000Z"
        },
        {
            id: "wanted-chair",
            title: "Need a study chair",
            category: "furniture",
            minimumBudget: 500,
            maximumBudget: 1500,
            deadline: "2026-11-30",
            location: "Hostel Common Area",
            description: "Looking for a comfortable study chair suitable for long study sessions in a hostel room.",
            notes: "A chair with back support would be ideal.",
            requester: "Campus Student",
            status: "Open",
            createdAt: "2026-11-03T09:00:00.000Z"
        },
        {
            id: "wanted-bicycle",
            title: "Looking to rent a bicycle",
            category: "sports",
            minimumBudget: 200,
            maximumBudget: 500,
            deadline: "2026-11-24",
            location: "Student Activity Centre",
            description: "Need a bicycle for short-distance campus travel for about one week.",
            notes: "Please mention availability and rental duration.",
            requester: "Campus Student",
            status: "Open",
            createdAt: "2026-11-02T09:00:00.000Z"
        }
    ];

    function readArray(key) {
        try {
            const raw = localStorage.getItem(key);
            if (raw === null) return null;
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.error("Could not read marketplace data:", error);
            return [];
        }
    }

    function writeArray(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error("Could not save marketplace data:", error);
            return false;
        }
    }

    function createId(prefix) {
        const randomPart = Math.random().toString(36).slice(2, 8);
        return `${prefix}-${Date.now()}-${randomPart}`;
    }

    function normalizeListing(item) {
        const createdAt = item.createdAt || new Date().toISOString();
        return {
            ...item,
            id: String(item.id || createId("listing")),
            title: String(item.title || "Untitled item"),
            category: String(item.category || "other").toLowerCase().replace(/\\s+/g, "-"),
            type: String(item.type || item.transactionType || "sell").toLowerCase(),
            price: Number.isFinite(Number(item.price)) ? Number(item.price) : 0,
            condition: String(item.condition || "good").toLowerCase().replace(/\\s+/g, "-"),
            location: String(item.location || "Campus"),
            description: String(item.description || ""),
            image: typeof item.image === "string" ? item.image : "",
            seller: String(item.seller || item.sellerName || "Campus Student"),
            status: String(item.status || "Available"),
            date: item.date || formatDate(createdAt.slice(0, 10)),
            createdAt
        };
    }

    function normalizeWantedRequest(request) {
        return {
            ...request,
            id: String(request.id || createId("wanted")),
            title: String(request.title || "Wanted item"),
            category: String(request.category || "other").toLowerCase().replace(/\\s+/g, "-"),
            minimumBudget: Number(request.minimumBudget ?? request.minBudget ?? 0) || 0,
            maximumBudget: Number(request.maximumBudget ?? request.maxBudget ?? 0) || 0,
            deadline: String(request.deadline || ""),
            location: String(request.location || "Campus"),
            description: String(request.description || ""),
            notes: String(request.notes || ""),
            requester: String(request.requester || request.requesterName || "Campus Student"),
            status: String(request.status || "Open"),
            createdAt: request.createdAt || new Date().toISOString()
        };
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]);
    }

    function titleCase(value) {
        return String(value ?? "")
            .split(/[-_\s]+/)
            .filter(Boolean)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    }

    function formatMoney(value) {
        const amount = Number(value);
        if (!Number.isFinite(amount)) return "₹0";
        return `₹${amount.toLocaleString("en-IN")}`;
    }

    function formatDate(value) {
        if (!value) return "Not specified";
        const date = new Date(`${value}T00:00:00`);
        if (Number.isNaN(date.getTime())) return String(value);
        return date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    }

    function readImageFile(file, maximumBytes = 1024 * 1024) {
        return new Promise((resolve, reject) => {
            if (!file) {
                resolve("");
                return;
            }

            if (!file.type.startsWith("image/")) {
                reject(new Error("Please select a valid image file."));
                return;
            }

            if (file.size > maximumBytes) {
                reject(new Error("Please choose an image smaller than 1 MB."));
                return;
            }

            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ""));
            reader.onerror = () => reject(new Error("The selected image could not be read."));
            reader.readAsDataURL(file);
        });
    }

    function initializeDemoData() {
        if (readArray(LISTINGS_KEY) === null) {
            const legacyListings = readArray(LEGACY_LISTINGS_KEY);
            const initialListings = legacyListings === null
                ? demoListings
                : legacyListings.map(normalizeListing);
            writeArray(LISTINGS_KEY, initialListings);
        }

        if (readArray(WANTED_KEY) === null) {
            const legacyRequests = readArray(LEGACY_WANTED_KEY);
            const initialRequests = legacyRequests === null
                ? demoWanted
                : legacyRequests.map(normalizeWantedRequest);
            writeArray(WANTED_KEY, initialRequests);
        }
    }

    function getListings() {
        return readArray(LISTINGS_KEY) || [];
    }

    function saveListings(listings) {
        return writeArray(LISTINGS_KEY, listings);
    }

    function getWantedRequests() {
        return readArray(WANTED_KEY) || [];
    }

    function saveWantedRequests(requests) {
        return writeArray(WANTED_KEY, requests);
    }

    window.CampusStore = {
        LISTINGS_KEY,
        WANTED_KEY,
        createId,
        escapeHTML,
        titleCase,
        formatMoney,
        formatDate,
        readImageFile,
        initializeDemoData,
        getListings,
        saveListings,
        getWantedRequests,
        saveWantedRequests
    };
})();
