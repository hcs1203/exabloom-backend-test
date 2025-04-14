// generate.js
// ---------------------------------------------
// Bulk data generator for 'contacts' and 'messages' tables in PostgreSQL.
// Intended for large-scale testing (100k contacts, 5M messages).
// ---------------------------------------------

const express = require('express');
const { Client } = require('pg');
const faker = require('faker');
const fs = require('fs');
const csv = require('csv-parser');

const app = express();
const port = 3001;

// PostgreSQL client setup
const con = new Client({
    host: "localhost",
    user: "postgres",
    port: 5432,
    password: "psDB1234",
    database: "Communication",
});

// Configuration: batch sizes and volume
const BATCH_SIZE = 1000;
const TOTAL_CONTACTS = 100000;
const TOTAL_MESSAGES = 5000000;

(async () => {
    try {
        await con.connect();
        console.log("✅ Connected to DB");

        // Create necessary indexes for optimisation
        await setupIndexes();

        const messageContents = [];

        // Read possible message contents from CSV
        fs.createReadStream('message_content.csv')
            .pipe(csv())
            .on('data', (row) => {
                const content = row.content || Object.values(row)[0]; 
                if (content) messageContents.push(content);
            })
            .on('end', async () => {
                if (messageContents.length === 0) {
                    throw new Error("❌ message_content.csv is empty or missing a 'content' column.");
                }

                console.log(`✅ Loaded ${messageContents.length} messages from CSV`);

                // Generate contacts and messages after loading template messages
                const contactIds = await generateContacts();
                await generateMessages(contactIds, messageContents);

                console.log("🎉 Data generation complete.");
                await con.end(); 
            });

    } catch (err) {
        console.error("❌ Error:", err);
    }
})();

/**
 * Sets up PostgreSQL indexes and extensions needed for performance and full-text search.
 */
async function setupIndexes() {
    const indexQueries = [
        `CREATE EXTENSION IF NOT EXISTS pg_trgm;`, // Enable trigram search (for fuzzy matching)
        `CREATE INDEX IF NOT EXISTS idx_messages_contact_created ON messages (contact_id, created_at DESC);`, // Optimized for recent messages per contact
        `CREATE INDEX IF NOT EXISTS idx_contacts_id ON contacts (id);`, // Fast contact ID lookup
        `CREATE INDEX IF NOT EXISTS idx_messages_content_trgm ON messages USING gin (content gin_trgm_ops);`, // Fuzzy full-text search on message content
        `CREATE INDEX IF NOT EXISTS idx_contacts_phone_trgm ON contacts USING gin (phone_number gin_trgm_ops);` // Fuzzy search on phone numbers
    ];

    for (const query of indexQueries) {
        try {
            await con.query(query);
            console.log(`✅ Executed: ${query.split('\n')[0].trim()}`);
        } catch (err) {
            console.error(`❌ Index Setup Error:\n${query}`, err.message);
        }
    }
}

/**
 * Generates and inserts synthetic contact records in batches.
 * Returns an array of inserted contact IDs for use in message generation.
 */
async function generateContacts() {
    const allContactIds = [];

    for (let i = 0; i < TOTAL_CONTACTS; i += BATCH_SIZE) {
        const contacts = [];

        // Generate a batch of contacts
        for (let j = 0; j < BATCH_SIZE; j++) {
            const timestamp = faker.date.past(); 
            contacts.push([
                faker.phone.phoneNumber(),
                timestamp,
                timestamp
            ]);
        }

        // Dynamically generate parameter placeholders for batch insert
        const insertQuery = `
            INSERT INTO contacts (phone_number, created_at, updated_at)
            VALUES ${contacts.map((_, idx) => `($${idx * 3 + 1}, $${idx * 3 + 2}, $${idx * 3 + 3})`).join(',')}
            RETURNING id`;

        // Insert and collect returned contact IDs
        const res = await con.query(insertQuery, contacts.flat());
        res.rows.forEach(row => allContactIds.push(row.id));

        console.log(`✅ Inserted contacts ${i + 1}–${i + BATCH_SIZE}`);
    }

    return allContactIds;
}

/**
 * Generates and inserts synthetic message records in batches.
 * Uses previously generated contact IDs and message templates.
 */
async function generateMessages(contactIds, messageContents) {
    const totalBatches = Math.ceil(TOTAL_MESSAGES / BATCH_SIZE);

    for (let batch = 0; batch < totalBatches; batch++) {
        const messages = [];

        // Generate a batch of messages
        for (let i = 0; i < BATCH_SIZE - 1; i++) {
            const contactId = contactIds[Math.floor(Math.random() * contactIds.length)];
            const content = messageContents[Math.floor(Math.random() * messageContents.length)];
            const createdAt = faker.date.past(); 

            messages.push([contactId, content, createdAt]);
        }

        // Generate SQL and parameterize
        const insertQuery = `
            INSERT INTO messages (contact_id, content, created_at)
            VALUES ${messages.map((_, idx) => `($${idx * 3 + 1}, $${idx * 3 + 2}, $${idx * 3 + 3})`).join(',')}`;

        // Transaction to ensure atomicity
        await con.query('BEGIN');
        await con.query(insertQuery, messages.flat());
        await con.query('COMMIT');

        console.log(`📦 Inserted message batch ${batch + 1} of ${totalBatches}`);
    }
}

// HTTP server (used to trigger generation or health checks)
app.listen(port, () => {
    console.log(`🚀 Generator server running at http://localhost:${port}`);
});
