// sidebar-right.js
import { fetchCollections, createCollection as apiCreateCollection } from "./collection-client.js";
import { fetchDocuments, uploadDocuments, deleteDocument } from "./document-client.js";

const emptyState = document.getElementById("collectionEmptyState");
const createCollectionBtn = document.getElementById("createCollectionBtn")
const createCollectionInput= document.getElementById("collectionCreateInput");
const collectionNameInput = document.getElementById("collectionNameInput")
const confirmCollectionBtn = document.getElementById("confirmCollectionBtn");
const cancelCollectionBtn = document.getElementById("cancelCollectionBtn");
const collectionSelectorBtn = document.getElementById("collectionSelectorBtn");
const collectionDropDown = document.getElementById("collectionDropdownList");
const uploadFileBtn = document.getElementById("uploadFileBtn");
const fileInput = document.getElementById("fileUpload");
const documentEmptyText = document.getElementById("documentEmptyText");
const documentList = document.getElementById("documentList");

// ---- State ----
let collections= [];
let activeCollectionId = null;

const showCreateInput = () => {
    emptyState.classList.add("hidden");
    collectionSelectorBtn.classList.add("hidden");
    uploadFileBtn.classList.add("hidden");
    documentEmptyText.classList.add("hidden");
    documentList.classList.add("hidden");

    createCollectionInput.classList.add("visible");
    collectionNameInput.value = "";
    collectionNameInput.focus();
}

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
}

const createCollection = async (name) => {
    const trimmed = name.trim();
    if (!trimmed) { return; }

    const newCollection = await apiCreateCollection(trimmed)
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
}

const updateSelectorDisplay = () => {
    const collection = collections.find(c => c.id === activeCollectionId);
    collectionSelectorBtn.querySelector(".collection-selector-name").textContent = collection.name;
    const count = collection.doc_count || 0;
    collectionSelectorBtn.querySelector(".collection-selector-count").textContent = `${count} document${count !== 1 ? "s" : ""}`;
}

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
    `
    newItem.addEventListener("click", () => {
        handleDropdown();
        showCreateInput();
    });
    collectionDropDown.appendChild(newItem);
}

const refreshDocuments = async () => {
    const docs = await fetchDocuments(activeCollectionId);

    const collection = collections.find(c => c.id === activeCollectionId);
    if (collection) {
        collection.doc_count = docs.length;
        updateSelectorDisplay();
        renderDropdown();
    }

    documentList.innerHTML = "";
    documentEmptyText.classList.toggle("hidden", docs.length > 0 );

    docs.forEach( (doc) => {
        const li = document.createElement("li");
        li.classList.add("document-item");

        const icon = document.createElement("span");
        icon.classList.add("material-symbols-outlined", "document-item-icon");
        icon.textContent = "picture_as_pdf";

        const nameSpan = document.createElement("span");
        nameSpan.classList.add("document-item-name");
        nameSpan.textContent = doc.original_name;

        const deleteBtn = document.createElement("button");
        deleteBtn.classList.add("delete-btn");
        deleteBtn.innerHTML = `<span class="material-symbols-outlined">delete</span>`;
        deleteBtn.addEventListener("click", async () => {
            await deleteDocument(doc.id);
            await refreshDocuments();
        });

        li.appendChild(icon);
        li.appendChild(nameSpan);
        li.appendChild(deleteBtn);
        documentList.appendChild(li);
    })
}

const selectCollection = async (id) => {
    activeCollectionId = id;
    updateSelectorDisplay();
    renderDropdown();
    handleDropdown();
    await refreshDocuments();
};

const handleDropdown = () => {
    collectionSelectorBtn.classList.toggle("open");
    collectionDropDown.classList.toggle("visible")
}

// ---- Event Listeners ----
createCollectionBtn.addEventListener("click", showCreateInput);
confirmCollectionBtn.addEventListener("click", () => createCollection(collectionNameInput.value));
cancelCollectionBtn.addEventListener("click", hideCreateInput);
collectionSelectorBtn.addEventListener('click', handleDropdown);
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

// ---- Initialise ----
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
};

init();