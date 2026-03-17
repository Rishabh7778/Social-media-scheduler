import db from '../config/db.js';

const SocialAccounts = async () => {
  try {
    await db.execute(`
    CREATE TABLE IF NOT EXISTS social_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL, -- Yeh tumhari main 'users' table ke ID se link hoga
    provider VARCHAR(50) NOT NULL, -- Isme hum 'facebook' likhenge
    social_id VARCHAR(255) NOT NULL, -- Facebook ki unique ID
    profile_name VARCHAR(255), -- User ka naam (e.g., Satyam Singh)
    access_token TEXT NOT NULL, -- Wo lamba wala VIP Token yahan aayega
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)
        `);
    console.log("✅ Social table checked/created successfully");
  } catch (err) {
    console.error("❌ Error creating social table:", err);
  } 
};

export default SocialAccounts;  