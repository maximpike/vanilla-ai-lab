// services/pdf-extractor.js
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const uploadsDir = join(__dirname, "..", "uploads")


/**
 * Extract all text content from a PDF on disk.
 *
 * @param {string} collectionId - The collection the document belongs to.
 * @param {string} fileName     - The stored file name (uuid_original.pdf).
 * @returns {Promise<string>}     Concatenated text from every page.
 */
export const extractText = async (collectionId, fileName) => {
    const filePath = join(uploadsDir, collectionId, fileName);
    const doc = await getDocument(filePath).promise;

    const pages = [];
    for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
            .map(item => item.hasEOL ? item.str + "\n" : item.str)
            .join("");
        pages.push(pageText);
    }
    return pages.join("\n\n");
}