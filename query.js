// query.js
// ---------------------------------------------
// REST API for querying contacts and messages in the Communication DB
// Provides endpoints for latest conversations, paginated results, and search.
// ---------------------------------------------

const express = require('express');
const { Client } = require('pg');
const app = express();
const port = 3000;

// PostgreSQL connection configuration
const con = new Client({
    host: "localhost",
    user: "postgres",
    port: 5432,
    password: "psDB1234",
    database: "Communication",
});

// Establish DB connection on server start
(async () => {
    await con.connect();
    console.log("✅ Connected to DB");
})();

/**
 * Task 1: Implement an efficient query to retrieve the 50 most recent conversations
 */
app.get('/conversations/latest', async (req, res) => {
    const query = `
        SELECT DISTINCT ON (m.contact_id)
            m.contact_id,
            c.phone_number,
            m.content,
            m.created_at AS timestamp
        FROM messages m
        JOIN contacts c ON m.contact_id = c.id
        ORDER BY m.contact_id, m.created_at DESC
        LIMIT 50;
    `;

    const result = await con.query(query);
    res.json(result.rows);
});

/**
 * Task 2: GIncorporate pagination functionality to allow retrieval of subsequent sets of 50 conversations.
 * Query param: ?offset=0 (or any multiple of 50)
 */
app.get('/conversations', async (req, res) => {
    const offset = parseInt(req.query.offset) || 0;

    const query = `
        SELECT DISTINCT ON (m.contact_id)
            m.contact_id,
            c.phone_number,
            m.content,
            m.created_at AS timestamp
        FROM messages m
        JOIN contacts c ON m.contact_id = c.id
        ORDER BY m.contact_id, m.created_at DESC
        OFFSET $1
        LIMIT 50;
    `;

    const result = await con.query(query, [offset]);
    res.json(result.rows);
});

/**
 * Task 3: Implement a search feature that accepts a "searchValue" parameter
 */
app.get('/conversations/search', async (req, res) => {
    const term = req.query.q || '';

    const query = `
        SELECT DISTINCT ON (m.contact_id)
            m.contact_id,
            c.phone_number,
            m.content,
            m.created_at AS timestamp
        FROM messages m
        JOIN contacts c ON m.contact_id = c.id
        WHERE 
            m.content ILIKE '%' || $1 || '%' OR
            c.phone_number ILIKE '%' || $1 || '%'
        ORDER BY m.contact_id, m.created_at DESC
        LIMIT 50;
    `;

    const result = await con.query(query, [term]);
    res.json(result.rows);
});

/**
 * Start the Express server on port 3000
 */
app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
});
