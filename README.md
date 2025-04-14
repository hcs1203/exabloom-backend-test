# 📡 Exabloom Backend Technical Test

This repository contains the full backend implementation for the Exabloom technical assessment. It includes:

- PostgreSQL database setup with optimized schema
- High-performance data generation of 100,000 contacts and 5 million messages
- Express.js server with endpoints to retrieve, paginate, and search conversations

---

🛠️ System Requirements

- Node.js v18+
- PostgreSQL v14+
- npm (comes with Node.js)
- message_content.csv file (available from Google Drive)

---

📦 Installation & Setup

1. Clone the Repository

    git clone https://github.com/hcs1203/exabloom-backend-test.git
    
    cd exabloom-backend-test

2. Install Dependencies

    npm install

3. PostgreSQL Setup

a. Create the Database

    CREATE DATABASE "Communication";

b. Connect to the Database and Create Tables

    -- Table: contacts
    CREATE TABLE contacts (
        id SERIAL PRIMARY KEY,
        phone_number VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL
    );

    -- Table: messages
    CREATE TABLE messages (
        id SERIAL PRIMARY KEY,
        contact_id INTEGER NOT NULL REFERENCES contacts(id),
        content TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL
    );

---

📄 Running the Generator

1. Place message_content.csv in the root directory

Download it from: https://drive.google.com/file/d/1hwQyxSSYU5dhBjjZSbRiGC0QDafnLqyZ/view?usp=sharing

2. Start the Data Generation

    node generate.js

This will:
- Create indexes for performance optimization
- Load message contents from CSV
- Generate 100,000 contacts
- Generate 5 million messages across those contacts

⏳ This process may take 10–20 minutes depending on your system.

---

🚀 Running the Server

    node query.js

The server will start on http://localhost:3000

---

📘 API Endpoints

1. Get Latest 50 Conversations

    GET /conversations/latest

2. Paginate Conversations

    GET /conversations?offset=50

3. Search Conversations by Message or Phone

    GET /conversations/search?q=hello

---

📌 Assumptions Made

- Each conversation is represented by the most recent message from a contact.
- No need to normalize message content as the focus is on performance.
- Contact names were omitted from the schema as the original spec and CSV lacked them.
- Realistic message distribution achieved via random assignment.

---

⚙️ Design Decisions

- Indexing: Used GIN indexes and pg_trgm extension for fast ILIKE and fuzzy search.
- Batch Inserts: Reduced DB load by inserting 1000 rows at a time.
- DISTINCT ON: Used to retrieve the latest message per contact efficiently.
- Connection Pooling: Avoided for simplicity; can be added with pg.Pool for production readiness.
- Search Optimization: Limited search results to 50 with index-backed search across messages and phone numbers.

---

🎥 Demo Video

🔗 [Loom Video Demo](https://www.loom.com/share/993683f6753c417faa1d8de7f17538ab?sid=455761ca-76cf-49e2-9a23-0c86a3a82576)

---

📂 Directory Structure

.
├── generate.js           # Data generation script
├── query.js              # Express server with endpoints
├── message_content.csv   # Sample Messages Given
└── README.md             # This file

---

👤 **Author**

Hannah Caroline Solomonraj  
Year 3 Computer Science Student  
National University of Singapore (NUS)
