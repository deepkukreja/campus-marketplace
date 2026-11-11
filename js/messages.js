(function () {
    "use strict";

    const listNode = document.getElementById("conversation-list");
    const titleNode = document.getElementById("chat-title");
    const subtitleNode = document.getElementById("chat-subtitle");
    const messageList = document.getElementById("message-list");
    const form = document.getElementById("message-form");
    const input = document.getElementById("message-input");
    const statusNode = document.getElementById("messages-status");
    const sendButton = document.getElementById("send-message-button");

    let user = null;
    let activeConversationId = new URLSearchParams(window.location.search).get("id");
    let activeConversations = [];
    let knownMessageIds = new Set();
    let pollingTimer = null;

    function setStatus(message, type = "info") {
        statusNode.textContent = message;
        statusNode.className = `messages-status is-visible is-${type}`;
    }

    function clearStatus() {
        statusNode.textContent = "";
        statusNode.className = "messages-status";
    }

    function isListingConversation(conversation) {
        return Boolean(conversation.listing_id || conversation.listing?.title || conversation.listings?.title);
    }

    function getConversationTitle(conversation) {
        return conversation.listing?.title ||
            conversation.listings?.title ||
            conversation.wanted_requests?.title ||
            (isListingConversation(conversation) ? "Marketplace listing conversation" : "Wanted request conversation");
    }

    function getConversationRole(conversation) {
        const isOwner = conversation.requester_id === user.id;
        if (isListingConversation(conversation)) {
            return isOwner ? "You posted this listing" : "You contacted this seller";
        }
        return isOwner ? "You posted this request" : "You expressed interest";
    }

    function addMessageBubble(message) {
        const wrapper = document.createElement("article");
        const mine = message.sender_id === user.id;
        wrapper.className = `chat-message ${mine ? "is-mine" : "is-theirs"}`;

        const body = document.createElement("p");
        body.className = "chat-message__body";
        body.textContent = message.body;

        const meta = document.createElement("div");
        meta.className = "chat-message__meta";
        const date = new Date(message.created_at);
        meta.textContent = `${mine ? "You" : "Other student"} · ${Number.isNaN(date.getTime()) ? "" : date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}`;

        wrapper.append(body, meta);
        messageList.append(wrapper);
    }

    function renderConversationList() {
        listNode.replaceChildren();

        if (!activeConversations.length) {
            const empty = document.createElement("p");
            empty.className = "inbox-empty";
            empty.textContent = "No conversations yet. Open a marketplace listing and choose Contact Seller, or open a wanted request and choose I'm interested.";
            listNode.append(empty);
            return;
        }

        activeConversations.forEach(conversation => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "conversation-item";
            button.classList.toggle("is-active", conversation.id === activeConversationId);
            button.dataset.conversationId = conversation.id;

            const title = document.createElement("strong");
            title.textContent = getConversationTitle(conversation);

            const role = document.createElement("span");
            role.textContent = getConversationRole(conversation);

            const date = document.createElement("small");
            const created = new Date(conversation.created_at);
            date.textContent = Number.isNaN(created.getTime()) ? "" : created.toLocaleDateString("en-IN");

            button.append(title, role, date);
            listNode.append(button);
        });
    }

    async function loadConversations() {
        activeConversations = await CampusWantedDB.getMyConversations(user);
        renderConversationList();

        if (!activeConversationId && activeConversations.length) {
            activeConversationId = activeConversations[0].id;
            const url = new URL(window.location.href);
            url.searchParams.set("id", activeConversationId);
            window.history.replaceState({}, "", url);
        }

        if (activeConversationId) {
            const isParticipant = activeConversations.some(item => item.id === activeConversationId);
            if (!isParticipant) {
                activeConversationId = null;
                titleNode.textContent = "Conversation not found";
                subtitleNode.textContent = "This conversation is not available to your account.";
                form.hidden = true;
                return;
            }
            await loadMessages(true);
        } else {
            titleNode.textContent = "Your messages";
            subtitleNode.textContent = "Choose a conversation to start chatting.";
            messageList.replaceChildren();
            form.hidden = true;
        }
    }

    async function loadMessages(forceScroll = false) {
        if (!activeConversationId) return;

        const conversation = activeConversations.find(item => item.id === activeConversationId);
        if (!conversation) return;

        const listingChat = isListingConversation(conversation);
        titleNode.textContent = getConversationTitle(conversation);
        subtitleNode.textContent = listingChat
            ? (conversation.requester_id === user.id
                ? "A student contacted you about your marketplace listing."
                : "You contacted the seller about this marketplace listing.")
            : (conversation.requester_id === user.id
                ? "A student is interested in your wanted request."
                : "You contacted the student who posted this wanted request.");
        form.hidden = false;

        const messages = await CampusWantedDB.getConversationMessages(activeConversationId);
        const unseen = messages.filter(message => !knownMessageIds.has(message.id));

        if (unseen.length || forceScroll) {
            if (forceScroll) {
                messageList.replaceChildren();
                knownMessageIds.clear();
                messages.forEach(message => {
                    knownMessageIds.add(message.id);
                    addMessageBubble(message);
                });
            } else {
                unseen.forEach(message => {
                    knownMessageIds.add(message.id);
                    addMessageBubble(message);
                });
            }
            messageList.scrollTop = messageList.scrollHeight;
        }
    }

    listNode.addEventListener("click", async event => {
        const button = event.target.closest(".conversation-item");
        if (!button) return;

        activeConversationId = button.dataset.conversationId;
        knownMessageIds.clear();
        const url = new URL(window.location.href);
        url.searchParams.set("id", activeConversationId);
        window.history.replaceState({}, "", url);
        renderConversationList();

        try {
            clearStatus();
            await loadMessages(true);
        } catch (error) {
            console.error("Could not load this conversation:", error);
            setStatus(error.message || "Could not load this conversation.", "error");
        }
    });

    form.addEventListener("submit", async event => {
        event.preventDefault();
        const body = input.value.trim();
        if (!body || !activeConversationId) return;

        sendButton.disabled = true;
        sendButton.textContent = "Sending…";
        try {
            await CampusWantedDB.sendMessage(activeConversationId, body, user);
            input.value = "";
            await loadMessages(true);
            clearStatus();
        } catch (error) {
            console.error("Message could not be sent:", error);
            setStatus(error.message || "Message could not be sent.", "error");
        } finally {
            sendButton.disabled = false;
            sendButton.textContent = "Send";
            input.focus();
        }
    });

    async function init() {
        try {
            user = await CampusAuth.getUser();
            if (!user) {
                const next = window.location.pathname + window.location.search;
                window.location.href = `./login.html?next=${encodeURIComponent(next)}`;
                return;
            }

            setStatus("Loading your conversations…");
            await loadConversations();
            clearStatus();

            // Poll for new messages until Supabase Realtime is configured.
            pollingTimer = window.setInterval(async () => {
                try {
                    await loadMessages(false);
                } catch (error) {
                    console.warn("Message refresh failed:", error);
                }
            }, 5000);
        } catch (error) {
            console.error("Inbox could not load:", error);
            setStatus(error.message || "Could not load your inbox. Check the Supabase setup.", "error");
        }
    }

    window.addEventListener("beforeunload", () => {
        if (pollingTimer) window.clearInterval(pollingTimer);
    });

    init();
})();
