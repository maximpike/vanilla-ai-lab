// services/chunker.js
const DEFAULT_CHUNK_SIZE = 500;      // target characters per chunk
const DEFAULT_CHUNK_OVERLAP = 50;    // characters shared between neighbours

/**
 * Split text into overlapping chunks, breaking at paragraph or sentence
 * boundaries when possible.
 *
 * @param {string} text                   - The full document text.
 * @param {object} [opts]
 * @param {number} [opts.chunkSize=500]   - Target chunk length in characters.
 * @param {number} [opts.chunkOverlap=50] - Overlap between consecutive chunks.
 * @returns {{ content: string, tokenEstimate: number }[]}
 */
export const chunkText = (text, opts = {}) => {
    const chunkSize = opts.chunkSize ?? DEFAULT_CHUNK_SIZE;
    const chunkOverlap = opts.chunkOverlap ?? DEFAULT_CHUNK_OVERLAP;

    if (!text || text.trim().length === 0) return [];

    const separators = ["\n\n", "\n", ". ", "! ", "? ", ", ", " "];
    const rawChunks = recursiveSplit(text, separators, chunkSize);

    // Merge small fragments with apply overlap
    return mergeWithOverlap(rawChunks, chunkSize, chunkOverlap);
}


/**
 * Recursively split text using progressively finer separators until
 * every piece is at or below chunkSize.
 *
 * @param {string}   text       - The text to split.
 * @param {string[]} separators - Ordered list of separators, coarsest first.
 * @param {number}   chunkSize  - Maximum character length per piece.
 * @returns {string[]} Array of text pieces, each at or below chunkSize.
 */
const recursiveSplit = (text, separators, chunkSize) => {
    if (text.length <= chunkSize) return [text];

    const sep = separators.find(s => text.includes(s));
    if (!sep) return [text]; // no separator found, return as-is

    const parts = text.split(sep);
    const remaining = separators.slice(separators.indexOf(sep) + 1);
    const result = [];

    for (const part of parts) {
        if (part.length <= chunkSize) {
            result.push(part);
        } else {
            result.push(...recursiveSplit(part, remaining, chunkSize));
        }
    }
    return result;
};

/**
 * Merge tiny fragments together, then apply overlap between neighbours.
 * Returns final chunk objects with a rough token estimate.
 *
 * @param {string[]} rawChunks    - Pieces from recursiveSplit.
 * @param {number}   chunkSize    - Maximum characters per merged chunk.
 * @param {number}   chunkOverlap - Characters to duplicate between neighbours.
 * @returns {{ content: string, tokenEstimate: number }[]}
 */
const mergeWithOverlap = (rawChunks, chunkSize, chunkOverlap) => {
    // 1) Merge small pieces into chunks up to chunkSize
    const merged = [];
    let buffer = "";

    for (const piece of rawChunks) {
        const trimmed = piece.trim();
        if (!trimmed) continue;

        if (buffer.length + trimmed.length + 1 > chunkSize && buffer.length > 0) {
            merged.push(buffer.trim());
            buffer = "";
        }
        buffer += (buffer ? " " : "") + trimmed;
    }

    if (buffer.trim()) {
        merged.push(buffer.trim());
    }

    // 2) Build final chunks with overlap
    return merged.map((content, i) => {
        let final = content;
        if (i > 0 && chunkOverlap > 0) {
            const prev = merged[i - 1];
            const overlapText = prev.slice(-chunkOverlap);
            final = overlapText + " " + content;
        }
        return {
            content: final,
            tokenEstimate: Math.ceil(final.length / 4)  // rough: ~4 chars per token
        };
    });
};
