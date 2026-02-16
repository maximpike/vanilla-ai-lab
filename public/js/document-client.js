// document-client.js
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const BASE = "/api/documents";

export const fetchDocuments = async (collectionId) => {
    let res;
    try {
        res = await fetch(`${BASE}/${collectionId}`, {method: "GET"});
    } catch (error) {
        console.error("document-client network error:", error);
        throw error
    }

    if(!res.ok) {
        const body = await res.json();
        const error = new Error(body.error || "Failed to fetch documents");
        console.error("document-client error:", error);
        throw error;
    }
    return res.json();
}

export const uploadDocuments = async (files, collectionId) => {
    if (!files || files.length === 0) {
        return { message: "No files selected" };
    }

    const formData = new FormData();
    for (const file of files) {
        if (file.size > MAX_FILE_SIZE) {
            console.error(`${file.name} exceeds size limit`);
            throw new Error(`${file.name} is too large. Max 10MB.`);
        }
        formData.append("files", file);
    }

    let res;
    try {
        res = await fetch(`${BASE}/${collectionId}/upload`, {
            method: "POST",
            body: formData
        });
    } catch (error) {
        console.error("document-client network error:", error);
        throw error
    }

    if(!res.ok) {
        const body = await res.json();
        const error = new Error(body.error || "Failed to upload documents");
        console.error("document-client error:", error);
        throw error;
    }
    return res.json();
}

export const deleteDocument = async (id) => {
    let res;
    try {
        res = await fetch(`${BASE}/${id}`, {method: "DELETE"})
    } catch (error) {
        console.error("document-client network error:", error);
        throw error
    }

    if (!res.ok) {
        const body = await res.json();
        const error = new Error(body.error || "Failed to delete document");
        console.error("document-client error:", error);
        throw error;
    }
}