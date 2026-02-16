// public/collection-client.js
const BASE = "/api/collections";

export const createCollection = async (name) => {
    let res;
    try {
        res = await fetch(BASE, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({name})
        });
    } catch (error) {
        console.error("collection-client network error:", error);
        throw error;
    }

    if (!res.ok) {
        const body = await res.json();
        const error = new Error(body.error || "Failed to create collection");
        console.error("collection-client error:", error);
        throw error;
    }
    return res.json();
}

export const fetchCollections = async () => {
    let res;
    try {
        res = await fetch(BASE);
    } catch (error) {
        console.error("collection-client network error:", error);
        throw error;
    }

    if (!res.ok) {
        const body = await res.json();
        const error = new Error(body.error || "Failed to fetch collection");
        console.error("collection-client error:", error);
        throw error;
    }
    return res.json();
}

export const updateCollection = async (name, id) => {
    let res;
    try {
        res = await fetch(`${BASE}/${id}`, {
            method: "PUT",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({name})
        });
    } catch (error) {
        console.error("collection-client network error:", error);
        throw error;
    }

    if (!res.ok) {
        const body =  await res.json();
        const error = new Error(body.error || "Failed to rename collection");
        console.error("collection-client error:", error);
        throw error;
    }
    return res.json();
}

export const deleteCollection = async (id) => {
    let res;
    try {
        res = await fetch(`${BASE}/${id}`, {method: "DELETE"});
    } catch (error) {
        console.error("collection-client network error:", error);
        throw error;
    }
    if (!res.ok) {
        const body = await res.json();
        const error = new Error(body.error || "Failed to delete collection");
        console.error("collection-client error:", error);
        throw error;
    }
};