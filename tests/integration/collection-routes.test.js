import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";

const BASE_URL = "http://localhost:3001";
let server;

beforeAll(async () => {
    const { app } = await import("../../app.js");
    server = app.listen(3001);
});

afterAll(async () => {
    if (server) {
        await new Promise((resolve) => server.close(resolve));
    }
});

describe("Collection Routes — Integration", () => {

    let createdId;

    test("POST /api/collections creates a collection", async () => {
        const res = await fetch(`${BASE_URL}/api/collections`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Integration Test Collection" }),
        });

        expect(res.status).toBe(201);

        const data = await res.json();
        expect(data).toHaveProperty("id");
        expect(data.name).toBe("Integration Test Collection");

        createdId = data.id;
    });

    test("GET /api/collections lists collections including the new one", async () => {
        const res = await fetch(`${BASE_URL}/api/collections`);

        expect(res.status).toBe(200);

        const data = await res.json();
        expect(Array.isArray(data)).toBe(true);

        const found = data.find(c => c.id === createdId);
        expect(found).toBeDefined();
        expect(found.name).toBe("Integration Test Collection");
        expect(found.doc_count).toBe(0);
    });

    test("PUT /api/collections/:id renames the collection", async () => {
        const res = await fetch(`${BASE_URL}/api/collections/${createdId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Renamed Collection" }),
        });

        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data.name).toBe("Renamed Collection");
    });

    test("DELETE /api/collections/:id removes the collection", async () => {
        const res = await fetch(`${BASE_URL}/api/collections/${createdId}`, {
            method: "DELETE",
        });

        expect(res.status).toBe(204);

        // Verify it's actually gone
        const listRes = await fetch(`${BASE_URL}/api/collections`);
        const collections = await listRes.json();
        const found = collections.find(c => c.id === createdId);
        expect(found).toBeUndefined();
    });

    test("POST /api/collections with missing name returns 400", async () => {
        const res = await fetch(`${BASE_URL}/api/collections`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
        });

        expect(res.status).toBe(400);
    });
});