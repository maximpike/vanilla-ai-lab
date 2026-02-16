// public/js/router.js
const pages = document.querySelectorAll(".main-content [data-page]");
const navLinks = document.querySelectorAll(".sidebar-left-nav a[data-page]");

/**
 * Navigate to a page by name.
 * Shows the matching section, hides the rest, and updates the active nav link.
 *
 * @param {string} pageName - Must match a data-page attribute value.
 */
export const navigateTo = (pageName) => {
    pages.forEach((section) => {
        section.classList.toggle("hidden", section.dataset.page !== pageName);
    });

    navLinks.forEach((link) => {
        link.classList.toggle("active", link.dataset.page === pageName);
    });
};

// ---- Event Listeners ----
navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
        event.preventDefault();
        navigateTo(link.dataset.page);
    });
});

// ---- Initialise ----
navigateTo("home");