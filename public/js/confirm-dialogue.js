// confirm-dialogue.js
let backdrop = null;

const buildDialogue = () => {
    backdrop = document.createElement("div");
    backdrop.className = "confirm-delete-backdrop";
    backdrop.innerHTML = `
        <div class="confirm-delete-dialogue">
            <h4 class="confirm-dialogue-title"></h4>
            <p class="confirm-dialogue-message"></p>
            <div class="confirm-delete-actions">
                <button class="btn-cancel-delete">Cancel</button>
                <button class="btn-confirm-delete">Delete</button>
            </div>
        </div>
    `;
    document.body.appendChild(backdrop);
};

/**
 * Show a confirmation dialogue.
 *
 * @param {object}   options
 * @param {string}   options.title          - Dialogue heading.
 * @param {string}   options.message        - Body text shown to the user.
 * @param {string}  [options.confirmLabel]  - Label for the confirm button (default: "Delete").
 * @param {Function} options.onConfirm      - Called when the user confirms.
 */
export const showConfirmDialogue = ({ title, message, confirmLabel = "Delete", onConfirm }) => {
    if (!backdrop) {
        buildDialogue();
    }

    backdrop.querySelector(".confirm-dialogue-title").textContent = title;
    backdrop.querySelector(".confirm-dialogue-message").textContent = message;

    const confirmBtn = backdrop.querySelector(".btn-confirm-delete");
    const cancelBtn = backdrop.querySelector(".btn-cancel-delete");
    confirmBtn.textContent = confirmLabel;

    backdrop.classList.add("visible");

    const hide = () => backdrop.classList.remove("visible");

    confirmBtn.onclick = () => { hide(); onConfirm(); };
    cancelBtn.onclick = hide;
    backdrop.onclick = (e) => { if (e.target === backdrop) hide(); };
};