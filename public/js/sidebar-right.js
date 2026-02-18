// sidebar-right.js
import { fetchCollections, createCollection as apiCreateCollection } from "./collection-client.js";
import { fetchDocumentsWithEmbedStatus, uploadDocuments, deleteDocument } from "./document-client.js";
import { showConfirmDialogue } from "./confirm-dialogue.js";
import {embedDocument} from "./embedding-client.js";

const emptyState = document.getElementById("collectionEmptyState");
const createCollectionBtn = document.getElementById("createCollectionBtn");
const createCollectionInput = document.getElementById("collectionCreateInput");
const collectionNameInput = document.getElementById("collectionNameInput");
const confirmCollectionBtn = document.getElementById("confirmCollectionBtn");
const cancelCollectionBtn = document.getElementById("cancelCollectionBtn");
const collectionSelectorBtn = document.getElementById("collectionSelectorBtn");
const collectionDropDown = document.getElementById("collectionDropdownList");
const uploadFileBtn = document.getElementById("uploadFileBtn");
const fileInput = document.getElementById("fileUpload");
const documentEmptyText = document.getElementById("documentEmptyText");
const documentList = document.getElementById("documentList");

// ---- State ----
let collections = [];
let activeCollectionId = null;
let isEmbedding = false;  // Global lock: only one embed at a time

// ==================== COLLECTION CREATE / HIDE ====================

const showCreateInput = () => {
    emptyState.classList.add("hidden");
    collectionSelectorBtn.classList.add("hidden");
    uploadFileBtn.classList.add("hidden");
    documentEmptyText.classList.add("hidden");
    documentList.classList.add("hidden");

    createCollectionInput.classList.add("visible");
    collectionNameInput.value = "";
    collectionNameInput.focus();
};

const hideCreateInput = () => {
    createCollectionInput.classList.remove("visible");

    if (collections.length === 0) {
        emptyState.classList.remove("hidden");
    } else {
        collectionSelectorBtn.classList.remove("hidden");
        uploadFileBtn.classList.remove("hidden");
        documentList.classList.remove("hidden");

        const active = collections.find(c => c.id === activeCollectionId);
        if (active && active.doc_count === 0) {
            documentEmptyText.classList.remove("hidden");
        }
    }
};

const createCollection = async (name) => {
    const trimmed = name.trim();
    if (!trimmed) { return; }

    const newCollection = await apiCreateCollection(trimmed);
    collections.push({ ...newCollection, doc_count: 0 });

    if (collections.length === 1) {
        emptyState.classList.add("hidden");
        collectionSelectorBtn.classList.remove("hidden");
        uploadFileBtn.classList.remove("hidden");
        documentEmptyText.classList.remove("hidden");
    }

    activeCollectionId = newCollection.id;
    updateSelectorDisplay();
    renderDropdown();
    hideCreateInput();
    notifyCollectionsPage();
    notifyCollectionSelected();
};

// ==================== SELECTOR & DROPDOWN ====================

const updateSelectorDisplay = () => {
    const collection = collections.find(c => c.id === activeCollectionId);
    if (!collection) return;
    collectionSelectorBtn.querySelector(".collection-selector-name").textContent = collection.name;
    const count = collection.doc_count || 0;
    collectionSelectorBtn.querySelector(".collection-selector-count").textContent = `${count} document${count !== 1 ? "s" : ""}`;
};

const renderDropdown = () => {
    collectionDropDown.innerHTML = "";

    collections.forEach((collection) => {
        const li = document.createElement("li");
        li.classList.add("collection-dropdown-item");
        if (collection.id === activeCollectionId) { li.classList.add("active"); }

        const icon = document.createElement("span");
        icon.classList.add("material-symbols-outlined");
        icon.textContent = "folder_special";

        const textWrapper = document.createElement("div");
        textWrapper.classList.add("collection-dropdown-item-text");

        const nameSpan = document.createElement("span");
        nameSpan.classList.add("collection-dropdown-item-name");
        nameSpan.textContent = collection.name;

        const countSpan = document.createElement("span");
        countSpan.classList.add("collection-dropdown-item-count");
        const count = collection.doc_count || 0;
        countSpan.textContent = `${count} document${count !== 1 ? "s" : ""}`;

        textWrapper.appendChild(nameSpan);
        textWrapper.appendChild(countSpan);
        li.appendChild(icon);
        li.appendChild(textWrapper);

        li.addEventListener("click", () => selectCollection(collection.id));
        collectionDropDown.appendChild(li);
    });

    const newItem = document.createElement("li");
    newItem.classList.add("collection-dropdown-item", "new-collection");
    newItem.innerHTML = `
        <span class="material-symbols-outlined">add</span>
        <span>New Collection</span>
    `;
    newItem.addEventListener("click", () => {
        handleDropdown();
        showCreateInput();
    });
    collectionDropDown.appendChild(newItem);
};

// ==================== DOCUMENT LIST ====================

const refreshDocuments = async () => {
    const docs = await fetchDocumentsWithEmbedStatus(activeCollectionId);

    const collection = collections.find(c => c.id === activeCollectionId);
    if (collection) {
        collection.doc_count = docs.length;
        updateSelectorDisplay();
        renderDropdown();
    }

    documentList.innerHTML = "";
    documentEmptyText.classList.toggle("hidden", docs.length > 0);

    docs.forEach((doc) => renderDocumentItem(doc));
};

/**
 * Render a single document list item.
 * Embed button state is derived from doc.chunk_count:
 *   0  → "idle"     (never embedded — show embed button)
 *   >0 → "embedded" (check icon — click to re-embed)
 */
const renderDocumentItem = (doc) => {
    const li = document.createElement("li");
    li.classList.add("document-item");
    li.dataset.documentId = doc.id;

    const icon = document.createElement("span");
    icon.classList.add("material-symbols-outlined", "document-item-icon");
    icon.textContent = "picture_as_pdf";

    const nameSpan = document.createElement("span");
    nameSpan.classList.add("document-item-name");
    nameSpan.title = doc.original_name;
    nameSpan.textContent = doc.original_name;

    const embedBtn = buildEmbedButton(doc);

    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("delete-btn");
    deleteBtn.title = "Delete document";
    deleteBtn.innerHTML = `<span class="material-symbols-outlined">delete</span>`;
    deleteBtn.addEventListener("click", () => confirmDeleteDocument(doc));

    li.appendChild(icon);
    li.appendChild(nameSpan);
    li.appendChild(embedBtn);
    li.appendChild(deleteBtn);
    documentList.appendChild(li);
};

// ==================== EMBED BUTTON ====================

/**
 * Build the embed button for a document item.
 * Initial visual state is derived from doc.chunk_count.
 */
const buildEmbedButton = (doc) => {
    const btn = document.createElement("button");
    btn.classList.add("embed-btn");
    btn.dataset.documentId = doc.id;

    setEmbedBtnState(btn, doc.chunk_count > 0 ? "embedded" : "idle");
    btn.addEventListener("click", () => handleEmbed(doc, btn));
    return btn;
};

/**
 * Set the visual state of an embed button.
 *
 * @param {HTMLButtonElement} btn
 * @param {"idle"|"loading"|"embedded"|"error"} state
 */
const setEmbedBtnState = (btn, state) => {
    btn.dataset.embedState = state;
    btn.disabled = state === "loading";

    const states = {
        idle:     { icon: "neurology",          title: "Embed document",               spin: false },
        loading:  { icon: "progress_activity",  title: "Embedding…",                   spin: true  },
        embedded: { icon: "check_circle",        title: "Embedded — click to re-embed", spin: false },
        error:    { icon: "error",               title: "Failed — click to retry",      spin: false },
    };

    const { icon, title, spin } = states[state] ?? states.idle;
    btn.title = title;
    btn.innerHTML = `<span class="material-symbols-outlined${spin ? " spin" : ""}">${icon}</span>`;
};

/**
 * Disable/enable all embed buttons while one is running.
 * The currently loading button handles its own disabled state separately.
 */
const setAllEmbedButtonsLocked = (locked) => {
    documentList.querySelectorAll(".embed-btn").forEach((btn) => {
        if (btn.dataset.embedState !== "loading") {
            btn.disabled = locked;
            btn.classList.toggle("embed-btn--locked", locked);
        }
    });
};

const handleEmbed = async (doc, btn) => {
    if (isEmbedding) { return; }

    isEmbedding = true;
    setEmbedBtnState(btn, "loading");
    setAllEmbedButtonsLocked(true);

    try {
        await embedDocument(doc.id);
        setEmbedBtnState(btn, "embedded");
        // Notify RAG page so stats refresh
        document.dispatchEvent(new CustomEvent("collections-changed"));
    } catch (error) {
        console.error("Embed failed:", error);
        setEmbedBtnState(btn, "error");
    } finally {
        isEmbedding = false;
        setAllEmbedButtonsLocked(false);
        // Ensure the finished button is re-enabled regardless
        btn.disabled = false;
        btn.classList.remove("embed-btn--locked");
    }
};

// ==================== DELETE DOCUMENT ====================

const confirmDeleteDocument = (doc) => {
    showConfirmDialogue({
        title: "Delete Document",
        message: `Delete "${doc.original_name}"? This will also remove its embedded vectors and cannot be undone.`,
        confirmLabel: "Delete",
        onConfirm: async () => {
            await deleteDocument(doc.id);
            await refreshDocuments();
            notifyCollectionsPage();
        }
    });
};

// ==================== COLLECTION SELECTION ====================

const selectCollection = async (id) => {
    activeCollectionId = id;
    updateSelectorDisplay();
    renderDropdown();
    handleDropdown();
    await refreshDocuments();
    notifyCollectionSelected();
};

const handleDropdown = () => {
    collectionSelectorBtn.classList.toggle("open");
    collectionDropDown.classList.toggle("visible");
};

// ==================== NOTIFICATIONS ====================

const notifyCollectionsPage = () => {
    document.dispatchEvent(new CustomEvent("collections-changed"));
};

const notifyCollectionSelected = () => {
    document.dispatchEvent(new CustomEvent("collection-selected", {
        detail: { collectionId: activeCollectionId }
    }));
};


// ==================== EXTERNAL REFRESH ====================

const refreshFromExternal = async () => {
    collections = await fetchCollections();

    if (collections.length === 0) {
        activeCollectionId = null;
        collectionSelectorBtn.classList.add("hidden");
        uploadFileBtn.classList.add("hidden");
        documentEmptyText.classList.add("hidden");
        documentList.innerHTML = "";
        documentList.classList.add("hidden");
        emptyState.classList.remove("hidden");
        notifyCollectionSelected();
        return;
    }

    // If active collection was deleted, fall back to first
    if (!collections.find(c => c.id === activeCollectionId)) {
        activeCollectionId = collections[0].id;
        notifyCollectionSelected();
    }

    emptyState.classList.add("hidden");
    collectionSelectorBtn.classList.remove("hidden");
    uploadFileBtn.classList.remove("hidden");
    documentList.classList.remove("hidden");
    updateSelectorDisplay();
    renderDropdown();
    await refreshDocuments();
};

// ==================== EVENT LISTENERS ====================

createCollectionBtn.addEventListener("click", showCreateInput);
confirmCollectionBtn.addEventListener("click", () => createCollection(collectionNameInput.value));
cancelCollectionBtn.addEventListener("click", hideCreateInput);
collectionSelectorBtn.addEventListener("click", handleDropdown);
collectionNameInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") createCollection(collectionNameInput.value);
    if (event.key === "Escape") hideCreateInput();
});

uploadFileBtn.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", async (event) => {
    if (!activeCollectionId || !event.target.files.length) { return; }
    await uploadDocuments(event.target.files, activeCollectionId);
    fileInput.value = "";
    await refreshDocuments();
});

document.addEventListener("collections-changed", refreshFromExternal);

// ---- Outside Click Dismissal ----
document.addEventListener("click", (event) => {
    const isOpen = collectionDropDown.classList.contains("visible");
    if (!isOpen) { return; }

    const clickedInsideSelector = collectionSelectorBtn.contains(event.target);
    const clickedInsideDropdown = collectionDropDown.contains(event.target);

    if (!clickedInsideSelector && !clickedInsideDropdown) {
        collectionSelectorBtn.classList.remove("open");
        collectionDropDown.classList.remove("visible");
    }
});

// ---- Collapse Toggle ----
const sidebar = document.querySelector(".sidebar-right");
const collapseBtn = document.querySelector(".sidebar-right-collapse-btn");

collapseBtn.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
});

// ==================== INIT ====================

const init = async () => {
    collections = await fetchCollections();
    if (collections.length > 0) {
        activeCollectionId = collections[0].id;
        emptyState.classList.add("hidden");
        collectionSelectorBtn.classList.remove("hidden");
        uploadFileBtn.classList.remove("hidden");
        updateSelectorDisplay();
        renderDropdown();
        await refreshDocuments();
    }
    // Broadcast the initial selection (even if null) so RAG page can set up
    notifyCollectionSelected();
};

init();