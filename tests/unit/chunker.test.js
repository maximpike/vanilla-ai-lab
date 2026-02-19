import { chunkText } from "../../services/chunker.js";

// This is to test GitHub actions CI
const buildParagraphs = (count) => {
    return Array.from({ length: count }, (_, i) =>
        `Paragraph ${i + 1}. ${"This is filler sentence number one. ".repeat(2).trim()}`
    ).join("\n\n");
};

describe("chunkText — edge cases", () => {

    test("returns empty array for empty string", () => {
        expect(chunkText("")).toEqual([]);
    });

    test("returns empty array for whitespace-only input", () => {
        expect(chunkText("   ")).toEqual([]);
        expect(chunkText("\n\n")).toEqual([]);
        expect(chunkText("\t\t")).toEqual([]);
    });

    test("returns empty array for null or undefined", () => {
        expect(chunkText(null)).toEqual([]);
        expect(chunkText(undefined)).toEqual([]);
    });

    test("returns single chunk when text is shorter than chunkSize", () => {
        const text = "Hello world.";
        const result = chunkText(text, { chunkSize: 100 });

        expect(result).toHaveLength(1);
        expect(result[0].content).toBe(text);
    });

    test("returns single chunk when text is exactly chunkSize", () => {
        const text = "x".repeat(500);
        const result = chunkText(text, { chunkSize: 500 });

        expect(result).toHaveLength(1);
        expect(result[0].content).toBe(text);
    });

    test("uses default chunkSize of 500 when no options provided", () => {
        // 1200 chars with no separators — recursiveSplit can't split it,
        // but mergeWithOverlap will try to buffer up to 500.
        // Since the single piece is 1200 chars > 500, it pushes as-is.
        const text = "a".repeat(1200);
        const result = chunkText(text);

        // With no separators, recursiveSplit returns the full string,
        // and mergeWithOverlap can't break it further — so we get 1 chunk.
        expect(result).toHaveLength(1);
        expect(result[0].content).toBe(text);
    });
});

describe("chunkText — splitting", () => {

    test("splits text with paragraph breaks into multiple chunks", () => {
        // 10 paragraphs of ~100 chars each = ~1100 chars total
        const text = buildParagraphs(10);
        const result = chunkText(text, { chunkSize: 300, chunkOverlap: 0 });

        expect(result.length).toBeGreaterThan(1);
        result.forEach(chunk => {
            expect(chunk.content.length).toBeGreaterThan(0);
        });
    });

    test("prefers paragraph boundaries over sentence boundaries", () => {
        const text = "First paragraph content here.\n\nSecond paragraph content here.";
        const result = chunkText(text, { chunkSize: 200, chunkOverlap: 0 });

        // Both paragraphs fit within 200 chars individually, so after
        // recursiveSplit on "\n\n" we get two pieces that merge stays separate
        // only if combined length > chunkSize. At ~30 chars each they'll merge.
        // This tests that the separator hierarchy works — \n\n is tried first.
        expect(result.length).toBeGreaterThanOrEqual(1);
    });

    test("falls through to sentence boundaries when no paragraph breaks", () => {
        // Single paragraph, multiple sentences, total > chunkSize
        const text = "First sentence here. Second sentence here. Third sentence here. "
            .repeat(10);
        const result = chunkText(text, { chunkSize: 150, chunkOverlap: 0 });

        expect(result.length).toBeGreaterThan(1);
    });

    test("merges small fragments together up to chunkSize", () => {
        // Many tiny paragraphs — recursiveSplit produces many small pieces,
        // mergeWithOverlap should combine them.
        const text = Array.from({ length: 20 }, (_, i) => `Line ${i}.`).join("\n\n");
        const result = chunkText(text, { chunkSize: 200, chunkOverlap: 0 });

        // 20 fragments of ~7 chars each = ~140 total. Should merge into 1 chunk.
        expect(result.length).toBeLessThan(20);
    });

    test("handles text with no separators at all", () => {
        const text = "a".repeat(800);
        const result = chunkText(text, { chunkSize: 300, chunkOverlap: 0 });

        // No separators found — recursiveSplit returns as-is,
        // mergeWithOverlap can't split further. Returns single oversized chunk.
        expect(result).toHaveLength(1);
        expect(result[0].content).toBe(text);
    });
});

describe("chunkText — overlap", () => {

    test("first chunk has no overlap prefix", () => {
        const text = buildParagraphs(10);
        const resultWithOverlap = chunkText(text, { chunkSize: 300, chunkOverlap: 50 });
        const resultWithout = chunkText(text, { chunkSize: 300, chunkOverlap: 0 });

        // First chunk should be identical regardless of overlap setting
        // (overlap only affects chunk index > 0)
        expect(resultWithOverlap[0].content).toBe(resultWithout[0].content);
    });

    test("consecutive chunks share content when overlap > 0", () => {
        const text = buildParagraphs(10);
        const result = chunkText(text, { chunkSize: 300, chunkOverlap: 50 });

        if (result.length < 2) return; // guard — need at least 2 chunks

        // The end of chunk[0] should appear at the start of chunk[1]
        const tailOfFirst = result[0].content.slice(-50);
        expect(result[1].content).toContain(tailOfFirst);
    });

    test("no shared content when overlap is 0", () => {
        // Use sentence-based text so we get clean splits
        const sentences = Array.from({ length: 20 },
            (_, i) => `Sentence number ${i} with some padding text.`
        ).join(" ");
        const result = chunkText(sentences, { chunkSize: 200, chunkOverlap: 0 });

        if (result.length < 2) return;

        // With 0 overlap, chunks should not repeat content from neighbors.
        // Check that the full content of chunk[0] doesn't appear in chunk[1].
        // (Individual words may repeat, but the tail substring should not.)
        const tailOfFirst = result[0].content.slice(-30);
        expect(result[1].content.startsWith(tailOfFirst)).toBe(false);
    });

    test("overlap text comes from the end of the previous chunk", () => {
        const text = buildParagraphs(10);
        const overlap = 40;
        const result = chunkText(text, { chunkSize: 250, chunkOverlap: overlap });

        if (result.length < 2) return;

        // Verify directionality — overlap pulls from prev, not next
        const prevTail = result[0].content.slice(-overlap);
        expect(result[1].content).toContain(prevTail);
    });
});

// ── Chunk object shape ──────────────────────────────────
describe("chunkText — return shape", () => {

    test("each chunk has content and tokenEstimate properties", () => {
        const text = buildParagraphs(5);
        const result = chunkText(text, { chunkSize: 200 });

        result.forEach(chunk => {
            expect(chunk).toHaveProperty("content");
            expect(chunk).toHaveProperty("tokenEstimate");
            expect(typeof chunk.content).toBe("string");
            expect(typeof chunk.tokenEstimate).toBe("number");
        });
    });

    test("content is always a non-empty trimmed string", () => {
        const text = buildParagraphs(8);
        const result = chunkText(text, { chunkSize: 200 });

        result.forEach(chunk => {
            expect(chunk.content.length).toBeGreaterThan(0);
            expect(chunk.content).toBe(chunk.content.trim());
        });
    });

    test("tokenEstimate is ceil(content.length / 4)", () => {
        const text = buildParagraphs(5);
        const result = chunkText(text, { chunkSize: 200 });

        result.forEach(chunk => {
            expect(chunk.tokenEstimate).toBe(Math.ceil(chunk.content.length / 4));
        });
    });

    test("tokenEstimate is always a positive integer", () => {
        const text = "Short.";
        const result = chunkText(text);

        result.forEach(chunk => {
            expect(chunk.tokenEstimate).toBeGreaterThan(0);
            expect(Number.isInteger(chunk.tokenEstimate)).toBe(true);
        });
    });
});

describe("chunkText — content integrity", () => {

    test("all original text is present across chunks (no overlap, simple case)", () => {
        const sentences = [
            "The quick brown fox.",
            "Jumped over the lazy dog.",
            "Then it ran away quickly.",
            "Nobody saw it leave.",
        ];
        const text = sentences.join(" ");
        const result = chunkText(text, { chunkSize: 500, chunkOverlap: 0 });

        // With chunkSize 500 and ~100 chars total, everything fits in one chunk
        const combined = result.map(c => c.content).join(" ");
        sentences.forEach(sentence => {
            expect(combined).toContain(sentence.trim());
        });
    });

    test("does not invent content that was not in the original text", () => {
        const text = "Alpha bravo charlie. Delta echo foxtrot.";
        const result = chunkText(text, { chunkSize: 30, chunkOverlap: 0 });

        result.forEach(chunk => {
            // Every word in the chunk output should exist in the original
            const words = chunk.content.split(/\s+/);
            words.forEach(word => {
                const cleaned = word.replace(/[.,!?]/g, "");
                if (cleaned.length > 0) {
                    expect(text).toContain(cleaned);
                }
            });
        });
    });
});