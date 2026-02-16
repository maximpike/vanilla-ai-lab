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
 * Health check — verify Ollama is running and the model is available.
 *
 * @returns {Promise<{ available: boolean, model?: string, reason?: string }>}
 */
export const checkOllamaStatus = async () => {
    try {
        // Check if Ollama is running
        const tagsResponse = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
        if (!tagsResponse.ok) {
            return {available: false, reason: "Ollama is not responding"};
        }

        //Check if our embedding model is pulled
        const tagsData = await tagsResponse.json()
        const modelInstalled = tagsData.models?.some(
            (model) => model.name === MODEL || model.name === `${MODEL}:latest`
        );

        if (!modelInstalled) {
            return {
                available: false,
                reason: `Model "${MODEL}" not found. Run: ollama pull ${MODEL}`,
            };
        }

        return {available: true, model: MODEL};
    } catch (error) {
        return {
            available: false,
            reason: "Cannot connect to Ollama. Is it running? (Ollama serve)",
        };
    }
};
