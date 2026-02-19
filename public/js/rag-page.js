// public/js/rag-page.js
import { getCollectionStats, queryRag } from "./rag-client.js";

// ---- DOM refs ----
const statsDocuments = document.getElementById("ragStatDocuments");
const statsChunks    = document.getElementById("ragStatChunks");
const statsEmbeds    = document.getElementById("ragStatEmbeds");
const chatMessages   = document.getElementById("ragChatMessages");
const textarea       = document.getElementById("ragInput");
const sendBtn        = document.getElementById("ragSendBtn");
const noCollection   = document.getElementById("ragNoCollection");
const chatContainer  = document.getElementById("ragChatContainer");
const statsRow       = document.getElementById("ragStatsRow");

// ---- State ----
let activeCollectionId = null;
let isGenerating = false;

// ==================== STATS ====================
const fetchAndRenderStats = async (collectionId) => {
    const collectionStats = await getCollectionStats(collectionId);
    animateCount(statsDocuments, collectionStats.documents);
    animateCount(statsChunks,    collectionStats.chunks);
    animateCount(statsEmbeds,    collectionStats.embeddings);
};

const animateCount = (el, target) => {
    if (!el) return;
    const start    = parseInt(el.textContent, 10) || 0;
    const duration = 400;
    const startTime = performance.now();

    const step = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased    = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(start + (target - start) * eased);
        if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
};

// ==================== COLLECTION SWITCH ====================
const setCollection = async (collectionId) => {
    activeCollectionId = collectionId;

    if (!collectionId) {
        noCollection.classList.remove("hidden");
        chatContainer.classList.add("hidden");
        statsRow.classList.add("hidden");
        return;
    }

    noCollection.classList.add("hidden");
    chatContainer.classList.remove("hidden");
    statsRow.classList.remove("hidden");

    await fetchAndRenderStats(collectionId);
};

// ==================== RENDER MESSAGES ====================
const renderUserMessage = (text) => {
    const wrapper = document.createElement("div");
    wrapper.classList.add("rag-message", "user");

    wrapper.innerHTML = `
        <div class="rag-message-meta">
            <div class="rag-message-avatar">
                <span class="material-symbols-outlined">person</span>
            </div>
            <span>You</span>
        </div>
        <div class="rag-message-bubble">${escapeHtml(text)}</div>
    `;

    chatMessages.appendChild(wrapper);
    scrollToBottom();
};

const renderTypingIndicator = () => {
    const el = document.createElement("div");
    el.id = "ragTypingIndicator";
    el.classList.add("rag-typing-indicator");
    el.innerHTML = `
        <div class="rag-typing-dots">
            <span></span><span></span><span></span>
        </div>
        <span class="rag-typing-label">Searching knowledge base…</span>
    `;
    chatMessages.appendChild(el);
    scrollToBottom();
    return el;
};

const removeTypingIndicator = () => {
    document.getElementById("ragTypingIndicator")?.remove();
};

const renderAssistantMessage = (text, sources = []) => {
    removeTypingIndicator();

    const wrapper = document.createElement("div");
    wrapper.classList.add("rag-message", "assistant");

    const sourcesHtml = sources.length > 0 ? `
        <div class="rag-sources">
            <span class="rag-sources-label">Sources</span>
            <div class="rag-sources-chips">
                ${sources.map(s => `
                    <button class="rag-source-chip" title="${escapeHtml(s.excerpt)}">
                        <span class="material-symbols-outlined">picture_as_pdf</span>
                        <span class="rag-source-chip-name">${escapeHtml(s.documentName)}</span>
                    </button>
                `).join("")}
            </div>
        </div>
    ` : "";

    wrapper.innerHTML = `
        <div class="rag-message-meta">
            <div class="rag-message-avatar">
                <span class="material-symbols-outlined">smart_toy</span>
            </div>
            <span>Assistant</span>
        </div>
        <div class="rag-message-bubble">${escapeHtml(text)}</div>
        ${sourcesHtml}
    `;

    chatMessages.appendChild(wrapper);
    scrollToBottom();
};

const renderErrorMessage = (errorText) => {
    removeTypingIndicator();

    const wrapper = document.createElement("div");
    wrapper.classList.add("rag-message", "assistant", "error");

    wrapper.innerHTML = `
        <div class="rag-message-meta">
            <div class="rag-message-avatar">
                <span class="material-symbols-outlined">error</span>
            </div>
            <span>Error</span>
        </div>
        <div class="rag-message-bubble">${escapeHtml(errorText)}</div>
    `;

    chatMessages.appendChild(wrapper);
    scrollToBottom();
};

// ==================== SEND ====================
const sendMessage = async () => {
    const text = textarea.value.trim();
    if (!text || isGenerating || !activeCollectionId) return;

    setGenerating(true);
    textarea.value = "";
    autoResize();
    removeEmptyState();

    renderUserMessage(text);
    renderTypingIndicator();

    try {
        const result = await queryRag(text, activeCollectionId);
        renderAssistantMessage(result.answer, result.sources);
    } catch (error) {
        console.error("RAG query failed:", error);
        renderErrorMessage(error.message || "Something went wrong. Is Ollama running?");
    } finally {
        setGenerating(false);
    }
};

const removeEmptyState = () => {
    chatMessages.querySelector(".rag-chat-empty")?.remove();
};

const setGenerating = (val) => {
    isGenerating = val;
    sendBtn.disabled = val;
    textarea.disabled = val;
};

// ==================== HELPERS ====================
const scrollToBottom = () => {
    chatMessages.scrollTop = chatMessages.scrollHeight;
};

const escapeHtml = (str) =>
    str.replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

const autoResize = () => {
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
};

// ==================== EVENT LISTENERS ====================
sendBtn.addEventListener("click", sendMessage);

textarea.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

textarea.addEventListener("input", autoResize);

// Sidebar fires this when the active collection changes
document.addEventListener("collection-selected", async (e) => {
    await setCollection(e.detail.collectionId);
});

// Also refresh stats when documents are added/removed
document.addEventListener("collections-changed", async () => {
    if (activeCollectionId) {
        await fetchAndRenderStats(activeCollectionId);
    }
});

// ==================== INIT ====================
// Wait for sidebar to broadcast its initial selection
document.addEventListener("page-changed", async (e) => {
    if (e.detail === "rag" && activeCollectionId) {
        await fetchAndRenderStats(activeCollectionId);
    }
});