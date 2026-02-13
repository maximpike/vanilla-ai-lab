// sidebar-left.js
const sidebar = document.querySelector('.sidebar-left');
const collapseBtn = document.querySelector('.sidebar-left-collapse-btn');

collapseBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
});