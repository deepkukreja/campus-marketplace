import { wantedPosts as seedWantedPosts } from "../data/wanted-posts.js";

const STORAGE_KEY = "campus-marketplace-wanted-posts";

function loadWantedPosts() {
    const storedPosts =
        localStorage.getItem(STORAGE_KEY);

    if (!storedPosts) {
        return [...seedWantedPosts];
    }

    try {
        const parsedPosts =
            JSON.parse(storedPosts);

        if (!Array.isArray(parsedPosts)) {
            return [...seedWantedPosts];
        }

        return parsedPosts;
    } catch {
        return [...seedWantedPosts];
    }
}

function saveWantedPosts(posts) {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(posts)
    );
}

export function getWantedPosts() {
    return loadWantedPosts();
}

export function getWantedPostById(postId) {
    const posts = loadWantedPosts();

    return posts.find(
        (post) => post.id === postId
    );
}