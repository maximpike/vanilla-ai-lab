// services/embedding-service.js
const OLLAMA_BASE_URL = "http://localhost:11434";
const MODEL = "nomic-embed-text";

/**
 * Generate an embedding vector for a single text string.
 * @param {string} text
 * @returns {Promise<number[]>} - 768-dimensional float array.
 */
export const embed = async (text) => {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/embed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: MODEL, input: text }),
    });

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`Ollama embed failed (${response.status}) ${body}`);
    }

    const data = await response.json();

    // Ollama's /api/embed returns { embeddings: [[...]] } for single input
    return data.embeddings[0];
}

/**
 * Generate embeddings for an array of texts in one call.
 * Ollama's /api/embed accepts an array as `input`, so we get
 * a batch response instead of N round trips.
 *
 * @param {string[]} texts
 * @returns {Promise<number[][]>} - Array of 768-d vectors, same order as input.
 */
export const embedBatch = async (texts) => {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/embed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: MODEL, input: texts }),
    });

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`Ollama batch embed failed (${response.status}): ${body}`);
    }

    const data = await response.json();

    // Ollama returns { embeddings: [[...], [...], [...]] } One vector per input text, same order
    return data.embeddings;
}

/**
 * Health check — verify Ollama is running and all required models are available.
 *
 * @param {string[]} requiredModels - Array of model names to check (e.g., ["nomic-embed-text", "llama3.2"])
 * @returns {Promise<{ available: boolean, models?: string[], reason?: string }>}
 */
export const checkOllamaStatus = async (requiredModels = ["nomic-embed-text"]) => {
    try {
        // 1. Check if Ollama is running
        const tagsResponse = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
        if (!tagsResponse.ok) {
            return { available: false, reason: "Ollama is not responding" };
        }

        const tagsData = await tagsResponse.json();

        // 2. Create a clean list of installed models
        const installedModels = tagsData.models?.map((m) => m.name) || [];

        // 3. Check if any required models are missing
        const missingModels = requiredModels.filter((reqModel) =>
            !installedModels.includes(reqModel) && !installedModels.includes(`${reqModel}:latest`)
        );

        if (missingModels.length > 0) {
            const missingList = missingModels.join(", ");
            return {
                available: false,
                reason: `Missing models: ${missingList}. Run: ollama pull <model_name>`,
                missing: missingModels // Exposing this in case you want to auto-pull them programmatically!
            };
        }

        return { available: true, models: requiredModels };
    } catch (error) {
        return {
            available: false,
            reason: "Cannot connect to Ollama. Is it running? (Ollama serve)",
        };
    }
};
