import db from '../config/db.js';

const LinkedinTable = async () => {
    try {
        await db.execute(`

    CREATE TABLE IF NOT EXISTS linkedin_users (

    id INT AUTO_INCREMENT PRIMARY KEY,
    linkedin_id VARCHAR(255) UNIQUE,
    name VARCHAR(255),
    email VARCHAR(255),
    linkedin_access_token TEXT,
    profile_picture TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
    `);
        console.log("✅ LinkedIn users table checked/created successfully");
    } catch (err) {
        console.error("❌ Error creating LinkedIn users table:", err);
    }
};

export default LinkedinTable;   