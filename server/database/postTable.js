import db from './db.js';

const postTable = async () => {
  try {
    await db.execute(`
    CREATE TABLE IF NOT EXISTS posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    scheduled_at DATETIME NOT NULL,
    status ENUM('pending', 'published', 'failed', 'draft') DEFAULT 'pending',
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
    `);
    console.log("✅ Post table checked/created successfully");
  } catch (err) {
    console.error("❌ Error creating post table:", err);
  } 
};

export default postTable;   
