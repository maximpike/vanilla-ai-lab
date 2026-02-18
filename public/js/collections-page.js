// collections-page.js
import {
    fetchCollections,
    createCollection as apiCreateCollection,
    updateCollection as apiUpdateCollection,
    deleteCollection as apiDeleteCollection
} from "./collection-client.js";
import { showConfirmDialogue } from "./confirm-dialogue.js";

const tableBody = document.getElementById("collectionsTableBody");
const emptyState = document.getElementById("collectionsEmptyState");
const createBtn = document.getElementById("collectionsCreateBtn");
const createRow = document.getElementById("collectionsCreateRow");
const createInput = document.getElementById("collectionsCreateInput");
const createConfirmBtn = document.getElementById("collectionsCreateConfirm");
const createCancelBtn = document.getElementById("collectionsCreateCancel");

// ---- State ----
let collections = [];
let renameActive = false;

// ---- Helpers ----
const formatDate = (iso) => {
    if (!iso) { return "—"; }
    const d = new Date(iso + "Z"); // SQLite stores without timezone
    if (isNaN(d.getTime())) { return "—"; }
    return d.toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric"
    });
};

const notifySidebar = () => {
    document.dispatchEvent(new CustomEvent("collections-changed"));
};

// ==================== RENDER ====================
const renderTable = () => {
    tableBody.innerHTML = "";

    if (collections.length === 0) {
        emptyState.classList.remove("hidden");
        return;
    }
    emptyState.classList.add("hidden");

    collections.forEach((collection) => {
        const tr = document.createElement("tr");
        tr.classList.add("collections-row");

        // Name cell
        const nameTd = document.createElement("td");
        nameTd.classList.add("collections-cell");

        const nameWrapper = document.createElement("div");
        nameWrapper.classList.add("collections-name-wrapper");

        const nameIcon = document.createElement("span");
        nameIcon.classList.add("material-symbols-outlined", "collections-folder-icon");
        nameIcon.textContent = "folder_special";

        const nameText = document.createElement("span");
        nameText.classList.add("collections-name-text");
        nameText.textContent = collection.name;

        nameWrapper.appendChild(nameIcon);
        nameWrapper.appendChild(nameText);
        nameTd.appendChild(nameWrapper);

        // Documents cell
        const docsTd = document.createElement("td");
        docsTd.classList.add("collections-cell");
        const count = collection.doc_count || 0;
        docsTd.textContent = `${count} document${count !== 1 ? "s" : ""}`;

        // Created cell
        const createdTd = document.createElement("td");
        createdTd.classList.add("collections-cell", "collections-cell-date");
        createdTd.textContent = formatDate(collection.created_at);

        // Actions cell
        const actionsTd = document.createElement("td");
        actionsTd.classList.add("collections-cell", "collections-cell-actions");

        const renameBtn = document.createElement("button");
        renameBtn.classList.add("collections-action-btn");
        renameBtn.title = "Rename";
        renameBtn.innerHTML = `<span class="material-symbols-outlined">edit</span>`;
        renameBtn.addEventListener("click", () => startRename(tr, nameTd, collection));

        const deleteBtn = document.createElement("button");
        deleteBtn.classList.add("collections-action-btn", "collections-action-danger");
        deleteBtn.title = "Delete";
        deleteBtn.innerHTML = `<span class="material-symbols-outlined">delete</span>`;
        deleteBtn.addEventListener("click", () => confirmDelete(collection));

        actionsTd.appendChild(renameBtn);
        actionsTd.appendChild(deleteBtn);

        tr.appendChild(nameTd);
        tr.appendChild(docsTd);
        tr.appendChild(createdTd);
        tr.appendChild(actionsTd);
        tableBody.appendChild(tr);
    });
};

// ==================== CREATE ====================
const showCreateRow = () => {
    createBtn.classList.add("hidden");
    createRow.classList.remove("hidden");
    createInput.value = "";
    createInput.focus();
};

const hideCreateRow = () => {
    createRow.classList.add("hidden");
    createBtn.classList.remove("hidden");
};

const submitCreate = async () => {
    const name = createInput.value.trim();
    if (!name) return;

    const newCollection = await apiCreateCollection(name);
    collections.push({ ...newCollection, doc_count: 0, created_at: new Date().toISOString() });
    hideCreateRow();
    renderTable();
    notifySidebar();
};

// ==================== INLINE RENAME ====================
const setActionsDisabled = (disabled) => {
    tableBody.querySelectorAll(".collections-action-btn").forEach((btn) => {
        btn.disabled = disabled;
        btn.style.pointerEvents = disabled ? "none" : "";
        btn.style.opacity = disabled ? "0.3" : "";
    });
};

const startRename = (tr, nameTd, collection) => {
    if (renameActive) { return; }
    renameActive = true;

    // Avoid double-editing
    if (nameTd.querySelector(".collections-rename-input")) { return; }

    const nameWrapper = nameTd.querySelector(".collections-name-wrapper");
    const actionsTd = tr.querySelector(".collections-cell-actions");
    nameWrapper.classList.add("hidden");
    actionsTd.classList.add("hidden");
    setActionsDisabled(true);

    const input = document.createElement("input");
    input.type = "text";
    input.classList.add("collections-rename-input");
    input.value = collection.name;
    input.maxLength = 128;

    const confirmBtn = document.createElement("button");
    confirmBtn.classList.add("collections-rename-confirm");
    confirmBtn.innerHTML = `<span class="material-symbols-outlined">check</span>`;

    const cancelBtn = document.createElement("button");
    cancelBtn.classList.add("collections-rename-cancel");
    cancelBtn.innerHTML = `<span class="material-symbols-outlined">close</span>`;

    const controls = document.createElement("div");
    controls.classList.add("collections-rename-controls");
    controls.appendChild(input);
    controls.appendChild(confirmBtn);
    controls.appendChild(cancelBtn);
    nameTd.appendChild(controls);

    input.focus();
    input.select();

    const finish = async (save) => {
        if (save) {
            const newName = input.value.trim();
            if (newName && newName !== collection.name) {
                await apiUpdateCollection(newName, collection.id);
                collection.name = newName;
                notifySidebar();
            }
        }
        renameActive = false;
        setActionsDisabled(false);
        controls.remove();
        nameWrapper.classList.remove("hidden");
        actionsTd.classList.remove("hidden");
        renderTable();
    };

    confirmBtn.addEventListener("click", () => finish(true));
    cancelBtn.addEventListener("click", () => finish(false));
    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") finish(true);
        if (e.key === "Escape") finish(false);
    });
};

// ==================== DELETE ====================
const confirmDelete = (collection) => {
    if (renameActive) return;
    showConfirmDialogue({
        title: "Delete Collection",
        message: `Delete "${collection.name}" and all its documents? This cannot be undone.`,
        confirmLabel: "Delete",
        onConfirm: async () => {
            await apiDeleteCollection(collection.id);
            collections = collections.filter(c => c.id !== collection.id);
            renderTable();
            notifySidebar();
        }
    });
};

// ---- Event Listeners ----
createBtn.addEventListener("click", showCreateRow);
createConfirmBtn.addEventListener("click", submitCreate);
createCancelBtn.addEventListener("click", hideCreateRow);
createInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitCreate();
    if (e.key === "Escape") hideCreateRow();
});

document.addEventListener("collections-changed", async () => {
    collections = await fetchCollections();
    renderTable();
});

// ---- Initialise ----
document.addEventListener("page-changed", async (e) => {
    if (e.detail === "collections") {
        collections = await fetchCollections();
        renderTable();
    }
});

const init = async () => {
    collections = await fetchCollections();
    renderTable();
};

init();