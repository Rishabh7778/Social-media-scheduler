import db from '../config/db.js';

const FacebookTable = async () => {
    try {
        await db.execute(`
        CREATE TABLE IF NOT EXISTS facebook_users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            facebook_id VARCHAR(255) UNIQUE,
            name VARCHAR(255),
            email VARCHAR(255),
            facebook_access_token TEXT,
            profile_picture TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
        `);
        console.log("✅ Facebook users table checked/created successfully");
    } catch (err) {
        console.error("❌ Error creating Facebook users table:", err);
    }
};

export default FacebookTable;