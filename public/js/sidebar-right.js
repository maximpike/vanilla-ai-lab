const emptyState = document.getElementById("collectionEmptyState");
const createCollectionBtn = document.getElementById("createCollectionBtn")
const createCollectionInput= document.getElementById("collectionCreateInput");
const collectionNameInput = document.getElementById("collectionNameInput")
const confirmCollectionBtn = document.getElementById("confirmCollectionBtn");
const cancelCollectionBtn = document.getElementById("cancelCollectionBtn");
const collectionSelectorBtn = document.getElementById("collectionSelectorBtn");
const collectionDropDown = document.getElementById("collectionDropdownList");
const uploadFileBtn = document.getElementById("uploadFileBtn");
const documentEmptyText = document.getElementById("documentEmptyText");
const documentList = document.getElementById("documentList");

// ---- State ----
let collections= [];
let activeCollectionId = null;
let nextId = 1;

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

const createCollection = (name) => {
    const trimmed = name.trim();
    if (!trimmed) { return; }

    const newCollection = { id: nextId++, name: trimmed, doc_count: 0 };
    collections.push(newCollection);

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
    collectionSelectorBtn.querySelector(".collection-selector-count").textContent =
        `${collection.doc_count} document${collection.doc_count !== 1 ? "s" : ""}`;
}

const renderDropdown = () => {
    collectionDropDown.innerHTML = "";

    collections.forEach((collection) => {
        const li = document.createElement("li");
        li.classList.add("collection-dropdown-item");
        if (collection.id === activeCollectionId) { li.classList.add("active"); }

        li.innerHTML = `
            <span class="material-symbols-outlined">folder_special</span>
            <div class="collection-dropdown-item-text">
                <span class="collection-dropdown-item-name">${collection.name}</span>
                <span class="collection-dropdown-item-count">${collection.doc_count} document${(collection.doc_count) !== 1 ? "s" : ""}</span>
            </div>
        `

        li.addEventListener("click", () => selectCollection(collection.id));
        collectionDropDown.appendChild(li);
    });

    // TODO: When wiring BE innerHTML -> createElement + textContent to avoid any injection risk
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

const selectCollection = (id) => {
    activeCollectionId = id;
    updateSelectorDisplay();
    renderDropdown();
    handleDropdown();
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